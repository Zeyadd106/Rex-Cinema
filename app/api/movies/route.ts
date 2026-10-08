import { createMovie, listMovies } from '@/lib/movies';
import { errorJson, json, query, readBody } from '@/lib/http';
import type { MovieInput } from '@/types/movie';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  const movies = listMovies({
    q: query(request, 'q'),
    genre: query(request, 'genre'),
    status: (query(request, 'status') as 'now-showing' | 'coming-soon' | undefined) ?? undefined,
  });
  return json({ movies });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBody<MovieInput>(request);
  const title = body.title?.trim();
  const description = body.description?.trim();
  const releaseDate = body.releaseDate;
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ['required'];
  if (!description) errors.description = ['required'];
  if (!releaseDate) errors.releaseDate = ['required'];
  if (Object.keys(errors).length) return errorJson(422, errors, 'Validation failed');

  const movie = createMovie({
    title: title!,
    description: description!,
    releaseDate: releaseDate!,
    poster: body.poster ?? '',
    genre: body.genre ?? [],
    duration: body.duration ?? '',
    rating: body.rating ?? '',
    status: body.status ?? 'now-showing',
    language: body.language ?? 'English',
    director: body.director ?? null,
    cast: body.cast ?? [],
    trailerUrl: body.trailerUrl ?? null,
    featured: Boolean(body.featured),
  });
  return json({ movie }, 201);
}
