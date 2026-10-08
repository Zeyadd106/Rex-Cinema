'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Calendar, Clock, Film, Ticket, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useBooking } from '@/context/BookingContext';
import BookingStepper from '@/components/BookingStepper';
import BookingSummary from '@/components/BookingSummary';
import { api } from '@/lib/client';
import type { Booking } from '@/types/booking';
import type { Movie } from '@/types/movie';
import type { ShowtimeDetails } from '@/types/showtime';
import { formatDay, formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/30',
  pending: 'bg-amber-400/10 text-amber-300 ring-amber-400/30',
  cancelled: 'bg-[#e31837]/15 text-[#e31837] ring-[#e31837]/40',
};

export default function DashboardClient() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tSum = useTranslations('summary');
  const tBook = useTranslations('book');
  const locale = useLocale();
  const { draft, ready, reset, recentRefs } = useBooking();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtime, setShowtime] = useState<ShowtimeDetails | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    if (!draft.movieId) {
      setMovie(null);
      return;
    }
    let alive = true;
    api
      .get<{ movie: Movie }>(`/movies/${encodeURIComponent(draft.movieId)}`)
      .then((data) => {
        if (alive) setMovie(data.movie);
      })
      .catch(() => {
        if (alive) setMovie(null);
      });
    return () => {
      alive = false;
    };
  }, [draft.movieId]);

  useEffect(() => {
    if (!draft.showtimeId) {
      setShowtime(null);
      return;
    }
    let alive = true;
    api
      .get<{ showtime: ShowtimeDetails }>(`/showtimes/${encodeURIComponent(draft.showtimeId)}`)
      .then((data) => {
        if (alive) setShowtime(data.showtime);
      })
      .catch(() => {
        if (alive) setShowtime(null);
      });
    return () => {
      alive = false;
    };
  }, [draft.showtimeId]);

  useEffect(() => {
    const refs = recentRefs.slice(0, 6);
    if (!ready || !refs.length) {
      setRecent([]);
      setRecentLoading(false);
      return;
    }
    let alive = true;
    setRecentLoading(true);
    Promise.all(
      refs.map((ref) =>
        api
          .get<{ booking: Booking }>(`/bookings/${encodeURIComponent(ref)}`)
          .then((data) => data.booking)
          .catch(() => null),
      ),
    ).then((bookings) => {
      if (!alive) return;
      setRecent(bookings.filter((b): b is Booking => b !== null));
      setRecentLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [ready, recentRefs]);

  const steps = useMemo(
    () => [
      t('steps.movie'),
      t('steps.showtime'),
      t('steps.seats'),
      t('steps.details'),
      t('steps.payment'),
    ],
    [t],
  );

  const hasDraft = Boolean(
    draft.movieId || draft.cinemaId || draft.date || draft.showtimeId || draft.seats.length,
  );

  const progress = [
    Boolean(draft.movieId),
    Boolean(draft.showtimeId),
    draft.seats.length > 0,
    Boolean(draft.customer.fullName.trim()),
    false,
  ];
  const currentStep = Math.max(0, progress.findIndex((done) => !done));

  const readyForDetails = draft.seats.length > 0;
  const continueHref = readyForDetails ? '/booking-details' : '/book-movie';

  const seatLabels = useMemo(
    () => draft.seats.map((id) => id.split(':').pop() ?? id),
    [draft.seats],
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-white/50 sm:px-6">
        {tCommon('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <section className="mt-8">
        <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
          {t('currentBooking')}
        </h2>

        {hasDraft ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6">
            <BookingStepper steps={steps} current={currentStep} />

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
              <BookingSummary
                movieTitle={movie?.title ?? tSum('none')}
                cinemaName={showtime?.cinemaName ?? tSum('none')}
                hallName={showtime?.hallName ?? tSum('none')}
                date={showtime?.date ?? draft.date}
                time={showtime?.time ?? null}
                seatLabels={seatLabels}
                quote={null}
              />

              <div className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-white/40 uppercase">
                    {t('progress')}
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    {draft.seats.length
                      ? tBook('seatsSelected', { count: draft.seats.length })
                      : t('noSeats')}
                  </p>
                  {showtime ? (
                    <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
                      <Calendar className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                      {formatDay(showtime.date, locale)}
                      <Clock className="ms-2 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                      {showtime.time}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={continueHref}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e31837] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#c41530]"
                  >
                    {t('continueBooking')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/60 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {t('clearDraft')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-16 text-center">
            <Ticket className="h-10 w-10 text-white/20" aria-hidden="true" />
            <p className="text-lg font-semibold text-white/70">{t('empty')}</p>
            <p className="max-w-sm text-sm text-white/40">{t('emptyHint')}</p>
            <Link
              href="/book-movie"
              className="mt-2 rounded-full bg-[#e31837] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#c41530]"
            >
              {t('startBooking')}
            </Link>
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('recent')}</h2>

        {recentLoading ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
            <div className="h-32 animate-pulse rounded-2xl bg-white/5" />
          </div>
        ) : recent.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {recent.map((booking) => (
              <Link
                key={booking.reference}
                href={`/confirmation?ref=${encodeURIComponent(booking.reference)}`}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 transition hover:border-[#e31837]/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-white">{booking.reference}</p>
                  <p className="mt-0.5 truncate text-sm text-white/70">{booking.movieTitle}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-white/40">
                    <Film className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {formatDay(booking.showDate, locale)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {booking.seatLabels.slice(0, 6).map((label) => (
                      <span
                        key={label}
                        className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white ring-1 ring-white/15"
                      >
                        {label}
                      </span>
                    ))}
                    {booking.seatLabels.length > 6 ? (
                      <span className="rounded-md bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/40">
                        +{booking.seatLabels.length - 6}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="text-sm font-bold text-white">
                    {formatMoney(booking.quote.total, locale)}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1',
                      STATUS_STYLES[booking.status] ?? STATUS_STYLES.pending,
                    )}
                  >
                    {tStatus(booking.status)}
                  </span>
                  <span className="text-xs font-semibold text-white/50 transition group-hover:text-white">
                    {t('view')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
            {t('recentEmpty')}
          </p>
        )}
      </section>
    </div>
  );
}
