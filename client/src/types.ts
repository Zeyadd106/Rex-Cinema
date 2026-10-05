export interface User {
  id: number;
  name: string;
  email: string;
  is_admin: boolean;
  phone: string | null;
  birth_date: string | null;
  gender: string;
  preferred_cinema_id: number | null;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  preferred_cinema_id?: number | null;
}

export interface Movie {
  id: number;
  title: string;
  description: string;
  duration: string;
  poster_path: string;
  poster_url: string | null;
  trailer_url: string | null;
  genre: string;
  rating: string;
  language?: string;
  status: 'current' | 'coming_soon';
  release_date: string;
}

export interface Showtime {
  id: number;
  movie_id: number;
  hall_id: number | null;
  date: string;
  time: string;
  movie_title?: string;
  hall_name?: string;
  format?: string;
  cinema_id?: number;
  cinema_name?: string;
}

export interface Cinema {
  id: number;
  name: string;
  city: string;
  address: string;
  image_url: string | null;
  is_active: number;
  hall_count: number;
  upcoming_count: number;
}

export interface Hall {
  id: number;
  cinema_id: number;
  cinema_name: string;
  name: string;
  format: string;
  seat_count: number;
}

export interface Seat {
  id: number;
  row: string;
  number: number;
  seat_number: string;
  is_available: boolean;
  is_held: boolean;
  held_by_me: boolean;
}

export interface BookingSeat {
  id: number;
  row: string;
  number: number;
  seat_number: string;
}

export interface Payment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  card_last_four: string | null;
  status: string;
}

export interface Booking {
  id: number;
  user_id: number;
  showtime_id: number;
  subtotal: number;
  booking_fee: number;
  tax_amount: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_method: string | null;
  booking_reference: string;
  check_in_token: string | null;
  checked_in_at: string | null;
  paid_at: string | null;
  movie_title?: string;
  poster_path?: string;
  show_date?: string;
  show_time?: string;
  hall_name?: string;
  format?: string;
  cinema_name?: string;
  user_name?: string;
  user_email?: string;
  seats?: BookingSeat[];
  payment?: Payment | null;
  poster_url?: string | null;
  duration?: string;
  genre?: string;
}

export interface AdminStats {
  total_users: number;
  total_bookings: number;
  total_movies: number;
  coming_soon_count: number;
  revenue: number;
  recent_bookings: Booking[];
}

export const TICKET_PRICE = 12;

export interface PriceQuote {
  subtotal: number;
  booking_fee: number;
  tax_amount: number;
  total: number;
  tax_rate: number;
}

export interface Ticket {
  booking_id: number;
  booking_reference: string;
  check_in_token: string;
  movie_title: string;
  show_date: string;
  show_time: string;
  cinema_name?: string;
  hall_name?: string;
  format?: string;
  seats: string[];
  total_price: number;
  user_name: string;
  checked_in_at: string | null;
  qr_data: string;
}

export function posterSrc(movie: Pick<Movie, 'poster_url' | 'title'>): string | null {
  return movie.poster_url ?? null;
}

export function youtubeEmbed(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)|youtu\.be\/([^?]+)/);
  const id = m?.[1] ?? m?.[2];
  return id ? `https://www.youtube.com/embed/${id}` : null;
}
