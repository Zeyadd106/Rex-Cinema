import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isVercel ? '/tmp/data' : (process.env.DATA_DIR || path.resolve(__dirname, '../../data'));
try {
  fs.mkdirSync(dataDir, { recursive: true });
} catch {
  // Ignore error if directory already exists or file system is read-only
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'vox.db');
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      birth_date TEXT,
      gender TEXT NOT NULL DEFAULT '',
      preferred_cinema_id INTEGER REFERENCES cinemas(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      duration TEXT NOT NULL,
      poster_path TEXT NOT NULL DEFAULT '',
      trailer_url TEXT,
      genre TEXT NOT NULL DEFAULT '',
      rating TEXT NOT NULL DEFAULT 'PG',
      status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current','coming_soon')),
      release_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      row TEXT NOT NULL,
      number INTEGER NOT NULL,
      hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(hall_id, row, number)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
      total_price REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      transaction_id TEXT,
      booking_reference TEXT NOT NULL UNIQUE,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS booking_seats (
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (booking_id, seat_id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      card_last_four TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS seat_holds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hold_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(showtime_id, seat_id)
    );
    CREATE INDEX IF NOT EXISTS idx_holds_token ON seat_holds(hold_token);
    CREATE INDEX IF NOT EXISTS idx_holds_expiry ON seat_holds(expires_at);

    CREATE TABLE IF NOT EXISTS cinemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      image_path TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS halls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'Standard' CHECK (format IN ('Standard','IMAX','MAX','GOLD','4DX','KIDS')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const tableCols = (t: string) => db.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[];
  const hasCol = (t: string, n: string) => tableCols(t).some((c) => c.name === n);
  if (!hasCol('users', 'phone')) db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
  if (!hasCol('users', 'birth_date')) db.exec('ALTER TABLE users ADD COLUMN birth_date TEXT');
  if (!hasCol('users', 'gender')) db.exec("ALTER TABLE users ADD COLUMN gender TEXT NOT NULL DEFAULT ''");
  if (!hasCol('users', 'preferred_cinema_id')) db.exec('ALTER TABLE users ADD COLUMN preferred_cinema_id INTEGER REFERENCES cinemas(id) ON DELETE SET NULL');
  if (!hasCol('seats', 'hall_id')) db.exec('ALTER TABLE seats ADD COLUMN hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE');
  if (!hasCol('showtimes', 'hall_id')) db.exec('ALTER TABLE showtimes ADD COLUMN hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE');

  // Old seats tables used a GLOBAL UNIQUE(row, number). Multi-hall cinemas need
  // per-hall uniqueness, so rebuild the table when the legacy constraint exists.
  const seatIndexes = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'seats'").all() as { sql: string | null }[];
  const legacyUnique = seatIndexes.some((i) => !!i.sql && /UNIQUE/i.test(i.sql) && /\(\s*"?row"?\s*,\s*"?number"?\s*\)/i.test(i.sql));
  if (legacyUnique) {
    db.exec('PRAGMA foreign_keys = OFF');
    try {
      db.exec(`
        CREATE TABLE seats_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          row TEXT NOT NULL,
          number INTEGER NOT NULL,
          hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(hall_id, row, number)
        );
        INSERT INTO seats_new (id, row, number, hall_id, created_at, updated_at)
          SELECT id, row, number, hall_id, created_at, updated_at FROM seats;
        DROP TABLE seats;
        ALTER TABLE seats_new RENAME TO seats;
      `);
    } finally {
      db.exec('PRAGMA foreign_keys = ON');
    }
  }

  // Legacy bootstrap: databases created before cinemas existed get a default
  // location, and existing seats/showtimes are assigned to its first hall.
  const cinemaCount = (db.prepare('SELECT COUNT(*) c FROM cinemas').get() as { c: number }).c;
  const legacySeats = (db.prepare('SELECT COUNT(*) c FROM seats WHERE hall_id IS NULL').get() as { c: number }).c;
  const legacyShows = (db.prepare('SELECT COUNT(*) c FROM showtimes WHERE hall_id IS NULL').get() as { c: number }).c;
  if (cinemaCount === 0 && (legacySeats > 0 || legacyShows > 0)) {
    const c = db.prepare("INSERT INTO cinemas (name, city, address) VALUES ('Mall of Egypt', 'Giza', 'El Wahat Road, Giza')").run();
    const h = db.prepare("INSERT INTO halls (cinema_id, name, format) VALUES (?, 'Standard Hall 1', 'Standard')").run(Number(c.lastInsertRowid));
    db.exec(`UPDATE seats SET hall_id = ${Number(h.lastInsertRowid)} WHERE hall_id IS NULL`);
    db.exec(`UPDATE showtimes SET hall_id = ${Number(h.lastInsertRowid)} WHERE hall_id IS NULL`);
  }

  const movieCols = db.prepare('PRAGMA table_info(movies)').all() as { name: string }[];
  if (!movieCols.some((c) => c.name === 'language')) {
    db.exec("ALTER TABLE movies ADD COLUMN language TEXT NOT NULL DEFAULT 'English'");
  }
  // Backfill Arabic-language titles mirrored from VOX Egypt
  try {
    db.exec(`UPDATE movies SET language = 'Arabic' WHERE title IN (
      'Red Flag', 'Mahmoud El Tany', 'El Gawahergy', 'Khali Balak Min Nafsik', 'Shish Dou', 'Wala Kan Ala El-Bal'
    )`);
    db.exec(`UPDATE movies SET language = 'Japanese' WHERE title = 'Godzilla Minus Zero'`);
  } catch {
    /* ignore */
  }

  // Lightweight migrations for databases created before these columns existed
  const cols = db.prepare('PRAGMA table_info(bookings)').all() as { name: string }[];
  const has = (n: string) => cols.some((c) => c.name === n);
  if (!has('subtotal')) db.exec('ALTER TABLE bookings ADD COLUMN subtotal REAL NOT NULL DEFAULT 0');  if (!has('booking_fee')) db.exec('ALTER TABLE bookings ADD COLUMN booking_fee REAL NOT NULL DEFAULT 0');
  if (!has('tax_amount')) db.exec('ALTER TABLE bookings ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0');
  if (!has('check_in_token')) db.exec('ALTER TABLE bookings ADD COLUMN check_in_token TEXT');
  if (!has('checked_in_at')) db.exec('ALTER TABLE bookings ADD COLUMN checked_in_at TEXT');
  // Backfill check-in tokens for rows created before the column existed
  try {
    db.exec("UPDATE bookings SET check_in_token = lower(hex(randomblob(12))) WHERE check_in_token IS NULL");
  } catch {
    /* ignore */
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets(token);
    CREATE INDEX IF NOT EXISTS idx_resets_expiry ON password_resets(expires_at);
  `);
  try {
    db.exec("DELETE FROM password_resets WHERE expires_at <= datetime('now')");
  } catch {
    /* ignore */
  }
}

export function holdTtlMinutes(): number {
  const v = Number(process.env.HOLD_TTL_MINUTES || 10);
  return Number.isFinite(v) && v > 0 ? v : 10;
}

export function getSetting(key: string, fallback: string): string {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | null;
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Delete expired holds; returns number removed. */
export function purgeExpiredHolds(): number {
  try {
    const r = db.prepare("DELETE FROM seat_holds WHERE expires_at <= datetime('now')").run();
    return Number(r.changes ?? 0);
  } catch {
    return 0;
  }
}
