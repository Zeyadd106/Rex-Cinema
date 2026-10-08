import { adminStats, listBookings } from '@/lib/bookings';
import { json } from '@/lib/http';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  return json({ stats: adminStats(), recentBookings: listBookings({ limit: 8 }) });
}
