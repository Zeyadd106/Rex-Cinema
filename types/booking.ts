export interface PriceQuote {
  ticketCount: number;
  ticketPrice: number;
  subtotal: number;
  bookingFee: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface BookingCustomer {
  fullName: string;
  phone: string;
  email: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Booking {
  id: string;
  reference: string;
  showtimeId: string;
  movieId: string;
  movieTitle: string;
  moviePoster: string;
  cinemaName: string;
  hallName: string;
  showDate: string;
  showTime: string;
  seats: string[];
  seatLabels: string[];
  customer: BookingCustomer;
  quote: PriceQuote;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  createdAt: string;
}

/** Temporary booking draft persisted across the booking flow (client only). */
export interface BookingDraft {
  movieId: string | null;
  cinemaId: string | null;
  hallId: string | null;
  date: string | null;
  showtimeId: string | null;
  seats: string[];
  customer: BookingCustomer;
}

export interface CreateBookingPayload {
  showtimeId: string;
  seats: string[];
  customer: BookingCustomer;
  paymentMethod?: string;
}

export interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}
