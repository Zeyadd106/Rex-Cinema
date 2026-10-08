import type { SeatMapPayload, SeatState } from '@/types/seat';
import type { Hall } from '@/types/showtime';
import { getDb } from './store';
import { getHall } from './showtimes';

export function hallSeatIds(hall: Hall): string[] {
  const ids: string[] = [];
  for (const row of hall.rows) {
    for (let n = 1; n <= hall.seatsPerRow; n++) ids.push(`${hall.id}:${row}${n}`);
  }
  return ids;
}

/** Corner seats are blocked (e.g. accessibility / technical obstruction). */
export function disabledSeatIds(hall: Hall): Set<string> {
  const lastRow = hall.rows[hall.rows.length - 1];
  return new Set([
    `${hall.id}:${lastRow}1`,
    `${hall.id}:${lastRow}${hall.seatsPerRow}`,
  ]);
}

export function bookedSeatIds(showtimeId: string): Set<string> {
  const taken = new Set<string>();
  for (const booking of getDb().bookings) {
    if (booking.showtimeId !== showtimeId || booking.status === 'cancelled') continue;
    for (const seat of booking.seats) taken.add(seat);
  }
  return taken;
}

export function getSeatMap(showtimeId: string): SeatMapPayload | undefined {
  const db = getDb();
  const showtime = db.showtimes.find((s) => s.id === showtimeId);
  if (!showtime) return undefined;
  const hall = getHall(showtime.hallId);
  if (!hall) return undefined;

  const disabled = disabledSeatIds(hall);
  const taken = bookedSeatIds(showtimeId);

  const seats = hallSeatIds(hall).map((id) => {
    const [, label] = id.split(':');
    const row = label.slice(0, 1);
    const number = Number(label.slice(1));
    const state: SeatState = disabled.has(id) ? 'disabled' : taken.has(id) ? 'occupied' : 'available';
    return { id, row, number, label, state };
  });

  return { showtimeId, hallId: hall.id, rows: hall.rows, seats };
}

export function availableSeatCount(showtimeId: string): number {
  const map = getSeatMap(showtimeId);
  return map ? map.seats.filter((s) => s.state === 'available').length : 0;
}
