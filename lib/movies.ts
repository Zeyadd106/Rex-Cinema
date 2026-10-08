import type { Movie, MovieFilters, MovieInput } from '@/types/movie';
import { getDb, saveDb } from './store';
import { slugify } from './utils';

export function listMovies(filters: MovieFilters = {}): Movie[] {
  const { status, q, genre } = filters;
  let movies = [...getDb().movies];
  if (status) movies = movies.filter((m) => m.status === status);
  if (genre) movies = movies.filter((m) => m.genre.includes(genre));
  if (q) {
    const needle = q.trim().toLowerCase();
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(needle) ||
        m.genre.some((g) => g.toLowerCase().includes(needle)) ||
        m.description.toLowerCase().includes(needle),
    );
  }
  return movies.sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

export function getMovie(id: string): Movie | undefined {
  return getDb().movies.find((m) => m.id === id);
}

export function featuredMovies(limit = 6): Movie[] {
  const featured = getDb().movies.filter((m) => m.featured && m.status === 'now-showing');
  const fallback = listMovies({ status: 'now-showing' });
  const base = featured.length >= limit ? featured : [...new Set([...featured, ...fallback])];
  return base.slice(0, limit);
}

export function listGenres(): string[] {
  const genres = new Set<string>();
  for (const m of getDb().movies) for (const g of m.genre) genres.add(g);
  return [...genres].sort();
}

function normalizeInput(input: MovieInput): MovieInput {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    poster: input.poster.trim() || '/placeholder-movie.jpg',
    genre: input.genre.map((g) => g.trim()).filter(Boolean),
    duration: input.duration.trim() || 'TBA',
    rating: input.rating.trim() || 'PG',
    releaseDate: input.releaseDate,
    status: input.status === 'coming-soon' ? 'coming-soon' : 'now-showing',
    language: input.language.trim() || 'English',
    director: input.director?.trim() || null,
    cast: (input.cast ?? []).map((c) => c.trim()).filter(Boolean),
    trailerUrl: input.trailerUrl?.trim() || null,
    featured: Boolean(input.featured),
  };
}

export function createMovie(input: MovieInput): Movie {
  const db = getDb();
  const movie = { id: slugify(input.title) || `movie-${db.movies.length + 1}`, ...normalizeInput(input) };
  if (db.movies.some((m) => m.id === movie.id)) {
    movie.id = `${movie.id}-${db.movies.length + 1}`;
  }
  db.movies.push(movie);
  saveDb();
  return movie;
}

export function updateMovie(id: string, input: MovieInput): Movie | undefined {
  const db = getDb();
  const index = db.movies.findIndex((m) => m.id === id);
  if (index < 0) return undefined;
  db.movies[index] = { ...db.movies[index], ...normalizeInput(input), id };
  saveDb();
  return db.movies[index];
}

export function deleteMovie(id: string): boolean {
  const db = getDb();
  const index = db.movies.findIndex((m) => m.id === id);
  if (index < 0) return false;
  db.movies.splice(index, 1);
  db.showtimes = db.showtimes.filter((s) => s.movieId !== id);
  saveDb();
  return true;
}

export function setMovieStatus(id: string, status: Movie['status']): Movie | undefined {
  const db = getDb();
  const movie = db.movies.find((m) => m.id === id);
  if (!movie) return undefined;
  movie.status = status;
  saveDb();
  return movie;
}
