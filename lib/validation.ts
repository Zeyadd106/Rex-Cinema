import type { BookingCustomer } from '@/types/booking';

export type ErrorMap = Record<string, string[]>;

const PHONE_RE = /^\+?[0-9\s()-]{7,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateCustomer(customer: Partial<BookingCustomer>): ErrorMap {
  const errors: ErrorMap = {};
  const name = (customer.fullName ?? '').trim();
  const phone = (customer.phone ?? '').trim();
  const email = (customer.email ?? '').trim();

  if (!name) errors.fullName = ['required'];
  else if (name.length < 2) errors.fullName = ['tooShort'];

  if (!phone) errors.phone = ['required'];
  else if (!PHONE_RE.test(phone)) errors.phone = ['invalidPhone'];

  if (email && !EMAIL_RE.test(email)) errors.email = ['invalidEmail'];

  return errors;
}

export interface PaymentInput {
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
  holder?: string;
}

/**
 * Mock/demo payment validation — a real provider would be called from this
 * server-side function instead. No secret keys are ever handled client-side.
 */
export function validatePayment(payment: PaymentInput | undefined): ErrorMap {
  const errors: ErrorMap = {};
  if (!payment) return { payment: ['required'] };

  const number = (payment.cardNumber ?? '').replace(/[\s-]/g, '');
  if (!number) errors.cardNumber = ['required'];
  else if (!/^\d{13,19}$/.test(number)) errors.cardNumber = ['invalid'];

  const expiry = (payment.expiry ?? '').trim();
  if (!expiry) errors.expiry = ['required'];
  else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) errors.expiry = ['invalid'];
  else {
    const [month, year] = expiry.split('/').map(Number);
    const end = new Date(2000 + year, month, 1);
    if (end <= new Date()) errors.expiry = ['expired'];
  }

  const cvc = (payment.cvc ?? '').trim();
  if (!cvc) errors.cvc = ['required'];
  else if (!/^\d{3,4}$/.test(cvc)) errors.cvc = ['invalid'];

  const holder = (payment.holder ?? '').trim();
  if (!holder) errors.holder = ['required'];
  else if (holder.length < 2) errors.holder = ['tooShort'];

  return errors;
}

export function hasErrors(errors: ErrorMap): boolean {
  return Object.keys(errors).length > 0;
}
