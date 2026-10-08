'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  Check,
  Clock,
  MapPin,
  Printer,
  Ticket,
  User,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { useBooking } from '@/context/BookingContext';
import BookingStepper from '@/components/BookingStepper';
import BookingSummary from '@/components/BookingSummary';
import Poster from '@/components/Poster';
import { api } from '@/lib/client';
import type { Booking } from '@/types/booking';
import { formatDay, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';

const BADGE_STYLES: Record<string, string> = {
  paid: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  failed: 'bg-[#e31837]/15 text-[#e31837] ring-[#e31837]/40',
};

export default function ConfirmationClient() {
  const t = useTranslations('confirmation');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tSum = useTranslations('summary');
  const tPay = useTranslations('payment');
  const tDash = useTranslations('dashboard');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { ready, recentRefs } = useBooking();

  const [refParam] = useState(() => searchParams.get('ref'));
  const resolvedRef = refParam ?? (ready ? (recentRefs[0] ?? null) : null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!resolvedRef) {
      setBooking(null);
      return;
    }
    let alive = true;
    setBooking(null);
    setFailed(false);
    api
      .get<{ booking: Booking }>(`/bookings/${encodeURIComponent(resolvedRef)}`)
      .then((data) => {
        if (alive) setBooking(data.booking);
      })
      .catch(() => {
        if (alive) {
          setBooking(null);
          setFailed(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [resolvedRef]);

  const steps = useMemo(
    () => [
      tDash('steps.movie'),
      tDash('steps.showtime'),
      tDash('steps.seats'),
      tDash('steps.details'),
      tDash('steps.payment'),
    ],
    [tDash],
  );

  if (!ready || (!booking && !failed && resolvedRef)) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-white/50 sm:px-6">
        {tCommon('loading')}
      </div>
    );
  }

  if (!booking || failed) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <Ticket className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="text-lg font-semibold text-white/70">{t('notFound')}</p>
          <p className="max-w-sm text-sm text-white/40">{t('notFoundHint')}</p>
          <Link
            href="/book-movie"
            className="mt-2 rounded-full bg-[#e31837] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#c41530]"
          >
            {t('startBooking')}
          </Link>
        </div>
      </div>
    );
  }

  const paymentLabel =
    booking.paymentMethod === 'credit_card'
      ? tPay('creditCard')
      : booking.paymentMethod === 'debit_card'
        ? tPay('debitCard')
        : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="no-print text-center">
        <span className="check-pop mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e31837]/15 ring-1 ring-[#e31837]/40">
          <Check className="h-7 w-7 text-[#e31837]" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <BookingStepper steps={steps} current={steps.length} className="mt-6" />

      <article className="ticket-enter mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#0f0f0f]">
        <div className="flex flex-wrap items-center gap-4 border-b border-dashed border-white/15 px-5 py-5 sm:px-7">
          <Poster
            src={booking.moviePoster}
            alt={booking.movieTitle}
            className="h-28 w-20 shrink-0 rounded-lg ring-1 ring-white/10 sm:h-32 sm:w-24"
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-white sm:text-2xl">{booking.movieTitle}</h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/50">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
                {formatDay(booking.showDate, locale)}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden="true" />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
                {formatTime(booking.showTime, locale)}
              </span>
            </p>
            <span
              className={cn(
                'mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1',
                BADGE_STYLES[booking.paymentStatus] ?? BADGE_STYLES.pending,
              )}
            >
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {tStatus(booking.paymentStatus)}
              {paymentLabel ? <span className="font-medium opacity-80">· {paymentLabel}</span> : null}
            </span>
          </div>
          <div className="text-end">
            <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('bookingId')}</p>
            <p className="mt-1 font-mono text-lg font-bold break-all text-white sm:text-xl">
              {booking.reference}
            </p>
          </div>
        </div>

        <div className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2 sm:px-7">
          <div>
            <p className="text-xs text-white/40">{t('bookedFor')}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
              <User className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              {booking.customer.fullName}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/40">{tSum('cinema')}</p>
            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
              <MapPin className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              <span className="truncate">
                {booking.cinemaName} · {booking.hallName}
              </span>
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-white/40">{tSum('seats')}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {booking.seatLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </article>

      <div className="mt-6">
        <BookingSummary
          movieTitle={booking.movieTitle}
          cinemaName={booking.cinemaName}
          hallName={booking.hallName}
          date={booking.showDate}
          time={booking.showTime}
          seatLabels={booking.seatLabels}
          quote={booking.quote}
        />
      </div>

      <div className="no-print mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-[#e31837] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c41530]"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t('print')}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/10"
        >
          {t('backHome')}
        </Link>
        <Link
          href="/movies"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white/70 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
        >
          {t('browseMovies')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>

      <p className="no-print mt-6 text-center text-xs text-white/40">{t('noAccount')}</p>
    </div>
  );
}
