import { Router } from 'express';
import crypto from 'node:crypto';
import { holdTtlMinutes, purgeExpiredHolds, query, run } from '../config/db.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { priceQuote } from '../utils/pricing.js';

const router = Router();

async function bookedSeatIds(showtimeId: number | string): Promise<Set<number>> {
  const rows = await query<{ seat_id: number }>(
    'SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id WHERE b.showtime_id = $1 AND b.status != $2',
    [showtimeId, 'Cancelled']
  );
  return new Set(rows.map((r) => Number(r.seat_id)));
}

/** Create (or refresh) a hold on seats. Returns hold token + expiry. */
router.post('/', auth, async (req: AuthRequest, res) => {
  await purgeExpiredHolds();
  const { showtime_id, seat_ids } = req.body as { showtime_id?: number; seat_ids?: number[] };
  const show = showtime_id
    ? await query<{ id: number; hall_id: number }>('SELECT id, hall_id FROM showtimes WHERE id = $1', [Number(showtime_id)])
    : [];
  const showRow = show[0] ?? null;
  if (!showRow) {
    return res.status(422).json({ errors: { showtime_id: ['Valid showtime is required'] } });
  }
  const ids = [...new Set((Array.isArray(seat_ids) ? seat_ids : []).map(Number).filter(Boolean))];
  if (!ids.length || ids.length > 10) {
    return res.status(422).json({ errors: { seat_ids: ['Select between 1 and 10 seats'] } });
  }
  const seatRows = await query<{ id: number; hall_id: number }>(
    `SELECT id, hall_id FROM seats WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`, ids
  );
  if (seatRows.length !== ids.length || seatRows.some((s) => Number(s.hall_id) !== Number(showRow.hall_id))) {
    return res.status(422).json({ errors: { seat_ids: ['One or more seats are invalid for this showtime'] } });
  }

  const taken = await bookedSeatIds(Number(showtime_id));
  if (ids.some((id) => taken.has(id))) {
    return res.status(409).json({ message: 'Some seats are already booked. Please choose different seats.' });
  }

  // Remove this user's stale holds for other showtimes/seats so a user holds one selection at a time
  await run('DELETE FROM seat_holds WHERE user_id = $1', [req.user!.id]);

  const token = crypto.randomBytes(18).toString('hex');
  const expiresAt = new Date(Date.now() + holdTtlMinutes() * 60_000).toISOString();
  try {
    for (const seatId of ids) {
      await query('INSERT INTO seat_holds (showtime_id, seat_id, user_id, hold_token, expires_at) VALUES ($1, $2, $3, $4, $5)', [Number(showtime_id), seatId, req.user!.id, token, expiresAt]);
    }
  } catch {
    await run('DELETE FROM seat_holds WHERE hold_token = $1', [token]);
    return res.status(409).json({ message: 'Some seats were just held by someone else. Please try again.' });
  }

  res.status(201).json({
    hold_token: token,
    showtime_id: Number(showtime_id),
    seat_ids: ids,
    expires_at: new Date(Date.now() + holdTtlMinutes() * 60_000).toISOString(),
    ttl_minutes: holdTtlMinutes(),
    quote: await priceQuote(ids.length),
    message: `Seats held for ${holdTtlMinutes()} minutes. Complete payment before the hold expires.`,
  });
});

router.get('/:token', auth, async (req: AuthRequest, res) => {
  await purgeExpiredHolds();
  const rows = await query<Record<string, unknown>>('SELECT * FROM seat_holds WHERE hold_token = $1 AND user_id = $2', [req.params.token, req.user!.id]);
  if (!rows.length) return res.status(404).json({ message: 'Hold not found or expired' });
  res.json({
    hold_token: req.params.token,
    showtime_id: rows[0].showtime_id,
    seat_ids: rows.map((r) => Number(r.seat_id)),
    expires_at: new Date(rows[0].expires_at as string).toISOString(),
  });
});

router.delete('/:token', auth, async (req: AuthRequest, res) => {
  await run('DELETE FROM seat_holds WHERE hold_token = $1 AND user_id = $2', [req.params.token, req.user!.id]);
  res.json({ message: 'Hold released' });
});

export default router;
