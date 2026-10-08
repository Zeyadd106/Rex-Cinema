import { createShowtime, listShowtimes, type ShowtimeFilters } from '@/lib/showtimes';
import { errorJson, json, query, readBody } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  const filters: ShowtimeFilters = {
    movieId: query(request, 'movieId'),
    cinemaId: query(request, 'cinemaId'),
    date: query(request, 'date'),
    from: query(request, 'from'),
    to: query(request, 'to'),
  };
  return json({ showtimes: listShowtimes(filters) });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBody<{ movieId?: string; hallId?: string; date?: string; time?: string }>(request);
  const errors: Record<string, string[]> = {};
  if (!body.movieId) errors.movieId = ['required'];
  if (!body.hallId) errors.hallId = ['required'];
  if (!body.date) errors.date = ['required'];
  if (!body.time) errors.time = ['required'];
  if (Object.keys(errors).length) return errorJson(422, errors, 'Validation failed');

  const showtime = createShowtime({
    movieId: body.movieId!,
    hallId: body.hallId!,
    date: body.date!,
    time: body.time!,
  });
  if (!showtime) return errorJson(404, { movieId: ['notFound'] }, 'Movie or screen not found');
  return json({ showtime }, 201);
}
