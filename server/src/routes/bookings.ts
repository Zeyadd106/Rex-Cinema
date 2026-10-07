import { Router } from 'express';
import crypto from 'node:crypto';
import { insert, one, purgeExpiredHolds, query, run } from '../config/db.js';
import { auth, AuthRequest } from '../middleware/auth.js';
import { bookingRef } from '../utils/auth.js';
import { priceQuote } from '../utils/pricing.js';

const router = Router();

async function bookingDetail(id: number | string): Promise<any> {
  const booking = await one<Record<string, unknown>>(
    `SELECT b.*, m.title AS movie_title, m.poster_path, m.duration, m.genre, m.rating,
            s.date AS show_date, s.time AS show_time, h.name AS hall_name, h.format, c.name AS cinema_name,
            u.name AS user_name, u.email AS user_email
     FROM bookings b
     JOIN showtimes s ON s.id = b.showtime_id
     JOIN movies m ON m.id = s.movie_id
     LEFT JOIN halls h ON h.id = s.hall_id
     LEFT JOIN cinemas c ON c.id = h.cinema_id
     JOIN users u ON u.id = b.user_id
     WHERE b.id = $1`,
    [id]
  );
  if (!booking) return null;
  const seats = await query<{ id: number; row: string; number: number }>(
    'SELECT s.id, s."row", s.number FROM seats s JOIN booking_seats bs ON bs.seat_id = s.id WHERE bs.booking_id = $1 ORDER BY s."row", s.number',
    [id]
  );
  const payment = await one<Record<string, unknown>>('SELECT * FROM payments WHERE booking_id = $1', [id]);
  return {
    ...booking,
    poster_url: booking.poster_path && /^https?:\/\//.test(String(booking.poster_path)) ? booking.poster_path : booking.poster_path ? `/uploads/posters/${booking.poster_path}` : null,
    seats: seats.map((s) => ({ ...s, seat_number: `${s.row}${s.number}` })),
    payment,
  };
}

router.get('/', auth, async (req: AuthRequest, res) => {
  const all = req.query.all === 'true' && req.user!.is_admin;
  const rows = all
    ? await query<Record<string, unknown>>(
        `SELECT b.*, m.title AS movie_title, m.poster_path AS poster_path, s.date AS show_date, s.time AS show_time, u.name AS user_name, u.email AS user_email,
                h.name AS hall_name, h.format, c.name AS cinema_name
         FROM bookings b JOIN showtimes s ON s.id = b.showtime_id JOIN movies m ON m.id = s.movie_id JOIN users u ON u.id = b.user_id
         LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN cinemas c ON c.id = h.cinema_id
         ORDER BY b.id DESC LIMIT 100`
      )
    : await query<Record<string, unknown>>(
        `SELECT b.*, m.title AS movie_title, m.poster_path AS poster_path, s.date AS show_date, s.time AS show_time, h.name AS hall_name, h.format, c.name AS cinema_name
         FROM bookings b JOIN showtimes s ON s.id = b.showtime_id JOIN movies m ON m.id = s.movie_id
         LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN cinemas c ON c.id = h.cinema_id
         WHERE b.user_id = $1 ORDER BY b.id DESC`,
        [req.user!.id]
      );
  res.json({ bookings: rows });
});

router.get('/:id', auth, async (req: AuthRequest, res) => {
  const detail = await bookingDetail(req.params.id);
  if (!detail) return res.status(404).json({ message: 'Booking not found' });
  const owner = Number(detail.user_id) === req.user!.id;
  if (!owner && !req.user!.is_admin) return res.status(403).json({ message: 'Unauthorized access to booking' });
  res.json({ booking: detail });
});

/** E-ticket payload (paid bookings only). Render this as a QR code client-side. */
router.get('/:id/ticket', auth, async (req: AuthRequest, res) => {
  const detail = await bookingDetail(req.params.id);
  if (!detail) return res.status(404).json({ message: 'Booking not found' });
  const owner = Number(detail.user_id) === req.user!.id;
  if (!owner && !req.user!.is_admin) return res.status(403).json({ message: 'Unauthorized access to booking' });
  if (detail.payment_status !== 'paid') return res.status(422).json({ message: 'Ticket is only available after payment' });
  res.json({
    ticket: {
      booking_id: detail.id,
      booking_reference: detail.booking_reference,
      check_in_token: detail.check_in_token,
      movie_title: detail.movie_title,
      show_date: detail.show_date,
      show_time: detail.show_time,
      cinema_name: detail.cinema_name,
      hall_name: detail.hall_name,
      format: detail.format,
      seats: (detail.seats as { seat_number: string }[]).map((s) => s.seat_number),
      total_price: detail.total_price,
      user_name: detail.user_name,
      checked_in_at: detail.checked_in_at,
      qr_data: JSON.stringify({ ref: detail.booking_reference, token: detail.check_in_token }),
    },
  });
});

router.post('/', auth, async (req: AuthRequest, res) => {
  await purgeExpiredHolds();
  const { showtime_id, seat_ids, hold_token } = req.body as { showtime_id?: number; seat_ids?: number[]; hold_token?: string };
  const show = showtime_id
    ? await one<{ id: number; hall_id: number }>('SELECT id, hall_id FROM showtimes WHERE id = $1', [Number(showtime_id)])
    : null;
  if (!show) {
    return res.status(422).json({ errors: { showtime_id: ['Valid showtime is required'] } });
  }
  const ids = [...new Set((Array.isArray(seat_ids) ? seat_ids : []).map(Number).filter(Boolean))];
  if (!ids.length) return res.status(422).json({ errors: { seat_ids: ['Please select at least one seat'] } });
  const seatRows = await query<{ id: number; hall_id: number }>(
    `SELECT id, hall_id FROM seats WHERE id IN (${ids.map((_, i) => `$${i + 1}`).join(',')})`, ids
  );
  if (seatRows.length !== ids.length || seatRows.some((s) => Number(s.hall_id) !== Number(show.hall_id))) {
    return res.status(422).json({ errors: { seat_ids: ['One or more seats are invalid for this showtime'] } });
  }
  if (!hold_token) {
    return res.status(409).json({ message: 'Seats must be held before booking. Please select seats again.' });
  }

  // Hold must exist, belong to this user, match showtime + seats, and be unexpired
  const holds = await query<{ showtime_id: number; seat_id: number }>(
    "SELECT * FROM seat_holds WHERE hold_token = $1 AND user_id = $2 AND expires_at > NOW()", [hold_token, req.user!.id]
  );
  const heldIds = new Set(holds.filter((h) => Number(h.showtime_id) === Number(showtime_id)).map((h) => Number(h.seat_id)));
  if (holds.length === 0 || !ids.every((id) => heldIds.has(id))) {
    return res.status(410).json({ message: 'Your seat hold has expired. Please select seats again.' });
  }

  const booked = await query<{ seat_id: number }>(
    'SELECT bs.seat_id FROM booking_seats bs JOIN bookings b ON b.id = bs.booking_id WHERE b.showtime_id = $1 AND b.status != $2',
    [Number(showtime_id), 'Cancelled']
  );
  const taken = new Set(booked.map((b) => Number(b.seat_id)));
  if (ids.some((id) => taken.has(id))) {
    return res.status(409).json({ message: 'Some seats are no longer available. Please select different seats.' });
  }

  const quote = await priceQuote(ids.length);
  const bid = await insert(
    "INSERT INTO bookings (user_id, showtime_id, subtotal, booking_fee, tax_amount, total_price, status, payment_status, booking_reference, check_in_token) VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'pending', $7, $8) RETURNING id",
    [req.user!.id, Number(showtime_id), quote.subtotal, quote.booking_fee, quote.tax_amount, quote.total, bookingRef(), crypto.randomBytes(12).toString('hex')]
  );
  for (const s of ids) {
    try { await query('INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)', [bid, s]); } catch { /* ignore dup */ }
  }
  // Consume the hold
  await run('DELETE FROM seat_holds WHERE hold_token = $1 AND user_id = $2', [hold_token, req.user!.id]);
  res.status(201).json({ booking: await bookingDetail(bid), message: 'Booking created. Proceed to payment.' });
});

router.delete('/:id/cancel', auth, async (req: AuthRequest, res) => {
  const row = await one<Record<string, unknown>>('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Booking not found' });
  if (Number(row.user_id) !== req.user!.id && !req.user!.is_admin) {
    return res.status(403).json({ message: 'Unauthorized action' });
  }
  if (row.status !== 'pending') return res.status(422).json({ message: 'Only pending bookings can be cancelled' });
  await run("UPDATE bookings SET status = 'Cancelled', updated_at=NOW() WHERE id = $1", [req.params.id]);
  res.json({ message: 'Booking cancelled successfully' });
});

router.delete('/:id', auth, async (req: AuthRequest, res) => {
  const row = await one<Record<string, unknown>>('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Booking not found' });
  if (Number(row.user_id) !== req.user!.id && !req.user!.is_admin) {
    return res.status(403).json({ message: 'Unauthorized action' });
  }
  await run('DELETE FROM bookings WHERE id = $1', [req.params.id]);
  res.json({ message: 'Booking deleted successfully' });
});

export default router;
