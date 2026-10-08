'use client';
import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import SeatMap from '@/components/SeatMap';
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/States';
import { inputClass } from '@/components/admin/fields';
import { api } from '@/lib/client';
import { formatDay, formatTime } from '@/lib/format';
import { cn, datePlusDays, todayISO } from '@/lib/utils';
import type { SeatMapPayload } from '@/types/seat';
import type { Hall, Showtime, ShowtimeDetails } from '@/types/showtime';

interface SeatsResponse {
  map: SeatMapPayload;
  showtime: Showtime;
  hall: Hall;
}

const SHOWTIME_SELECT = cn(inputClass, 'h-12 rounded-full pe-8 [&_option]:bg-[#0f0f0f]');

export default function AdminSeatsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [showtimes, setShowtimes] = useState<ShowtimeDetails[]>([]);
  const [showtimesLoading, setShowtimesLoading] = useState(true);
  const [showtimesFailed, setShowtimesFailed] = useState(false);
  const [selected, setSelected] = useState('');
  const [data, setData] = useState<SeatsResponse | null>(null);
  const [seatsState, setSeatsState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [reloadKey, setReloadKey] = useState(0);

  const loadShowtimes = useCallback(async () => {
    setShowtimesLoading(true);
    try {
      const response = await api.get<{ showtimes: ShowtimeDetails[] }>(
        `/showtimes?from=${todayISO()}&to=${datePlusDays(7)}`,
      );
      setShowtimes(response.showtimes);
      setShowtimesFailed(false);
    } catch {
      setShowtimesFailed(true);
    } finally {
      setShowtimesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShowtimes();
  }, [loadShowtimes]);

  useEffect(() => {
    if (!selected) {
      setData(null);
      setSeatsState('idle');
      return;
    }
    let cancelled = false;
    setSeatsState('loading');
    api
      .get<SeatsResponse>(`/seats?showtimeId=${encodeURIComponent(selected)}`)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        setSeatsState('ready');
      })
      .catch(() => {
        if (!cancelled) setSeatsState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [selected, reloadKey]);

  const selectedDetails = showtimes.find((showtime) => showtime.id === selected) ?? null;

  let stats: { total: number; available: number; occupied: number; disabled: number; occupancy: string } | null = null;
  if (data) {
    const total = data.map.seats.length;
    const occupied = data.map.seats.filter((seat) => seat.state === 'occupied').length;
    const disabled = data.map.seats.filter((seat) => seat.state === 'disabled').length;
    const available = total - occupied - disabled;
    const occupancy = total === 0 ? '0.0' : (((occupied + disabled) / total) * 100).toFixed(1);
    stats = { total, available, occupied, disabled, occupancy };
  }

  if (showtimesLoading) return <LoadingState />;
  if (showtimesFailed) return <ErrorState onRetry={loadShowtimes} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="block w-full sm:max-w-xl">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
            {t('seatsPage.showtime')}
          </span>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={SHOWTIME_SELECT}
          >
            <option value="">{tCommon('none')}</option>
            {showtimes.map((showtime) => (
              <option key={showtime.id} value={showtime.id}>
                {`${showtime.movieTitle} · ${formatDay(showtime.date, locale)} ${formatTime(showtime.time, locale)} · ${showtime.cinemaName}`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selected ? (
        <EmptyState message={t('seatsPage.selectShowtime')} />
      ) : seatsState === 'loading' ? (
        <LoadingState />
      ) : seatsState === 'error' || !data || !stats ? (
        <ErrorState onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-white/55 ring-1 ring-white/10">
              {t('seatsPage.cinema')}
              <span className="ms-1.5 font-semibold text-white/90">
                {selectedDetails?.cinemaName ?? tCommon('none')}
              </span>
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-white/55 ring-1 ring-white/10">
              {t('seatsPage.hall')}
              <span className="ms-1.5 font-semibold text-white/90">{data.hall.name}</span>
            </span>
            <span className="rounded-full bg-white/5 px-3 py-1.5 text-white/55 ring-1 ring-white/10">
              {t('seatsPage.showtime')}
              <span className="ms-1.5 font-semibold text-white/90">
                {`${formatDay(data.showtime.date, locale)} · ${formatTime(data.showtime.time, locale)}`}
              </span>
            </span>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { key: 'total', value: String(stats.total) },
              { key: 'available', value: String(stats.available) },
              { key: 'occupied', value: String(stats.occupied) },
              { key: 'disabled', value: String(stats.disabled) },
              { key: 'occupancy', value: `${stats.occupancy}%` },
            ].map((card) => (
              <div
                key={card.key}
                className="rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-4 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                  {t(`seatsPage.${card.key}`)}
                </p>
                <p className="mt-1.5 text-2xl font-bold text-white">{card.value}</p>
              </div>
            ))}
          </section>

          <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-6 sm:px-6">
            <SeatMap
              map={data.map}
              selected={[]}
              onToggle={() => {}}
              onRefresh={() => setReloadKey((key) => key + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
