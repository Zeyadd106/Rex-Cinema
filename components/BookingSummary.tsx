import { useLocale, useTranslations } from 'next-intl';
import type { PriceQuote } from '@/types/booking';
import { formatDay, formatMoney, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface BookingSummaryProps {
  movieTitle: string;
  cinemaName: string;
  hallName: string;
  date?: string | null;
  time?: string | null;
  seatLabels: string[];
  quote?: PriceQuote | null;
  className?: string;
}

function Row({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="shrink-0 text-white/45">{label}</span>
      <span className={cn('text-end font-medium text-white', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

export default function BookingSummary({
  movieTitle,
  cinemaName,
  hallName,
  date,
  time,
  seatLabels,
  quote,
  className,
}: BookingSummaryProps) {
  const t = useTranslations('summary');
  const locale = useLocale();

  return (
    <div className={cn('rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6', className)}>
      <h2 className="mb-2 text-xs font-semibold tracking-widest text-white/40 uppercase">{t('seats')}</h2>
      <div className="divide-y divide-white/5 text-sm">
        <Row label={t('movie')} value={movieTitle} />
        <Row label={t('cinema')} value={cinemaName} />
        <Row label={t('screen')} value={hallName} />
        <Row label={t('date')} value={date ? formatDay(date, locale) : t('none')} />
        <Row label={t('showtime')} value={time ? formatTime(time, locale) : t('none')} />
        <Row
          label={t('seats')}
          value={
            seatLabels.length ? (
              <span className="flex flex-wrap justify-end gap-1.5">
                {seatLabels.map((label) => (
                  <span key={label} className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-bold ring-1 ring-white/15">
                    {label}
                  </span>
                ))}
              </span>
            ) : (
              t('none')
            )
          }
        />
      </div>

      {quote ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="divide-y divide-white/5 text-sm">
            <Row
              label={`${t('tickets')} × ${quote.ticketCount}`}
              value={formatMoney(quote.ticketPrice, locale)}
              mono
            />
            <Row label={t('subtotal')} value={formatMoney(quote.subtotal, locale)} mono />
            <Row label={t('bookingFee')} value={formatMoney(quote.bookingFee, locale)} mono />
            <Row label={t('tax')} value={formatMoney(quote.taxAmount, locale)} mono />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm font-semibold text-white/60">{t('total')}</span>
            <span className="text-xl font-bold text-[#e31837]">{formatMoney(quote.total, locale)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
