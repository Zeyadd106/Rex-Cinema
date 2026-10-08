import { listCinemas, listHalls } from '@/lib/showtimes';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const cinemas = listCinemas();
  const halls = listHalls();
  return json({ cinemas, halls });
}
