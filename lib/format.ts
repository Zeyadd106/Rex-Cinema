/** Locale-aware date/time formatting helpers usable on server and client. */

const INTL_LOCALES: Record<string, string> = { en: 'en-US', ar: 'ar-EG' };

function intlLocale(locale: string): string {
  return INTL_LOCALES[locale] ?? 'en-US';
}

export function formatDay(date: string, locale: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(intlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatLongDate(date: string, locale: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(intlLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time: string, locale: string): string {
  return new Date(`2000-01-01T${time}:00`)
    .toLocaleTimeString(intlLocale(locale), { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
}

export function formatMoney(amount: number, locale: string): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}
