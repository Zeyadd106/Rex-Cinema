import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db } from '../config/db.js';
import { auth, admin, AuthRequest } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const posterDir = isVercel ? '/tmp/uploads/posters' : path.resolve(__dirname, '../../uploads/posters');
try {
  fs.mkdirSync(posterDir, { recursive: true });
} catch {
  // Directory might already exist or read-only
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, posterDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|jpg|gif|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Poster must be an image (jpeg, png, jpg, gif, webp)'));
  },
});

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Adventure', 'Romance', 'Animation', 'Documentary', 'Thriller'];
const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'PG12', '12+', '16+', '18+', '18TC'];

function posterUrl(p: string | null): string | null {
  if (!p) return null;
  if (/^https?:\/\//.test(p)) return p;
  return `/uploads/posters/${path.basename(p)}`;
}

export function serializeMovie(m: Record<string, unknown>) {
  return { ...m, poster_url: posterUrl(m.poster_path as string) };
}

function validateMovie(body: Record<string, any>, posterRequired: boolean) {
  const errors: Record<string, string[]> = {};
  const s = (v: unknown) => String(v ?? '').trim();
  if (!s(body.title)) errors.title = ['Title is required'];
  if (!s(body.description)) errors.description = ['Description is required'];
  if (!s(body.duration)) errors.duration = ['Duration is required'];
  if (!GENRES.includes(s(body.genre))) errors.genre = [`Genre must be one of: ${GENRES.join(', ')}`];
  if (!RATINGS.includes(s(body.rating))) errors.rating = [`Rating must be one of: ${RATINGS.join(', ')}`];
  if (!['current', 'coming_soon'].includes(s(body.status))) errors.status = ['Status must be current or coming_soon'];
  if (!s(body.release_date)) errors.release_date = ['Release date is required'];
  if (s(body.trailer_url) && !/^https?:\/\/.+/.test(s(body.trailer_url))) errors.trailer_url = ['Trailer must be a valid URL'];
  if (s(body.status) === 'coming_soon' && s(body.release_date) && s(body.release_date) <= new Date().toISOString().slice(0, 10)) {
    errors.release_date = ['Release date for coming soon movies must be in the future'];
  }
  if (posterRequired && !(body as { _poster?: boolean })._poster) errors.poster = ['Poster image is required'];
  return errors;
}

router.get('/', (req, res) => {
  const status = String(req.query.status ?? 'all');
  let rows;
  if (status === 'current' || status === 'coming_soon') {
    rows = db.prepare('SELECT * FROM movies WHERE status = ? ORDER BY id DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM movies ORDER BY id DESC').all();
  }
  res.json({ movies: (rows as Record<string, unknown>[]).map(serializeMovie) });
});

router.get('/:id', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id) as Record<string, unknown> | null;
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  const today = new Date().toISOString().slice(0, 10);
  const showtimes = db.prepare("SELECT * FROM showtimes WHERE movie_id = ? AND date >= ? ORDER BY date, time").all(movie.id as number, today);
  res.json({ movie: serializeMovie(movie), showtimes });
});

router.post('/:id/notify', (req, res) => {
  const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json({ message: 'Notification set successfully. We will email you when tickets are available.' });
});

router.post('/', auth, admin, upload.single('poster'), (req: AuthRequest, res) => {
  const body: Record<string, any> = { ...(req.body as object), _poster: Boolean(req.file) };
  const errors = validateMovie(body, true);
  if (Object.keys(errors).length) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(422).json({ errors });
  }
  const r = db.prepare(
    'INSERT INTO movies (title, description, duration, poster_path, trailer_url, genre, rating, status, release_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    String(body.title).trim(), String(body.description).trim(), String(body.duration).trim(),
    req.file!.filename, String(body.trailer_url ?? '').trim(), String(body.genre), String(body.rating),
    String(body.status), String(body.release_date)
  );
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(Number(r.lastInsertRowid));
  res.status(201).json({ movie: serializeMovie(movie as Record<string, unknown>), message: 'Movie created successfully' });
});

router.put('/:id', auth, admin, upload.single('poster'), (req: AuthRequest, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id) as Record<string, unknown> | null;
  if (!movie) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(404).json({ message: 'Movie not found' });
  }
  const body: Record<string, any> = { ...(req.body as object), _poster: Boolean(req.file) || Boolean(movie.poster_path) };
  const errors = validateMovie(body, false);
  if (Object.keys(errors).length) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(422).json({ errors });
  }
  let poster = movie.poster_path as string;
  if (req.file) {
    if (poster && !/^https?:\/\//.test(poster)) {
      try { fs.unlinkSync(path.join(posterDir, path.basename(poster))); } catch { /* ignore */ }
    }
    poster = req.file.filename;
  }
  db.prepare(
    'UPDATE movies SET title=?, description=?, duration=?, poster_path=?, trailer_url=?, genre=?, rating=?, status=?, release_date=?, updated_at=datetime(\'now\') WHERE id=?'
  ).run(
    String(body.title).trim(), String(body.description).trim(), String(body.duration).trim(),
    poster, String(body.trailer_url ?? '').trim(), String(body.genre), String(body.rating),
    String(body.status), String(body.release_date), req.params.id
  );
  const updated = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id);
  res.json({ movie: serializeMovie(updated as Record<string, unknown>), message: 'Movie updated successfully' });
});

router.delete('/:id', auth, admin, (req: AuthRequest, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(req.params.id) as Record<string, unknown> | null;
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  const poster = movie.poster_path as string;
  db.prepare('DELETE FROM movies WHERE id = ?').run(req.params.id);
  if (poster && !/^https?:\/\//.test(poster)) {
    try { fs.unlinkSync(path.join(posterDir, path.basename(poster))); } catch { /* ignore */ }
  }
  res.json({ message: 'Movie deleted successfully' });
});

export default router;
