import { errorJson, json, query } from '@/lib/http';
import { priceQuote } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export function GET(request: Request): Response {
  const seats = Number(query(request, 'seats') ?? 0);
  if (!Number.isInteger(seats) || seats < 1 || seats > 10) {
    return errorJson(422, { seats: ['tooMany'] }, 'Seat count must be 1-10');
  }
  return json({ quote: priceQuote(seats) });
}
