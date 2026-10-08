import type { Booking, CreateBookingPayload } from '@/types/booking';
import { priceQuote } from './pricing';
import { bookedSeatIds, disabledSeatIds, hallSeatIds } from './seats';
import { getDb, saveDb } from './store';
import { getShowtime } from './showtimes';
import { daysFromToday, makeId, makeReference, todayISO } from './utils';
import { hasErrors, validateCustomer, validatePayment, type ErrorMap, type PaymentInput } from './validation';

export interface ListBookingsFilters {
  status?: string;
  q?: string;
  limit?: number;
}

export function listBookings(filters: ListBookingsFilters = {}): Booking[] {
  const { status, q, limit } = filters;
  let rows = [...getDb().bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status) rows = rows.filter((b) => b.status === status);
  if (q) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter(
      (b) =>
        b.reference.toLowerCase().includes(needle) ||
        b.movieTitle.toLowerCase().includes(needle) ||
        b.customer.fullName.toLowerCase().includes(needle) ||
        b.customer.phone.includes(needle),
    );
  }
  return limit ? rows.slice(0, limit) : rows;
}

export function getBooking(id: string): Booking | undefined {
  const db = getDb();
  return db.bookings.find((b) => b.id === id || b.reference === id);
}

export interface CreateBookingInput extends CreateBookingPayload {
  payment?: PaymentInput;
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: number; message?: string; errors?: ErrorMap };

export function createBooking(input: CreateBookingInput): CreateBookingResult {
  const showtime = getShowtime(input.showtimeId);
  if (!showtime) {
    return { ok: false, status: 404, errors: { showtime: ['notFound'] } };
  }
  if (daysFromToday(showtime.date) < 0) {
    return { ok: false, status: 422, errors: { showtime: ['past'] } };
  }

  const customerErrors = validateCustomer(input.customer ?? {});
  if (hasErrors(customerErrors)) return { ok: false, status: 422, errors: customerErrors };

  const paymentErrors = validatePayment(input.payment);
  if (hasErrors(paymentErrors)) return { ok: false, status: 422, errors: paymentErrors };

  const db = getDb();
  const hall = db.halls.find((h) => h.id === showtime.hallId);
  if (!hall) return { ok: false, status: 404, errors: { showtime: ['notFound'] } };

  const seats = [...new Set(Array.isArray(input.seats) ? input.seats : [])];
  if (seats.length === 0) return { ok: false, status: 422, errors: { seats: ['required'] } };
  if (seats.length > 10) return { ok: false, status: 422, errors: { seats: ['tooMany'] } };

  const validIds = new Set(hallSeatIds(hall));
  for (const seat of seats) {
    if (!validIds.has(seat)) return { ok: false, status: 422, errors: { seats: ['invalid'] } };
  }

  const disabled = disabledSeatIds(hall);
  if (seats.some((s) => disabled.has(s))) {
    return { ok: false, status: 422, errors: { seats: ['disabled'] } };
  }

  const taken = bookedSeatIds(showtime.id);
  if (seats.some((s) => taken.has(s))) {
    return { ok: false, status: 409, errors: { seats: ['taken'] } };
  }

  const movie = db.movies.find((m) => m.id === showtime.movieId);
  if (!movie) return { ok: false, status: 404, errors: { movie: ['notFound'] } };

  const quote = priceQuote(seats.length);
  const booking: Booking = {
    id: makeId('bk'),
    reference: makeReference(),
    showtimeId: showtime.id,
    movieId: movie.id,
    movieTitle: movie.title,
    moviePoster: movie.poster,
    cinemaName: db.cinemas.find((c) => c.id === hall.cinemaId)?.name ?? '',
    hallName: hall.name,
    showDate: showtime.date,
    showTime: showtime.time,
    seats,
    seatLabels: seats.map((s) => s.split(':')[1]),
    customer: {
      fullName: input.customer.fullName.trim(),
      phone: input.customer.phone.trim(),
      email: (input.customer.email ?? '').trim(),
    },
    quote,
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: input.payment && input.payment.cardNumber?.replace(/[\s-]/g, '').startsWith('4') ? 'credit_card' : 'debit_card',
    createdAt: new Date().toISOString(),
  };

  db.bookings.push(booking);
  saveDb();
  return { ok: true, booking };
}

export function updateBookingStatus(id: string, status: Booking['status']): Booking | undefined {
  const db = getDb();
  const booking = db.bookings.find((b) => b.id === id || b.reference === id);
  if (!booking) return undefined;
  booking.status = status;
  saveDb();
  return booking;
}

export function adminStats() {
  const db = getDb();
  const bookings = db.bookings;
  const paid = bookings.filter((b) => b.paymentStatus === 'paid');
  return {
    totalMovies: db.movies.length,
    nowShowing: db.movies.filter((m) => m.status === 'now-showing').length,
    comingSoon: db.movies.filter((m) => m.status === 'coming-soon').length,
    totalBookings: bookings.length,
    paidBookings: paid.length,
    revenue: Math.round(paid.reduce((sum, b) => sum + b.quote.total, 0) * 100) / 100,
    upcomingShowtimes: db.showtimes.filter((s) => s.date >= todayISO()).length,
  };
}
