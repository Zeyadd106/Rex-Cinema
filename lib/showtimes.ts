import type { Cinema, Hall, Showtime, ShowtimeDetails } from '@/types/showtime';
import { getDb, saveDb } from './store';
import { makeId } from './utils';

export function listCinemas(): Cinema[] {
  return getDb().cinemas;
}

export function getCinema(id: string): Cinema | undefined {
  return getDb().cinemas.find((c) => c.id === id);
}

export function listHalls(cinemaId?: string): Hall[] {
  const halls = getDb().halls;
  return cinemaId ? halls.filter((h) => h.cinemaId === cinemaId) : halls;
}

export function getHall(id: string): Hall | undefined {
  return getDb().halls.find((h) => h.id === id);
}

export function decorateShowtime(showtime: Showtime): ShowtimeDetails | undefined {
  const db = getDb();
  const movie = db.movies.find((m) => m.id === showtime.movieId);
  const hall = db.halls.find((h) => h.id === showtime.hallId);
  const cinema = db.cinemas.find((c) => c.id === hall?.cinemaId);
  if (!movie || !hall || !cinema) return undefined;
  return {
    ...showtime,
    movieTitle: movie.title,
    moviePoster: movie.poster,
    hallName: hall.name,
    format: hall.format,
    cinemaId: cinema.id,
    cinemaName: cinema.name,
    cinemaCity: cinema.city,
  };
}

export interface ShowtimeFilters {
  movieId?: string;
  cinemaId?: string;
  date?: string;
  from?: string;
  to?: string;
}

export function listShowtimes(filters: ShowtimeFilters = {}): ShowtimeDetails[] {
  const { movieId, cinemaId, date, from, to } = filters;
  let rows = [...getDb().showtimes];
  if (movieId) rows = rows.filter((s) => s.movieId === movieId);
  if (date) rows = rows.filter((s) => s.date === date);
  if (from) rows = rows.filter((s) => s.date >= from);
  if (to) rows = rows.filter((s) => s.date <= to);
  if (cinemaId) {
    const halls = new Set(getDb().halls.filter((h) => h.cinemaId === cinemaId).map((h) => h.id));
    rows = rows.filter((s) => halls.has(s.hallId));
  }
  return rows
    .map(decorateShowtime)
    .filter((s): s is ShowtimeDetails => Boolean(s))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

export function getShowtime(id: string): Showtime | undefined {
  return getDb().showtimes.find((s) => s.id === id);
}

export function getShowtimeDetails(id: string): ShowtimeDetails | undefined {
  const showtime = getShowtime(id);
  return showtime ? decorateShowtime(showtime) : undefined;
}

export function createShowtime(input: { movieId: string; hallId: string; date: string; time: string }): Showtime | undefined {
  const db = getDb();
  if (!db.movies.some((m) => m.id === input.movieId)) return undefined;
  if (!db.halls.some((h) => h.id === input.hallId)) return undefined;
  const showtime: Showtime = { id: makeId('st'), ...input };
  db.showtimes.push(showtime);
  db.showtimes.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  saveDb();
  return showtime;
}

export function updateShowtime(
  id: string,
  input: Partial<Pick<Showtime, 'movieId' | 'hallId' | 'date' | 'time'>>,
): Showtime | undefined {
  const db = getDb();
  const showtime = db.showtimes.find((s) => s.id === id);
  if (!showtime) return undefined;
  if (input.movieId && !db.movies.some((m) => m.id === input.movieId)) return undefined;
  if (input.hallId && !db.halls.some((h) => h.id === input.hallId)) return undefined;
  Object.assign(showtime, input);
  saveDb();
  return showtime;
}

export function deleteShowtime(id: string): boolean {
  const db = getDb();
  const index = db.showtimes.findIndex((s) => s.id === id);
  if (index < 0) return false;
  db.showtimes.splice(index, 1);
  saveDb();
  return true;
}
