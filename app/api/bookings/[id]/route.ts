import { getBooking, updateBookingStatus } from '@/lib/bookings';
import { errorJson, json, readBody } from '@/lib/http';
import type { Booking } from '@/types/booking';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const booking = getBooking(decodeURIComponent(id));
  if (!booking) return errorJson(404, undefined, 'Booking not found');
  return json({ booking });
}

export async function PATCH(request: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const body = await readBody<{ status?: Booking['status'] }>(request);
  const status = body.status;
  if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
    return errorJson(422, { status: ['invalid'] }, 'Invalid status');
  }
  const booking = updateBookingStatus(decodeURIComponent(id), status);
  if (!booking) return errorJson(404, undefined, 'Booking not found');
  return json({ booking });
}
