import type { PriceQuote } from '@/types/booking';
import { getDb } from './store';
import { round2 } from './utils';

export function priceQuote(seatCount: number): PriceQuote {
  const settings = getDb().settings;
  const ticketPrice = Number(settings.ticket_price || 12) || 12;
  const bookingFee = Math.max(0, Number(settings.booking_fee || 0) || 0);
  const taxRate = Math.min(100, Math.max(0, Number(settings.tax_rate || 0) || 0));
  const subtotal = round2(seatCount * ticketPrice);
  const taxAmount = round2((subtotal + bookingFee) * (taxRate / 100));
  return {
    ticketCount: seatCount,
    ticketPrice,
    subtotal,
    bookingFee,
    taxRate,
    taxAmount,
    total: round2(subtotal + bookingFee + taxAmount),
  };
}

export function getSetting(key: string, fallback = ''): string {
  return getDb().settings[key] ?? fallback;
}
