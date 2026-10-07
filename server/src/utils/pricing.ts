import { getSetting } from '../config/db.js';

export const TICKET_PRICE = Number(process.env.TICKET_PRICE || 12);

export interface PriceQuote {
  subtotal: number;
  booking_fee: number;
  tax_amount: number;
  total: number;
  tax_rate: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function priceQuote(seatCount: number): Promise<PriceQuote> {
  const subtotal = round2(seatCount * TICKET_PRICE);
  const booking_fee = Math.max(0, Number(await getSetting('booking_fee', '0')) || 0);
  const tax_rate = Math.min(100, Math.max(0, Number(await getSetting('tax_rate', '0')) || 0));
  const tax_amount = round2((subtotal + booking_fee) * (tax_rate / 100));
  return { subtotal, booking_fee, tax_amount, total: round2(subtotal + booking_fee + tax_amount), tax_rate };
}
