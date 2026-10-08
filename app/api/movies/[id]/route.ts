import { deleteMovie, getMovie, updateMovie } from '@/lib/movies';
import { errorJson, json, readBody } from '@/lib/http';
import type { MovieInput } from '@/types/movie';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const movie = getMovie(id);
  if (!movie) return errorJson(404, undefined, 'Movie not found');
  return json({ movie });
}

export async function PUT(request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  if (!getMovie(id)) return errorJson(404, undefined, 'Movie not found');

  const body = await readBody<MovieInput>(request);
  const title = body.title?.trim();
  const description = body.description?.trim();
  const releaseDate = body.releaseDate;
  const errors: Record<string, string[]> = {};
  if (!title) errors.title = ['required'];
  if (!description) errors.description = ['required'];
  if (!releaseDate) errors.releaseDate = ['required'];
  if (Object.keys(errors).length) return errorJson(422, errors, 'Validation failed');

  const movie = updateMovie(id, {
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
  if (!movie) return errorJson(404, undefined, 'Movie not found');
  return json({ movie });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  if (!deleteMovie(id)) return errorJson(404, undefined, 'Movie not found');
  return json({ ok: true });
}
