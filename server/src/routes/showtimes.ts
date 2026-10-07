import { Router } from 'express';
import { one, purgeExpiredHolds, query, run, insert } from '../config/db.js';
import { auth, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();

const ENRICHED = `SELECT s.*, m.title AS movie_title, h.name AS hall_name, h.format, h.cinema_id, c.name AS cinema_name
  FROM showtimes s JOIN movies m ON m.id = s.movie_id
  LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN cinemas c ON c.id = h.cinema_id`;

router.get('/', async (req, res) => {
  const { movie_id, cinema_id, date } = req.query as { movie_id?: string; cinema_id?: string; date?: string };
  const where: string[] = [];
  const vals: (string | number)[] = [];
  if (movie_id) { where.push(`s.movie_id = $${vals.length + 1}`); vals.push(Number(movie_id)); }
  if (cinema_id) { where.push(`h.cinema_id = $${vals.length + 1}`); vals.push(Number(cinema_id)); }
  if (date) { where.push(`s.date = $${vals.length + 1}`); vals.push(date); }
  const sql = ENRICHED + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY s.date, s.time';
  res.json({ showtimes: await query(sql, vals) });
});

router.get('/movie/:movieId', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const { cinema_id } = req.query as { cinema_id?: string };
  let sql = ENRICHED + ' WHERE s.movie_id = $1 AND s.date >= $2';
  const vals: (string | number)[] = [Number(req.params.movieId), today];
  if (cinema_id) { sql += ` AND h.cinema_id = $${vals.length + 1}`; vals.push(Number(cinema_id)); }
  res.json({ showtimes: await query(sql + ' ORDER BY s.date, s.time', vals) });
});

router.get('/:id', async (req, res) => {
  const row = await one(ENRICHED + ' WHERE s.id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Showtime not found' });
  res.json({ showtime: row });
});

router.get('/:id/seats', auth, async (req: AuthRequest, res) => {
  await purgeExpiredHolds();
  const show = await one<{ id: number; hall_id: number }>('SELECT * FROM showtimes WHERE id = $1', [req.params.id]);
  if (!show) return res.status(404).json({ message: 'Showtime not found' });
  const all = await query<{ id: number; row: string; number: number }>(
    'SELECT * FROM seats WHERE hall_id = $1 ORDER BY "row", number', [show.hall_id]
  );
  const booked = await query<{ seat_id: number }>(
    'SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id WHERE b.showtime_id = $1 AND b.status != $2',
    [req.params.id, 'Cancelled']
  );
  const bookedSet = new Set(booked.map((b) => Number(b.seat_id)));
  const holds = await query<{ seat_id: number; user_id: number }>(
    "SELECT seat_id, user_id FROM seat_holds WHERE showtime_id = $1 AND expires_at > NOW()", [req.params.id]
  );
  const heldBy = new Map(holds.map((h) => [Number(h.seat_id), Number(h.user_id)]));
  res.json({
    hall_id: show.hall_id,
    seats: all.map((s) => ({
      ...s,
      seat_number: `${s.row}${s.number}`,
      is_available: !bookedSet.has(Number(s.id)) && !heldBy.has(Number(s.id)),
      is_held: heldBy.has(Number(s.id)),
      held_by_me: heldBy.get(Number(s.id)) === req.user!.id,
    })),
  });
});

async function validateHall(hall_id: unknown): Promise<string | null> {
  if (hall_id === undefined || hall_id === null || hall_id === '') return 'Hall is required';
  if (!await one('SELECT id FROM halls WHERE id = $1', [Number(hall_id)])) return 'Valid hall is required';
  return null;
}

router.post('/', auth, admin, async (req: AuthRequest, res) => {
  const { movie_id, hall_id, date, time } = req.body as { movie_id?: number; hall_id?: number; date?: string; time?: string };
  const errors: Record<string, string[]> = {};
  if (!movie_id || !await one('SELECT id FROM movies WHERE id = $1', [movie_id])) errors.movie_id = ['Valid movie is required'];
  const hallErr = await validateHall(hall_id);
  if (hallErr) errors.hall_id = [hallErr];
  if (!date) errors.date = ['Date is required'];
  else if (date < new Date().toISOString().slice(0, 10)) errors.date = ['Date must be today or in the future'];
  if (!time) errors.time = ['Time is required'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  const id = await insert('INSERT INTO showtimes (movie_id, hall_id, date, time) VALUES ($1, $2, $3, $4) RETURNING id', [Number(movie_id), Number(hall_id), String(date), String(time)]);
  const row = await one(ENRICHED + ' WHERE s.id = $1', [id]);
  res.status(201).json({ showtime: row, message: 'Showtime created successfully' });
});

router.put('/:id', auth, admin, async (req: AuthRequest, res) => {
  const show = await one('SELECT id FROM showtimes WHERE id = $1', [req.params.id]);
  if (!show) return res.status(404).json({ message: 'Showtime not found' });
  const { movie_id, hall_id, date, time } = req.body as { movie_id?: number; hall_id?: number; date?: string; time?: string };
  const errors: Record<string, string[]> = {};
  if (movie_id !== undefined && !await one('SELECT id FROM movies WHERE id = $1', [movie_id])) errors.movie_id = ['Valid movie is required'];
  if (hall_id !== undefined) {
    const hallErr = await validateHall(hall_id);
    if (hallErr) errors.hall_id = [hallErr];
  }
  if (date !== undefined && date < new Date().toISOString().slice(0, 10)) errors.date = ['Date must be today or in the future'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  const fields: string[] = [];
  const vals: (string | number | null)[] = [];
  if (movie_id !== undefined) { fields.push(`movie_id = $${vals.length + 1}`); vals.push(Number(movie_id)); }
  if (hall_id !== undefined) { fields.push(`hall_id = $${vals.length + 1}`); vals.push(Number(hall_id)); }
  if (date !== undefined) { fields.push(`date = $${vals.length + 1}`); vals.push(String(date)); }
  if (time !== undefined) { fields.push(`time = $${vals.length + 1}`); vals.push(String(time)); }
  if (fields.length) await run(`UPDATE showtimes SET ${fields.join(', ')}, updated_at=NOW() WHERE id = $${vals.length + 1}`, [...vals, req.params.id]);
  const row = await one(ENRICHED + ' WHERE s.id = $1', [req.params.id]);
  res.json({ showtime: row, message: 'Showtime updated successfully' });
});

router.delete('/:id', auth, admin, async (req: AuthRequest, res) => {
  const show = await one('SELECT id FROM showtimes WHERE id = $1', [req.params.id]);
  if (!show) return res.status(404).json({ message: 'Showtime not found' });
  await run('DELETE FROM showtimes WHERE id = $1', [req.params.id]);
  res.json({ message: 'Showtime deleted successfully' });
});

export default router;
