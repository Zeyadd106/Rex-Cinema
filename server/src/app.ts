import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './config/db.js';
import { seed, ensureFutureShowtimes } from './config/seed.js';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import showtimeRoutes from './routes/showtimes.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import holdRoutes from './routes/holds.js';
import cinemaRoutes from './routes/cinemas.js';
import { auth, AuthRequest } from './middleware/auth.js';
import { db } from './config/db.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

migrate();
seed();
ensureFutureShowtimes();

export const app = express();
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') ?? true, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  app.use('/uploads', express.static('/tmp/uploads'));
}

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'REX Cinemas API' }));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/holds', holdRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/dashboard', auth, (req: AuthRequest, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = db.prepare(
    `SELECT b.*, m.title AS movie_title, m.poster_path AS poster_path, s.date AS show_date, s.time AS show_time
     FROM bookings b JOIN showtimes s ON s.id=b.showtime_id JOIN movies m ON m.id=s.movie_id
     WHERE b.user_id = ? AND s.date >= ? ORDER BY s.date, s.time LIMIT 5`
  ).all(req.user!.id, today);
  const history = db.prepare(
    `SELECT b.*, m.title AS movie_title, m.poster_path AS poster_path, s.date AS show_date, s.time AS show_time
     FROM bookings b JOIN showtimes s ON s.id=b.showtime_id JOIN movies m ON m.id=s.movie_id
     WHERE b.user_id = ? AND s.date < ? ORDER BY s.date DESC LIMIT 10`
  ).all(req.user!.id, today);
  res.json({ upcomingBookings: upcoming, bookingHistory: history });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err.message.includes('Poster must be') || err.message.includes('File too large')) {
    return res.status(422).json({ errors: { poster: [err.message] } });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong' });
});
