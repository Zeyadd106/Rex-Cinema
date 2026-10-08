import { createBooking, listBookings } from '@/lib/bookings';
import { errorJson, json, query, readBody } from '@/lib/http';
import type { CreateBookingPayload } from '@/types/booking';
import type { PaymentInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';

interface CreateBookingBody extends CreateBookingPayload {
  payment?: PaymentInput;
}

export function GET(request: Request): Response {
  const reference = query(request, 'reference');
  const status = query(request, 'status');
  const q = query(request, 'q');
  const limitParam = query(request, 'limit');

  if (reference) {
    const bookings = listBookings({ q: reference }).filter(
      (b) => b.reference.toLowerCase() === reference.toLowerCase(),
    );
    return json({ bookings });
  }

  const limit = limitParam ? Math.max(1, Math.min(200, Number(limitParam) || 50)) : undefined;
  return json({ bookings: listBookings({ status, q, limit }) });
}

export async function POST(request: Request): Promise<Response> {
  const body = await readBody<CreateBookingBody>(request);
  const result = createBooking({
    showtimeId: String(body.showtimeId ?? ''),
    seats: Array.isArray(body.seats) ? body.seats : [],
    customer: body.customer ?? { fullName: '', phone: '', email: '' },
    payment: body.payment,
  });

  if (!result.ok) {
    return errorJson(result.status, result.errors, result.message ?? 'Booking failed');
  }
  return json({ booking: result.booking }, 201);
}
