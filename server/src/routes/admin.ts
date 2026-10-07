import { Router } from 'express';
import { one, query, run } from '../config/db.js';
import { auth, admin, AuthRequest } from '../middleware/auth.js';
import { publicUser } from '../utils/auth.js';

const router = Router();
router.use(auth, admin);

router.get('/stats', async (_req, res) => {
  const total_users = Number((await one<{ c: string }>('SELECT COUNT(*)::INT AS c FROM users'))?.c ?? 0);
  const total_bookings = Number((await one<{ c: string }>('SELECT COUNT(*)::INT AS c FROM bookings'))?.c ?? 0);
  const total_movies = Number((await one<{ c: string }>('SELECT COUNT(*)::INT AS c FROM movies'))?.c ?? 0);
  const coming_soon_count = Number((await one<{ c: string }>("SELECT COUNT(*)::INT AS c FROM movies WHERE status='coming_soon'"))?.c ?? 0);
  const revenue = Number((await one<{ s: string }>("SELECT COALESCE(SUM(total_price),0) AS s FROM bookings WHERE payment_status='paid'"))?.s ?? 0);
  const recent_bookings = await query(
    `SELECT b.*, m.title AS movie_title, s.date AS show_date, s.time AS show_time, u.name AS user_name, u.email AS user_email
     FROM bookings b JOIN showtimes s ON s.id=b.showtime_id JOIN movies m ON m.id=s.movie_id JOIN users u ON u.id=b.user_id
     ORDER BY b.id DESC LIMIT 5`
  );
  res.json({ stats: { total_users, total_bookings, total_movies, coming_soon_count, revenue, recent_bookings } });
});

router.get('/users', async (_req, res) => {
  const rows = await query<Record<string, unknown>>('SELECT u.*, (SELECT COUNT(*)::INT FROM bookings b WHERE b.user_id = u.id) AS bookings_count FROM users u ORDER BY u.id DESC');
  res.json({ users: rows.map((u) => ({ ...publicUser(u), bookings_count: Number(u.bookings_count), created_at: u.created_at })) });
});

router.patch('/users/:id/toggle-admin', async (req: AuthRequest, res) => {
  const user = await one<Record<string, unknown>>('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (Number(user.id) === req.user!.id) return res.status(422).json({ message: 'You cannot modify your own admin status.' });
  await run('UPDATE users SET is_admin = $1, updated_at=NOW() WHERE id = $2', [Number(user.is_admin) ? 0 : 1, req.params.id]);
  res.json({ message: Number(user.is_admin) ? 'Admin privileges revoked.' : 'Admin privileges granted.' });
});

router.put('/users/:id', async (req, res) => {
  const user = await one<Record<string, unknown>>('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { name, email } = req.body as { name?: string; email?: string };
  const errors: Record<string, string[]> = {};
  if (!name || name.trim().length < 2) errors.name = ['Name is required'];
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.email = ['Valid email is required'];
  const dupe = await one('SELECT id FROM users WHERE email = $1 AND id != $2', [String(email).toLowerCase(), req.params.id]);
  if (dupe) errors.email = ['Email is already taken'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  await run('UPDATE users SET name=$1, email=$2, updated_at=NOW() WHERE id=$3', [name!.trim(), email!.toLowerCase(), req.params.id]);
  res.json({ message: 'User updated successfully.' });
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
  const user = await one('SELECT id FROM users WHERE id = $1', [req.params.id]);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (Number(req.params.id) === req.user!.id) return res.status(422).json({ message: 'You cannot delete your own account.' });
  await run('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ message: 'User deleted successfully.' });
});

router.get('/settings', async (_req, res) => {
  const rows = await query<{ key: string; value: string }>('SELECT key, value FROM settings');
  res.json({ settings: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});

router.put('/settings', async (req, res) => {
  const { site_name, contact_email, phone_number, address, booking_fee, tax_rate } = req.body as Record<string, unknown>;
  const errors: Record<string, string[]> = {};
  if (!String(site_name ?? '').trim()) errors.site_name = ['Site name is required'];
  if (!/^\S+@\S+\.\S+$/.test(String(contact_email ?? ''))) errors.contact_email = ['Valid contact email is required'];
  if (!String(phone_number ?? '').trim()) errors.phone_number = ['Phone number is required'];
  if (!String(address ?? '').trim()) errors.address = ['Address is required'];
  if (booking_fee === undefined || isNaN(Number(booking_fee)) || Number(booking_fee) < 0) errors.booking_fee = ['Booking fee must be >= 0'];
  if (tax_rate === undefined || isNaN(Number(tax_rate)) || Number(tax_rate) < 0 || Number(tax_rate) > 100) errors.tax_rate = ['Tax rate must be 0-100'];
  if (Object.keys(errors).length) return res.status(422).json({ errors });
  for (const [k, v] of [
    ['site_name', String(site_name)],
    ['contact_email', String(contact_email)],
    ['phone_number', String(phone_number)],
    ['address', String(address)],
    ['booking_fee', String(booking_fee)],
    ['tax_rate', String(tax_rate)],
  ]) {
    await query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, v]);
  }
  res.json({ message: 'Settings updated successfully.' });
});

router.get('/dashboard', async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = await query(
    `SELECT b.*, m.title AS movie_title, s.date AS show_date, s.time AS show_time
     FROM bookings b JOIN showtimes s ON s.id=b.showtime_id JOIN movies m ON m.id=s.movie_id
     WHERE s.date >= $1 ORDER BY b.id DESC LIMIT 5`,
    [today]
  );
  const history = await query(
    `SELECT b.*, m.title AS movie_title, s.date AS show_date, s.time AS show_time
     FROM bookings b JOIN showtimes s ON s.id=b.showtime_id JOIN movies m ON m.id=s.movie_id
     WHERE s.date < $1 ORDER BY b.id DESC LIMIT 10`,
    [today]
  );
  res.json({ upcoming, history });
});

/**
 * Usher check-in: validate a ticket's reference + token and mark it used.
 * Accepts either { booking_reference, check_in_token } or { qr_data } (scanned QR JSON).
 */
router.post('/check-in', async (req, res) => {
  let ref = String(req.body?.booking_reference ?? '').trim().toUpperCase();
  let token = String(req.body?.check_in_token ?? '').trim();
  if (req.body?.qr_data) {
    try {
      const parsed = JSON.parse(String(req.body.qr_data));
      ref = String(parsed.ref ?? '').toUpperCase();
      token = String(parsed.token ?? '');
    } catch {
      return res.status(422).json({ message: 'Unrecognized QR code' });
    }
  }
  if (!ref || !token) return res.status(422).json({ errors: { booking_reference: ['Reference and token are required'] } });

  const booking = await one<Record<string, unknown>>(
    `SELECT b.*, m.title AS movie_title, s.date AS show_date, s.time AS show_time, u.name AS user_name
     FROM bookings b JOIN showtimes s ON s.id = b.showtime_id JOIN movies m ON m.id = s.movie_id JOIN users u ON u.id = b.user_id
     WHERE b.booking_reference = $1`,
    [ref]
  );
  if (!booking || booking.check_in_token !== token) {
    return res.status(404).json({ message: 'Ticket not found. Check the reference and code.' });
  }
  if (booking.payment_status !== 'paid') {
    return res.status(422).json({ message: 'Ticket has not been paid for.' });
  }
  if (booking.checked_in_at) {
    return res.status(409).json({ message: `Ticket already checked in at ${booking.checked_in_at}.`, booking });
  }
  await run("UPDATE bookings SET checked_in_at = NOW(), updated_at = NOW() WHERE id = $1", [booking.id as number]);
  const seats = await query<{ row: string; number: number }>(
    'SELECT s."row", s.number FROM seats s JOIN booking_seats bs ON bs.seat_id = s.id WHERE bs.booking_id = $1 ORDER BY s."row", s.number',
    [booking.id as number]
  );
  res.json({
    message: 'Check-in successful. Enjoy the movie!',
    booking: { ...booking, checked_in_at: new Date().toISOString(), seats: seats.map((s) => `${s.row}${s.number}`) },
  });
});

export default router;
