'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Armchair,
  Building2,
  Calendar,
  Check,
  Clock,
  Film,
  Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { useBooking } from '@/context/BookingContext';
import BookingSummary from '@/components/BookingSummary';
import Poster from '@/components/Poster';
import SeatMap from '@/components/SeatMap';
import { api } from '@/lib/client';
import type { PriceQuote } from '@/types/booking';
import type { Movie } from '@/types/movie';
import type { SeatMapPayload } from '@/types/seat';
import type { Cinema, Hall, ShowtimeDetails } from '@/types/showtime';
import { formatDay, formatTime } from '@/lib/format';
import { cn, datePlusDays, daysFromToday, todayISO } from '@/lib/utils';

const MAX_SEATS = 10;

interface WizardSectionProps {
  step: number;
  icon: LucideIcon;
  title: string;
  hint?: string;
  reduce: boolean;
  children: ReactNode;
}

function WizardSection({ step, icon: Icon, title, hint, reduce, children }: WizardSectionProps) {
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e31837] text-sm font-bold text-white">
          {step}
        </span>
        <Icon className="h-4.5 w-4.5 text-[#e31837]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {hint ? <span className="ms-auto text-xs text-white/40">{hint}</span> : null}
      </header>
      <div className="mt-5">{children}</div>
    </motion.section>
  );
}

function InlineLoading({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-white/50">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </p>
  );
}

function InlineError({ message, retryLabel, onRetry }: { message: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-white/50">
      <span className="inline-flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
        {message}
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/10"
      >
        {retryLabel}
      </button>
    </div>
  );
}

export default function BookMovieClient() {
  const t = useTranslations('book');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('validation');
  const tSum = useTranslations('summary');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion() ?? false;
  const { draft, ready, update } = useBooking();

  const movieParam = searchParams.get('movie');
  const showtimeParam = searchParams.get('showtime');

  const [movies, setMovies] = useState<Movie[] | null>(null);
  const [moviesError, setMoviesError] = useState(false);
  const [moviesReq, setMoviesReq] = useState(0);
  const [cinemas, setCinemas] = useState<Cinema[] | null>(null);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [showtimes, setShowtimes] = useState<ShowtimeDetails[] | null>(null);
  const [showtimesError, setShowtimesError] = useState(false);
  const [showtimesReq, setShowtimesReq] = useState(0);
  const [map, setMap] = useState<SeatMapPayload | null>(null);
  const [mapError, setMapError] = useState(false);
  const [mapReq, setMapReq] = useState(0);
  const [quote, setQuote] = useState<PriceQuote | null>(null);
  const [capped, setCapped] = useState(false);
  const movieLinked = useRef(false);
  const showtimeLinked = useRef(false);

  useEffect(() => {
    let alive = true;
    setMoviesError(false);
    api
      .get<{ movies: Movie[] }>('/movies?status=now-showing')
      .then((data) => {
        if (alive) setMovies(data.movies);
      })
      .catch(() => {
        if (alive) {
          setMovies([]);
          setMoviesError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [moviesReq]);

  useEffect(() => {
    let alive = true;
    api
      .get<{ cinemas: Cinema[]; halls: Hall[] }>('/cinemas')
      .then((data) => {
        if (alive) {
          setCinemas(data.cinemas);
          setHalls(data.halls);
        }
      })
      .catch(() => {
        if (alive) setCinemas([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!draft.movieId) {
      setShowtimes(null);
      return;
    }
    let alive = true;
    setShowtimes(null);
    setShowtimesError(false);
    api
      .get<{ showtimes: ShowtimeDetails[] }>(
        `/showtimes?movieId=${encodeURIComponent(draft.movieId)}&from=${todayISO()}&to=${datePlusDays(7)}`,
      )
      .then((data) => {
        if (alive) setShowtimes(data.showtimes);
      })
      .catch(() => {
        if (alive) {
          setShowtimes([]);
          setShowtimesError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [draft.movieId, showtimesReq]);

  useEffect(() => {
    if (!draft.showtimeId) {
      setMap(null);
      return;
    }
    let alive = true;
    setMap(null);
    setMapError(false);
    api
      .get<{ map: SeatMapPayload }>(`/seats?showtimeId=${encodeURIComponent(draft.showtimeId)}`)
      .then((data) => {
        if (alive) setMap(data.map);
      })
      .catch(() => {
        if (alive) {
          setMap(null);
          setMapError(true);
        }
      });
    return () => {
      alive = false;
    };
  }, [draft.showtimeId, mapReq]);

  const seatCount = draft.seats.length;

  useEffect(() => {
    if (seatCount < 1) {
      setQuote(null);
      return;
    }
    let alive = true;
    api
      .get<{ quote: PriceQuote }>(`/quote?seats=${seatCount}`)
      .then((data) => {
        if (alive) setQuote(data.quote);
      })
      .catch(() => {
        if (alive) setQuote(null);
      });
    return () => {
      alive = false;
    };
  }, [seatCount]);

  useEffect(() => {
    if (!ready || !movies || movieLinked.current) return;
    movieLinked.current = true;
    if (!movieParam || draft.movieId === movieParam) return;
    if (movies.some((m) => m.id === movieParam)) {
      update({ movieId: movieParam, cinemaId: null, hallId: null, date: null, showtimeId: null, seats: [] });
    }
  }, [ready, movies, movieParam, draft.movieId, update]);

  useEffect(() => {
    if (!ready || !showtimes || !showtimeParam || showtimeLinked.current) return;
    const linked = showtimes.find((s) => s.id === showtimeParam);
    if (!linked) return;
    showtimeLinked.current = true;
    if (draft.showtimeId === linked.id) return;
    update({
      showtimeId: linked.id,
      hallId: linked.hallId,
      date: linked.date,
      cinemaId: linked.cinemaId,
      seats: [],
    });
  }, [ready, showtimes, showtimeParam, draft.showtimeId, update]);

  useEffect(() => {
    if (!capped) return;
    const timer = window.setTimeout(() => setCapped(false), 3200);
    return () => window.clearTimeout(timer);
  }, [capped]);

  const hallsByCinema = useMemo(() => {
    const grouped = new Map<string, Hall[]>();
    for (const hall of halls) grouped.set(hall.cinemaId, [...(grouped.get(hall.cinemaId) ?? []), hall]);
    return grouped;
  }, [halls]);

  const bookableCinemas = useMemo(
    () => (cinemas ?? []).filter((cinema) => hallsByCinema.has(cinema.id)),
    [cinemas, hallsByCinema],
  );

  const dates = useMemo(() => [...new Set((showtimes ?? []).map((s) => s.date))].sort(), [showtimes]);

  const activeDate = draft.date ?? dates[0] ?? null;

  const dayShowtimes = useMemo(() => {
    if (!showtimes || !activeDate) return [];
    return showtimes.filter(
      (s) => s.date === activeDate && (!draft.cinemaId || s.cinemaId === draft.cinemaId),
    );
  }, [showtimes, activeDate, draft.cinemaId]);

  const movie = useMemo(() => (movies ?? []).find((m) => m.id === draft.movieId) ?? null, [movies, draft.movieId]);
  const cinema = useMemo(
    () => (cinemas ?? []).find((c) => c.id === draft.cinemaId) ?? null,
    [cinemas, draft.cinemaId],
  );
  const selectedShowtime = useMemo(
    () => (showtimes ?? []).find((s) => s.id === draft.showtimeId) ?? null,
    [showtimes, draft.showtimeId],
  );

  const cinemaName = selectedShowtime?.cinemaName ?? cinema?.name ?? '';
  const hallName =
    selectedShowtime?.hallName ??
    (draft.hallId ? (halls.find((h) => h.id === draft.hallId)?.name ?? '') : '');

  const seatLabels = useMemo(
    () => draft.seats.map((id) => id.split(':').pop() ?? id),
    [draft.seats],
  );

  const missing: string[] = [];
  if (!draft.movieId) missing.push(t('noMovie'));
  if (!draft.cinemaId) missing.push(t('noCinema'));
  if (!draft.date) missing.push(t('noDate'));
  if (!draft.showtimeId) missing.push(t('noShowtime'));
  if (!draft.seats.length) missing.push(t('noSeats'));
  const canContinue = missing.length === 0;

  const selectMovie = (id: string) => {
    if (id === draft.movieId) return;
    update({ movieId: id, cinemaId: null, hallId: null, date: null, showtimeId: null, seats: [] });
  };

  const selectCinema = (id: string) => {
    if (id === draft.cinemaId) return;
    update({ cinemaId: id, hallId: null, date: null, showtimeId: null, seats: [] });
  };

  const selectDate = (date: string) => {
    if (date === draft.date) return;
    update({ date, showtimeId: null, seats: [] });
  };

  const selectShowtime = (showtime: ShowtimeDetails) => {
    if (showtime.id === draft.showtimeId) return;
    update({ showtimeId: showtime.id, hallId: showtime.hallId, date: showtime.date, seats: [] });
  };

  const toggleSeat = (seatId: string) => {
    const selected = draft.seats.includes(seatId);
    if (!selected && draft.seats.length >= MAX_SEATS) {
      setCapped(true);
      return;
    }
    setCapped(false);
    update({ seats: selected ? draft.seats.filter((s) => s !== seatId) : [...draft.seats, seatId] });
  };

  const dateLabel = (date: string) => {
    const delta = daysFromToday(date);
    if (delta === 0) return t('today');
    if (delta === 1) return t('tomorrow');
    return formatDay(date, locale);
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-white/50 sm:px-6">
        {tCommon('loading')}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <WizardSection step={1} icon={Film} title={t('stepMovie')} reduce={reduce}>
            {movies === null ? (
              <InlineLoading label={tCommon('loading')} />
            ) : moviesError ? (
              <InlineError
                message={tCommon('error')}
                retryLabel={tCommon('retry')}
                onRetry={() => setMoviesReq((v) => v + 1)}
              />
            ) : movies.length ? (
              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
                {movies.map((m) => {
                  const selected = m.id === draft.movieId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectMovie(m.id)}
                      aria-pressed={selected}
                      className={cn(
                        'group w-36 shrink-0 rounded-xl border p-2 text-start transition sm:w-auto',
                        selected
                          ? 'border-[#e31837] bg-[#e31837]/10 ring-1 ring-[#e31837]/60'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25',
                      )}
                    >
                      <Poster
                        src={m.poster}
                        alt={m.title}
                        className="aspect-2/3 w-full rounded-lg ring-1 ring-white/10"
                      />
                      <span className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white">
                        {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-[#e31837]" aria-hidden="true" /> : null}
                        <span className="truncate">{m.title}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                {tCommon('noResults')}
              </p>
            )}
          </WizardSection>

          <WizardSection
            step={2}
            icon={Building2}
            title={t('stepCinema')}
            hint={draft.movieId ? undefined : t('pickMovie')}
            reduce={reduce}
          >
            {cinemas === null ? (
              <InlineLoading label={tCommon('loading')} />
            ) : bookableCinemas.length ? (
              <div className="flex flex-wrap gap-3">
                {bookableCinemas.map((c) => {
                  const selected = c.id === draft.cinemaId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCinema(c.id)}
                      disabled={!draft.movieId}
                      aria-pressed={selected}
                      className={cn(
                        'flex min-w-40 flex-col gap-0.5 rounded-xl border px-4 py-3 text-start transition disabled:cursor-not-allowed disabled:opacity-50',
                        selected
                          ? 'border-[#e31837] bg-[#e31837]/10 ring-1 ring-[#e31837]/60'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25',
                      )}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">
                        <Building2 className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                        {c.name}
                      </span>
                      <span className="text-xs text-white/40">{c.city}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                {tCommon('noResults')}
              </p>
            )}
          </WizardSection>

          <WizardSection
            step={3}
            icon={Calendar}
            title={t('stepDate')}
            hint={draft.movieId ? undefined : t('pickMovie')}
            reduce={reduce}
          >
            {!draft.movieId ? (
              <p className="text-sm text-white/40">{t('pickMovie')}</p>
            ) : showtimes === null ? (
              <InlineLoading label={tCommon('loading')} />
            ) : showtimesError ? (
              <InlineError
                message={tCommon('error')}
                retryLabel={tCommon('retry')}
                onRetry={() => setShowtimesReq((v) => v + 1)}
              />
            ) : dates.length ? (
              <div className="flex flex-wrap gap-2">
                {dates.map((date) => {
                  const selected = date === activeDate;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => selectDate(date)}
                      aria-pressed={selected}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition',
                        selected
                          ? 'bg-[#e31837] text-white ring-[#e31837]'
                          : 'text-white/60 ring-white/15 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      {dateLabel(date)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                {t('noShowtimes')}
              </p>
            )}
          </WizardSection>

          <WizardSection
            step={4}
            icon={Clock}
            title={t('stepShowtime')}
            hint={
              !draft.movieId ? t('pickMovie') : !draft.date ? t('pickDate') : undefined
            }
            reduce={reduce}
          >
            {!draft.date ? (
              <p className="text-sm text-white/40">{t('pickDate')}</p>
            ) : showtimes === null ? (
              <InlineLoading label={tCommon('loading')} />
            ) : dayShowtimes.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dayShowtimes.map((showtime) => {
                  const selected = showtime.id === draft.showtimeId;
                  return (
                    <button
                      key={showtime.id}
                      type="button"
                      onClick={() => selectShowtime(showtime)}
                      aria-pressed={selected}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-start transition',
                        selected
                          ? 'border-[#e31837] bg-[#e31837]/10 ring-1 ring-[#e31837]/60'
                          : 'border-white/10 bg-white/[0.04] hover:border-[#e31837]/60 hover:bg-[#e31837]/10',
                      )}
                    >
                      <span className="flex items-center gap-2 text-base font-bold text-white">
                        <Clock className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                        {formatTime(showtime.time, locale)}
                      </span>
                      <span className="flex flex-col items-end text-xs">
                        <span className="font-semibold text-white/70">{showtime.hallName}</span>
                        <span className="text-white/40">
                          {showtime.format} · {showtime.cinemaName}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-white/50">
                {t('noShowtimes')}
              </p>
            )}
          </WizardSection>

          <WizardSection
            step={5}
            icon={Armchair}
            title={t('stepSeats')}
            hint={!draft.showtimeId ? t('pickShowtime') : undefined}
            reduce={reduce}
          >
            {!draft.showtimeId ? (
              <p className="text-sm text-white/40">{t('pickShowtime')}</p>
            ) : map === null && mapError ? (
              <InlineError
                message={tCommon('error')}
                retryLabel={tCommon('retry')}
                onRetry={() => setMapReq((v) => v + 1)}
              />
            ) : map === null ? (
              <InlineLoading label={tCommon('loading')} />
            ) : (
              <>
                <SeatMap
                  map={map}
                  selected={draft.seats}
                  onToggle={toggleSeat}
                  onRefresh={() => setMapReq((v) => v + 1)}
                />
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {draft.seats.length ? (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
                      {t('seatsSelected', { count: draft.seats.length })}
                    </span>
                  ) : null}
                  {capped ? (
                    <span className="rounded-full bg-[#e31837]/15 px-3 py-1 text-xs font-semibold text-[#e31837] ring-1 ring-[#e31837]/40">
                      {tVal('tooMany')}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </WizardSection>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <BookingSummary
            movieTitle={movie?.title ?? tSum('none')}
            cinemaName={cinemaName || tSum('none')}
            hallName={hallName || tSum('none')}
            date={draft.date}
            time={selectedShowtime?.time ?? null}
            seatLabels={seatLabels}
            quote={quote}
          />

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6">
            <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('summary')}</h2>
            <button
              type="button"
              onClick={() => router.push('/booking-details')}
              disabled={!canContinue}
              className={cn(
                'mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition',
                canContinue
                  ? 'bg-[#e31837] text-white hover:bg-[#c41530]'
                  : 'cursor-not-allowed bg-white/10 text-white/40',
              )}
            >
              {t('continue')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </button>

            {missing.length ? (
              <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs text-white/40">
                {missing.map((reason) => (
                  <li key={reason} className="flex items-start gap-1.5">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e31837]" aria-hidden="true" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
