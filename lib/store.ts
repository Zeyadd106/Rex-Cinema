import fs from 'node:fs';
import path from 'node:path';
import type { Booking } from '@/types/booking';
import type { Cinema, Hall, Showtime } from '@/types/showtime';
import type { Movie } from '@/types/movie';
import { datePlusDays, daysFromToday, makeId, makeReference, todayISO } from './utils';

/**
 * Lightweight file-backed data store.
 *
 * All data lives in `data/db.json` (created on first run from `data/movies.json`).
 * Every repository function in `lib/` reads and writes through this module, so the
 * storage layer can later be swapped for a real database without touching the app.
 */

export interface Db {
  version: number;
  movies: Movie[];
  cinemas: Cinema[];
  halls: Hall[];
  showtimes: Showtime[];
  bookings: Booking[];
  settings: Record<string, string>;
  scheduleThrough: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');
const SEED_MOVIES_PATH = path.join(DB_DIR, 'movies.json');

const CACHE_KEY = '__rex_cinema_db__';

const HALL_PLANS = [
  { name: 'Standard Hall', format: 'Standard' as const, rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G'], seatsPerRow: 10 },
  { name: 'IMAX Hall', format: 'IMAX' as const, rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], seatsPerRow: 12 },
  { name: 'GOLD Lounge', format: 'GOLD' as const, rows: ['A', 'B', 'C', 'D', 'E'], seatsPerRow: 8 },
];

const CINEMA_LOCATIONS = [
  { name: 'Mall of Egypt', city: 'Giza', address: 'El Wahat Road, Giza' },
  { name: 'City Centre Almaza', city: 'Cairo', address: 'Suez Road, Heliopolis, Cairo' },
  { name: 'City Centre Alexandria', city: 'Alexandria', address: 'Alexandria Desert Road' },
];

const SHOW_TIMES = ['10:00', '12:30', '15:00', '17:30', '20:00', '22:30'];

function readSeedMovies(): Movie[] {
  const raw = fs.readFileSync(SEED_MOVIES_PATH, 'utf8');
  return JSON.parse(raw) as Movie[];
}

function buildShowtimes(
  movies: Movie[],
  halls: Hall[],
  cinemas: Cinema[],
  fromDate: string,
  days: number,
): Showtime[] {
  const nowShowing = movies.filter((m) => m.status === 'now-showing');
  const out: Showtime[] = [];
  const start = new Date(`${fromDate}T12:00:00`);
  start.setDate(start.getDate() - 1);

  for (const cinema of cinemas) {
    const cinemaHalls = halls.filter((h) => h.cinemaId === cinema.id);
    const perHall = Math.ceil(nowShowing.length / Math.max(cinemaHalls.length, 1));
    cinemaHalls.forEach((hall, hallIndex) => {
      const programmed = nowShowing.slice(hallIndex * perHall, (hallIndex + 1) * perHall);
      for (const movie of programmed) {
        for (let d = 0; d <= days; d++) {
          const day = new Date(start);
          day.setDate(day.getDate() + d);
          const date = day.toISOString().slice(0, 10);
          const count = 3 + (movie.title.length + d) % 2;
          for (let i = 0; i < count; i++) {
            out.push({
              id: makeId('st'),
              movieId: movie.id,
              hallId: hall.id,
              date,
              time: SHOW_TIMES[(i + d + movie.title.length) % SHOW_TIMES.length],
            });
          }
        }
      }
    });
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

function sampleBookings(db: Db): Booking[] {
  const bookings: Booking[] = [];
  const names = ['Omar Hassan', 'Sara Adel', 'Karim Fouda', 'Nour Ibrahim', 'Hana Saleh', 'Youssef Ali'];
  const future = db.showtimes.filter((s) => daysFromToday(s.date) >= 0).slice(0, 60);
  for (let i = 0; i < 6 && i < future.length; i++) {
    const show = future[(i * 7) % future.length];
    const hall = db.halls.find((h) => h.id === show.hallId);
    const movie = db.movies.find((m) => m.id === show.movieId);
    if (!hall || !movie) continue;
    const count = 1 + (i % 3);
    const seats: string[] = [];
    for (let n = 0; n < count; n++) {
      const row = hall.rows[(i + n) % hall.rows.length];
      const number = 2 + ((i * 3 + n) % Math.max(hall.seatsPerRow - 2, 1));
      seats.push(`${hall.id}:${row}${number}`);
    }
    const paid = i < 4;
    const ticketPrice = db.settings.ticket_price ? Number(db.settings.ticket_price) : 12;
    const subtotal = Math.round(seats.length * ticketPrice * 100) / 100;
    const taxRate = Number(db.settings.tax_rate ?? 5);
    const taxAmount = Math.round(((subtotal + 0) * taxRate) / 100 * 100) / 100;
    bookings.push({
      id: makeId('bk'),
      reference: makeReference(),
      showtimeId: show.id,
      movieId: movie.id,
      movieTitle: movie.title,
      moviePoster: movie.poster,
      cinemaName: db.cinemas.find((c) => c.id === hall.cinemaId)?.name ?? '',
      hallName: hall.name,
      showDate: show.date,
      showTime: show.time,
      seats,
      seatLabels: seats.map((s) => s.split(':')[1]),
      customer: { fullName: names[i], phone: `+2010${23456780 + i}`, email: '' },
      quote: {
        ticketCount: seats.length,
        ticketPrice,
        subtotal,
        bookingFee: 0,
        taxRate,
        taxAmount,
        total: Math.round((subtotal + taxAmount) * 100) / 100,
      },
      status: paid ? 'confirmed' : 'pending',
      paymentStatus: paid ? 'paid' : 'pending',
      paymentMethod: paid ? (i % 2 ? 'credit_card' : 'debit_card') : null,
      createdAt: new Date(Date.now() - (6 - i) * 3600_000).toISOString(),
    });
  }
  return bookings;
}

function createSeedDb(): Db {
  const movies = readSeedMovies();
  const cinemas: Cinema[] = CINEMA_LOCATIONS.map((c, i) => ({ ...c, id: `cin_${i + 1}` }));
  const halls: Hall[] = [];
  for (const cinema of cinemas) {
    for (const plan of HALL_PLANS) {
      halls.push({
        id: `hall_${cinema.id}_${plan.format.toLowerCase()}`,
        cinemaId: cinema.id,
        name: plan.name,
        format: plan.format,
        rows: plan.rows,
        seatsPerRow: plan.seatsPerRow,
      });
    }
  }
  const settings: Record<string, string> = {
    site_name: 'Rex Cinema Tech',
    contact_email: 'info@rexcinemas.com',
    phone_number: '+123 456 7890',
    address: 'Dubai, UAE',
    ticket_price: '12',
    booking_fee: '0',
    tax_rate: '5',
  };
  const db: Db = {
    version: 1,
    movies,
    cinemas,
    halls,
    showtimes: [],
    bookings: [],
    settings,
    scheduleThrough: '',
  };
  db.showtimes = buildShowtimes(movies, halls, cinemas, todayISO(), 7);
  db.scheduleThrough = datePlusDays(7);
  db.bookings = sampleBookings(db);
  return db;
}

/**
 * Keeps the schedule fresh: removes past showtimes and tops up the next days.
 * Called on every store read (cheap — usually a no-op).
 */
function ensureSchedule(db: Db): boolean {
  const today = todayISO();
  let changed = false;
  const cutoff = datePlusDays(-1);
  const before = db.showtimes.length;
  db.showtimes = db.showtimes.filter((s) => s.date >= cutoff);
  if (db.showtimes.length !== before) changed = true;

  const horizon = datePlusDays(7);
  if (db.scheduleThrough < horizon) {
    const from = db.scheduleThrough < today ? today : db.scheduleThrough;
    const added = buildShowtimes(db.movies, db.halls, db.cinemas, from, 7);
    const keys = new Set(db.showtimes.map((s) => `${s.movieId}|${s.hallId}|${s.date}|${s.time}`));
    for (const st of added) {
      const key = `${st.movieId}|${st.hallId}|${st.date}|${st.time}`;
      if (!keys.has(key)) {
        keys.add(key);
        db.showtimes.push(st);
      }
    }
    db.showtimes.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    db.scheduleThrough = horizon;
    changed = true;
  }
  return changed;
}

function loadDb(): Db {
  let db: Db | null = null;
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    db = JSON.parse(raw) as Db;
  } catch {
    db = null;
  }
  if (!db || !Array.isArray(db.movies) || db.movies.length === 0) {
    db = createSeedDb();
    persist(db);
  }
  if (ensureSchedule(db)) persist(db);
  return db;
}

function persist(db: Db): void {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('[store] failed to persist db.json', error);
  }
}

export function getDb(): Db {
  const g = globalThis as typeof globalThis & { [CACHE_KEY]?: Db };
  if (!g[CACHE_KEY]) g[CACHE_KEY] = loadDb();
  return g[CACHE_KEY];
}

/** Writes the current store to disk (call after any mutation). */
export function saveDb(): void {
  const db = getDb();
  persist(db);
}

/** Test/utility helper — drops the in-memory cache so the next read reloads from disk. */
export function resetDbCache(): void {
  const g = globalThis as typeof globalThis & { [CACHE_KEY]?: Db };
  delete g[CACHE_KEY];
}
