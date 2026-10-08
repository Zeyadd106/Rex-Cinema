import { deleteShowtime, getShowtime, getShowtimeDetails, updateShowtime } from '@/lib/showtimes';
import { errorJson, json, readBody } from '@/lib/http';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const showtime = getShowtimeDetails(id);
  if (!showtime) return errorJson(404, undefined, 'Showtime not found');
  return json({ showtime });
}

export async function PUT(request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  if (!getShowtime(id)) return errorJson(404, undefined, 'Showtime not found');

  const body = await readBody<{ movieId?: string; hallId?: string; date?: string; time?: string }>(request);
  const errors: Record<string, string[]> = {};
  if (!body.date) errors.date = ['required'];
  if (!body.time) errors.time = ['required'];
  if (Object.keys(errors).length) return errorJson(422, errors, 'Validation failed');

  const showtime = updateShowtime(id, {
    ...(body.movieId ? { movieId: body.movieId } : {}),
    ...(body.hallId ? { hallId: body.hallId } : {}),
    date: body.date!,
    time: body.time!,
  });
  if (!showtime) return errorJson(404, { movieId: ['notFound'] }, 'Movie or screen not found');
  return json({ showtime });
}

export async function DELETE(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  if (!deleteShowtime(id)) return errorJson(404, undefined, 'Showtime not found');
  return json({ ok: true });
}
