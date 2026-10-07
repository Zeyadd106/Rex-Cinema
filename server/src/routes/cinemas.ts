import { Router } from 'express';
import { insert, one, query, run } from '../config/db.js';
import { auth, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();
export const FORMATS = ['Standard', 'IMAX', 'MAX', 'GOLD', '4DX', 'KIDS'];

function cinemaImage(p: string | null): string | null {
  if (!p) return null;
  if (/^https?:\/\//.test(p)) return p;
  return `/uploads/cinemas/${p}`;
}

/** Public: list active cinemas */
router.get('/', async (_req, res) => {
  const rows = await query<Record<string, unknown>>(
    `SELECT c.*, (SELECT COUNT(*)::INT FROM halls h WHERE h.cinema_id = c.id) AS hall_count,
            (SELECT COUNT(*)::INT FROM showtimes s JOIN halls h ON h.id = s.hall_id WHERE h.cinema_id = c.id AND s.date >= to_char(CURRENT_DATE, 'YYYY-MM-DD')) AS upcoming_count
     FROM cinemas c WHERE c.is_active = 1 ORDER BY c.name`
  );
  res.json({ cinemas: rows.map((c) => ({ ...c, image_url: cinemaImage(c.image_path as string) })) });
});

/** Public: halls (optionally filtered by cinema) with seat counts */
router.get('/halls', async (req, res) => {
  const { cinema_id } = req.query as { cinema_id?: string };
  const rows = (
    cinema_id
      ? await query('SELECT h.*, c.name AS cinema_name, (SELECT COUNT(*)::INT FROM seats s WHERE s.hall_id = h.id) AS seat_count FROM halls h JOIN cinemas c ON c.id = h.cinema_id WHERE h.cinema_id = $1 ORDER BY h.name', [cinema_id])
      : await query('SELECT h.*, c.name AS cinema_name, (SELECT COUNT(*)::INT FROM seats s WHERE s.hall_id = h.id) AS seat_count FROM halls h JOIN cinemas c ON c.id = h.cinema_id ORDER BY c.name, h.name')
  ) as Record<string, unknown>[];
  res.json({ halls: rows });
});

/** Public: cinema detail with halls + now-playing movies + upcoming showtimes */
router.get('/:id', async (req, res) => {
  const cinema = await one<Record<string, unknown>>('SELECT * FROM cinemas WHERE id = $1 AND is_active = 1', [req.params.id]);
  if (!cinema) return res.status(404).json({ message: 'Cinema not found' });
  const halls = await query(
    'SELECT h.*, (SELECT COUNT(*)::INT FROM seats s WHERE s.hall_id = h.id) AS seat_count FROM halls h WHERE h.cinema_id = $1 ORDER BY h.name',
    [req.params.id]
  );
  const showtimes = await query<Record<string, unknown>>(
    `SELECT s.*, m.title AS movie_title, m.poster_path, h.name AS hall_name, h.format
     FROM showtimes s JOIN movies m ON m.id = s.movie_id JOIN halls h ON h.id = s.hall_id
     WHERE h.cinema_id = $1 AND s.date >= to_char(CURRENT_DATE, 'YYYY-MM-DD') ORDER BY s.date, s.time`,
    [req.params.id]
  );
  const movies = await query<Record<string, unknown>>(
    `SELECT DISTINCT m.* FROM movies m JOIN showtimes s ON s.movie_id = m.id JOIN halls h ON h.id = s.hall_id
     WHERE h.cinema_id = $1 AND s.date >= to_char(CURRENT_DATE, 'YYYY-MM-DD') ORDER BY m.title`,
    [req.params.id]
  );
  const poster = (p: unknown) => (!p ? null : /^https?:\/\//.test(String(p)) ? p : `/uploads/posters/${p}`);
  res.json({
    cinema: { ...cinema, image_url: cinemaImage(cinema.image_path as string) },
    halls,
    movies: movies.map((m) => ({ ...m, poster_url: poster(m.poster_path) })),
    showtimes: showtimes.map((s) => ({ ...s })),
  });
});

router.post('/', auth, admin, async (req: AuthRequest, res) => {
  const { name, city, address } = req.body as Record<string, unknown>;
  const errors: Record<string, string[]> = {};
  if (!String(name ?? '').trim()) errors.name = ['Name is required'];
  if (!String(city ?? '').trim()) errors.city = ['City is required'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  const id = await insert('INSERT INTO cinemas (name, city, address) VALUES ($1, $2, $3) RETURNING id', [
    String(name).trim(), String(city).trim(), String(address ?? '').trim(),
  ]);
  res.status(201).json({ cinema: await one('SELECT * FROM cinemas WHERE id = $1', [id]), message: 'Cinema created' });
});

router.put('/:id', auth, admin, async (req: AuthRequest, res) => {
  const cinema = await one('SELECT id FROM cinemas WHERE id = $1', [req.params.id]);
  if (!cinema) return res.status(404).json({ message: 'Cinema not found' });
  const { name, city, address, is_active } = req.body as Record<string, unknown>;
  if (!String(name ?? '').trim()) return res.status(422).json({ errors: { name: ['Name is required'] } });
  await run("UPDATE cinemas SET name=$1, city=$2, address=$3, is_active=$4, updated_at=NOW() WHERE id=$5", [
    String(name).trim(), String(city ?? '').trim(), String(address ?? '').trim(), is_active === false || is_active === 0 ? 0 : 1, req.params.id,
  ]);
  res.json({ cinema: await one('SELECT * FROM cinemas WHERE id = $1', [req.params.id]), message: 'Cinema updated' });
});

router.delete('/:id', auth, admin, async (req: AuthRequest, res) => {
  const cinema = await one('SELECT id FROM cinemas WHERE id = $1', [req.params.id]);
  if (!cinema) return res.status(404).json({ message: 'Cinema not found' });
  const shows = await one<{ c: string }>('SELECT COUNT(*)::INT AS c FROM showtimes s JOIN halls h ON h.id = s.hall_id WHERE h.cinema_id = $1', [req.params.id]);
  if (Number(shows?.c ?? 0) > 0) return res.status(409).json({ message: 'Cannot delete a cinema with scheduled showtimes' });
  await run('DELETE FROM halls WHERE cinema_id = $1', [req.params.id]);
  await run('DELETE FROM cinemas WHERE id = $1', [req.params.id]);
  res.json({ message: 'Cinema deleted' });
});

/** Admin: create a hall and auto-generate its seat layout */
router.post('/halls', auth, admin, async (req: AuthRequest, res) => {
  const { cinema_id, name, format, row_labels, seats_per_row } = req.body as Record<string, unknown>;
  const errors: Record<string, string[]> = {};
  if (!cinema_id || !await one('SELECT id FROM cinemas WHERE id = $1', [Number(cinema_id)])) errors.cinema_id = ['Valid cinema is required'];
  if (!String(name ?? '').trim()) errors.name = ['Hall name is required'];
  if (!FORMATS.includes(String(format ?? 'Standard'))) errors.format = [`Format must be one of: ${FORMATS.join(', ')}`];
  const rows = String(row_labels ?? 'A,B,C,D,E,F,G').split(',').map((r) => r.trim().toUpperCase()).filter(Boolean);
  const perRow = Number(seats_per_row ?? 10);
  if (!rows.length || rows.length > 26) errors.row_labels = ['Provide 1-26 row labels, e.g. A,B,C,D,E,F,G'];
  if (!Number.isInteger(perRow) || perRow < 1 || perRow > 30) errors.seats_per_row = ['Seats per row must be 1-30'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  const hid = await insert('INSERT INTO halls (cinema_id, name, format) VALUES ($1, $2, $3) RETURNING id', [Number(cinema_id), String(name).trim(), String(format ?? 'Standard')]);
  const seatRows: unknown[][] = [];
  for (const row of rows) for (let n = 1; n <= perRow; n++) seatRows.push([row, n, hid]);
  const CHUNK = 500;
  for (let i = 0; i < seatRows.length; i += CHUNK) {
    const chunk = seatRows.slice(i, i + CHUNK);
    await query(
      `INSERT INTO seats ("row", number, hall_id) VALUES ${chunk.map((_, ri) => `($${ri * 3 + 1}, $${ri * 3 + 2}, $${ri * 3 + 3})`).join(', ')}`,
      chunk.flat()
    );
  }
  res.status(201).json({ hall: await one('SELECT * FROM halls WHERE id = $1', [hid]), message: `Hall created with ${rows.length * perRow} seats` });
});

router.put('/halls/:id', auth, admin, async (req: AuthRequest, res) => {
  const hall = await one('SELECT id FROM halls WHERE id = $1', [req.params.id]);
  if (!hall) return res.status(404).json({ message: 'Hall not found' });
  const { name, format } = req.body as Record<string, unknown>;
  if (!String(name ?? '').trim()) return res.status(422).json({ errors: { name: ['Hall name is required'] } });
  if (!FORMATS.includes(String(format ?? 'Standard'))) return res.status(422).json({ errors: { format: ['Invalid format'] } });
  await run("UPDATE halls SET name=$1, format=$2, updated_at=NOW() WHERE id=$3", [String(name).trim(), String(format), req.params.id]);
  res.json({ hall: await one('SELECT * FROM halls WHERE id = $1', [req.params.id]), message: 'Hall updated' });
});

router.delete('/halls/:id', auth, admin, async (req: AuthRequest, res) => {
  const hall = await one('SELECT id FROM halls WHERE id = $1', [req.params.id]);
  if (!hall) return res.status(404).json({ message: 'Hall not found' });
  const shows = await one<{ c: string }>('SELECT COUNT(*)::INT AS c FROM showtimes WHERE hall_id = $1', [req.params.id]);
  if (Number(shows?.c ?? 0) > 0) return res.status(409).json({ message: 'Cannot delete a hall with scheduled showtimes' });
  await run('DELETE FROM seats WHERE hall_id = $1', [req.params.id]);
  await run('DELETE FROM halls WHERE id = $1', [req.params.id]);
  res.json({ message: 'Hall deleted' });
});

export default router;
