import { Pool } from 'pg';

/**
 * PostgreSQL connection (Supabase-ready).
 *
 * Required env:
 *   DATABASE_URL — Supabase connection string.
 *     Use the **Session-mode pooler** URL (port 5432) or a direct connection.
 *     Transaction mode (port 6543) is NOT compatible with `pg` prepared
 *     statements, so avoid it unless you know what you are doing.
 *
 * Optional env:
 *   DB_SSL         — set to "disable" only for a local non-TLS Postgres.
 *                    Supabase always requires TLS (default: enabled).
 *   DB_POOL_MAX    — max pool clients (default 10; use 1-2 on serverless).
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Add your Supabase connection string to server/.env ' +
      '(and to Vercel → Environment Variables for deploys).'
  );
}

const sslOff = (process.env.DB_SSL || '').toLowerCase() === 'disable';

export const pool = new Pool({
  connectionString,
  ssl: sslOff ? false : { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 10) || 10,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err);
});

/** Run a query, return all rows. */
export async function query<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

/** Run a query, return the first row (or null). */
export async function one<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** Run an INSERT/UPDATE/DELETE, return affected row count. */
export async function run(text: string, params: unknown[] = []): Promise<number> {
  const res = await pool.query(text, params as never[]);
  return Number(res.rowCount ?? 0);
}

/** INSERT with `RETURNING id` — returns the new row id. */
export async function insert(text: string, params: unknown[] = []): Promise<number> {
  const row = await one<{ id: number }>(text, params);
  return Number(row?.id);
}

export function holdTtlMinutes(): number {
  const v = Number(process.env.HOLD_TTL_MINUTES || 10);
  return Number.isFinite(v) && v > 0 ? v : 10;
}

export async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const row = await one<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
    return row?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Delete expired holds; returns number removed. */
export async function purgeExpiredHolds(): Promise<number> {
  try {
    return await run("DELETE FROM seat_holds WHERE expires_at <= NOW()");
  } catch {
    return 0;
  }
}

/**
 * Create tables if missing + idempotent column migrations.
 * Safe to run on every startup (fresh Supabase project or existing DB).
 */
export async function migrate(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS cinemas (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      image_path TEXT NOT NULL DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS halls (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'Standard' CHECK (format IN ('Standard','IMAX','MAX','GOLD','4DX','KIDS')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      phone TEXT,
      birth_date TEXT,
      gender TEXT NOT NULL DEFAULT '',
      preferred_cinema_id INTEGER REFERENCES cinemas(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS movies (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      duration TEXT NOT NULL,
      poster_path TEXT NOT NULL DEFAULT '',
      trailer_url TEXT,
      genre TEXT NOT NULL DEFAULT '',
      rating TEXT NOT NULL DEFAULT 'PG',
      status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current','coming_soon')),
      release_date TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'English',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS showtimes (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
      hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS seats (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      "row" TEXT NOT NULL,
      number INTEGER NOT NULL,
      hall_id INTEGER REFERENCES halls(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(hall_id, "row", number)
    );
    CREATE TABLE IF NOT EXISTS bookings (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
      subtotal DOUBLE PRECISION NOT NULL DEFAULT 0,
      booking_fee DOUBLE PRECISION NOT NULL DEFAULT 0,
      tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
      total_price DOUBLE PRECISION NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      transaction_id TEXT,
      booking_reference TEXT NOT NULL UNIQUE,
      check_in_token TEXT,
      paid_at TIMESTAMPTZ,
      checked_in_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS booking_seats (
      booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (booking_id, seat_id)
    );
    CREATE TABLE IF NOT EXISTS payments (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      booking_id INTEGER NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
      amount DOUBLE PRECISION NOT NULL,
      payment_method TEXT NOT NULL,
      transaction_id TEXT,
      card_last_four TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS seat_holds (
      id GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      showtime_id INTEGER NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
      seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      hold_token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(showtime_id, seat_id)
    );
    CREATE TABLE IF NOT EXISTS password_resets (
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_holds_token ON seat_holds(hold_token)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_holds_expiry ON seat_holds(expires_at)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_resets_token ON password_resets(token)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_resets_expiry ON password_resets(expires_at)`);

  // Idempotent migrations for databases created by older versions
  const addCol = (table: string, column: string, ddl: string) =>
    query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${ddl}`);
  await addCol('users', 'phone', 'TEXT');
  await addCol('users', 'birth_date', 'TEXT');
  await addCol('users', 'gender', `TEXT NOT NULL DEFAULT ''`);
  await addCol('users', 'preferred_cinema_id', 'INTEGER REFERENCES cinemas(id) ON DELETE SET NULL');
  await addCol('seats', 'hall_id', 'INTEGER REFERENCES halls(id) ON DELETE CASCADE');
  await addCol('showtimes', 'hall_id', 'INTEGER REFERENCES halls(id) ON DELETE CASCADE');
  await addCol('movies', 'language', `TEXT NOT NULL DEFAULT 'English'`);
  await addCol('bookings', 'subtotal', 'DOUBLE PRECISION NOT NULL DEFAULT 0');
  await addCol('bookings', 'booking_fee', 'DOUBLE PRECISION NOT NULL DEFAULT 0');
  await addCol('bookings', 'tax_amount', 'DOUBLE PRECISION NOT NULL DEFAULT 0');
  await addCol('bookings', 'check_in_token', 'TEXT');
  await addCol('bookings', 'checked_in_at', 'TIMESTAMPTZ');

  // Backfill Arabic-language titles mirrored from VOX Egypt
  try {
    await query(`UPDATE movies SET language = 'Arabic' WHERE title IN (
      'Red Flag', 'Mahmoud El Tany', 'El Gawahergy', 'Khali Balak Min Nafsik', 'Shish Dou', 'Wala Kan Ala El-Bal'
    )`);
    await query(`UPDATE movies SET language = 'Japanese' WHERE title = 'Godzilla Minus Zero'`);
  } catch {
    /* ignore */
  }
  // Backfill check-in tokens for rows created before the column existed
  try {
    await query(
      `UPDATE bookings SET check_in_token = md5(random()::text || id::text || clock_timestamp()::text) WHERE check_in_token IS NULL`
    );
  } catch {
    /* ignore */
  }
  try {
    await query(`DELETE FROM password_resets WHERE expires_at <= NOW()`);
  } catch {
    /* ignore */
  }
}
