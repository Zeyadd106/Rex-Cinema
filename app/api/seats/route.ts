import { errorJson, json, query } from '@/lib/http';
import { getSeatMap } from '@/lib/seats';
import { getShowtime } from '@/lib/showtimes';
import { getDb } from '@/lib/store';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  const showtimeId = query(request, 'showtimeId');
  const hallId = query(request, 'hallId');

  if (showtimeId) {
    const map = getSeatMap(showtimeId);
    if (!map) return errorJson(404, { showtimeId: ['notFound'] }, 'Showtime not found');
    const showtime = getShowtime(showtimeId);
    const hall = getDb().halls.find((h) => h.id === map.hallId);
    return json({ map, showtime, hall });
  }

  if (hallId) {
    const hall = getDb().halls.find((h) => h.id === hallId);
    if (!hall) return errorJson(404, { hallId: ['notFound'] }, 'Screen not found');
    const seats = hall.rows.flatMap((row) =>
      Array.from({ length: hall.seatsPerRow }, (_, i) => ({
        id: `${hall.id}:${row}${i + 1}`,
        row,
        number: i + 1,
        label: `${row}${i + 1}`,
        state: 'available' as const,
      })),
    );
    return json({ map: { showtimeId: '', hallId: hall.id, rows: hall.rows, seats }, hall });
  }

  return errorJson(400, undefined, 'showtimeId or hallId is required');
}
