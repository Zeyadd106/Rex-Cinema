'use client';
import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Clock, DollarSign, Film, Play, Ticket } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import StatusPill, { statusTone } from '@/components/admin/StatusPill';
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/States';
import { api } from '@/lib/client';
import { formatDay, formatMoney } from '@/lib/format';
import type { AdminStats } from '@/types/admin';
import type { Booking } from '@/types/booking';

interface StatsResponse {
  stats: AdminStats;
  recentBookings: Booking[];
}

const TH = 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-white/45';

export default function AdminOverviewPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const locale = useLocale();
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setFailed(false);
    api
      .get<StatsResponse>('/admin/stats')
      .then((response) => setData(response))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <LoadingState />;
  if (failed || !data) return <ErrorState onRetry={load} />;

  const cards = [
    { key: 'totalMovies', icon: Film, value: String(data.stats.totalMovies) },
    { key: 'nowShowing', icon: Play, value: String(data.stats.nowShowing) },
    { key: 'comingSoon', icon: CalendarClock, value: String(data.stats.comingSoon) },
    { key: 'totalBookings', icon: Ticket, value: String(data.stats.totalBookings) },
    { key: 'revenue', icon: DollarSign, value: formatMoney(data.stats.revenue, locale) },
    { key: 'upcomingShowtimes', icon: Clock, value: String(data.stats.upcomingShowtimes) },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e31837]/15 text-[#e31837] ring-1 ring-[#e31837]/25">
              <card.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-white/45">
                {t(`stats.${card.key}`)}
              </p>
              <p className="mt-1 truncate text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-base font-bold text-white">{t('recentBookings')}</h2>
        {data.recentBookings.length === 0 ? (
          <EmptyState message={tCommon('noResults')} />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f]">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-white/10 bg-white/[0.03]">
                <tr>
                  <th className={TH}>{t('table.reference')}</th>
                  <th className={TH}>{t('table.movie')}</th>
                  <th className={TH}>{t('table.customer')}</th>
                  <th className={TH}>{t('table.date')}</th>
                  <th className={TH}>{t('table.amount')}</th>
                  <th className={TH}>{t('table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.recentBookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-white/75">
                      {booking.reference}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{booking.movieTitle}</td>
                    <td className="px-4 py-3 text-white/70">{booking.customer.fullName}</td>
                    <td className="px-4 py-3 text-white/60">{formatDay(booking.showDate, locale)}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {formatMoney(booking.quote.total, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusTone(booking.status)}>{tStatus(booking.status)}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
