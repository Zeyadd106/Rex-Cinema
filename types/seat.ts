export type SeatState = 'available' | 'occupied' | 'disabled';

export interface Seat {
  id: string;
  row: string;
  number: number;
  label: string;
}

export interface SeatAvailability {
  seatId: string;
  state: SeatState;
}

export interface SeatMapPayload {
  showtimeId: string;
  hallId: string;
  rows: string[];
  seats: (Seat & { state: SeatState })[];
}
