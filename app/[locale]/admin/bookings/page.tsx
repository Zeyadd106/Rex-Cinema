'use client';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import SearchBar from '@/components/SearchBar';
import StatusPill, { statusTone } from '@/components/admin/StatusPill';
import { EmptyState, ErrorState, LoadingState } from '@/components/admin/States';
import { validationKey } from '@/components/admin/validation';
import { ApiError, api } from '@/lib/client';
import { formatDay, formatMoney, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types/booking';

type StatusFilter = 'all' | BookingStatus;

const TH = 'px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-white/45';
const ICON_BTN =
  'rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]';
const FILTER_SELECT = cn(
  'h-12 w-full rounded-full border border-white/15 bg-white/5 px-4 text-sm text-white outline-none transition focus:border-[#e31837]/70 focus:bg-white/10 sm:w-52 [&_option]:bg-[#0f0f0f]',
);
const STATUS_SELECT = cn(
  'rounded-lg border border-white/15 bg-white/5 px-2 py-1.5 text-xs text-white/80 outline-none transition focus:border-[#e31837]/70 [&_option]:bg-[#0f0f0f]',
);

async function patchBooking(id: string, status: BookingStatus): Promise<Booking> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = (await res.json().catch(() => null)) as {
    booking?: Booking;
    message?: string;
    errors?: Record<string, string[]>;
  } | null;
  if (!res.ok) throw new ApiError(res.status, body, `Request failed (${res.status})`);
  if (!body?.booking) throw new Error('Malformed response');
  return body.booking;
}

export default function AdminBookingsPage() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tStatus = useTranslations('status');
  const tSummary = useTranslations('summary');
  const tPayment = useTranslations('payment');
  const tValidation = useTranslations('validation');
  const locale = useLocale();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<{ bookings: Booking[] }>('/bookings?limit=200');
      setBookings(response.bookings);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesQuery =
        !needle ||
        booking.reference.toLowerCase().includes(needle) ||
        booking.movieTitle.toLowerCase().includes(needle) ||
        booking.customer.fullName.toLowerCase().includes(needle) ||
        booking.customer.phone.includes(needle) ||
        booking.seatLabels.join(' ').toLowerCase().includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, q, statusFilter]);

  const changeStatus = async (booking: Booking, next: BookingStatus) => {
    if (booking.status === next) return;
    const previous = bookings;
    setActionError(null);
    setBookings(previous.map((item) => (item.id === booking.id ? { ...item, status: next } : item)));
    setSavingId(booking.id);
    try {
      const updated = await patchBooking(booking.id, next);
      setBookings((current) => current.map((item) => (item.id === booking.id ? updated : item)));
    } catch (error) {
      setBookings(previous);
      setActionError(tValidation(error instanceof ApiError ? validationKey(error.errors.status) : 'unknown'));
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (failed) return <ErrorState onRetry={load} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar value={q} onChange={setQ} placeholder={t('table.search')} className="sm:flex-1" />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          aria-label={t('table.status')}
          className={FILTER_SELECT}
        >
          <option value="all">{t('table.filterAll')}</option>
          <option value="pending">{tStatus('pending')}</option>
          <option value="confirmed">{tStatus('confirmed')}</option>
          <option value="cancelled">{tStatus('cancelled')}</option>
        </select>
      </div>

      {actionError ? (
        <p role="alert" className="rounded-xl border border-[#e31837]/40 bg-[#e31837]/10 px-3.5 py-2.5 text-xs font-medium text-[#ff6b81]">
          {actionError}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState message={bookings.length === 0 ? t('empty.bookings') : tCommon('noResults')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0f0f0f]">
          <table className="w-full min-w-[1120px]">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={cn(TH, 'w-12')}>
                  <span className="sr-only">{tCommon('viewDetails')}</span>
                </th>
                <th className={TH}>{t('table.reference')}</th>
                <th className={TH}>{t('table.movie')}</th>
                <th className={TH}>{t('table.customer')}</th>
                <th className={TH}>{t('table.date')}</th>
                <th className={TH}>{t('table.seats')}</th>
                <th className={TH}>{t('table.amount')}</th>
                <th className={TH}>{t('table.payment')}</th>
                <th className={TH}>{t('table.status')}</th>
                <th className={TH}>{t('table.created')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((booking) => {
                const expanded = expandedId === booking.id;
                return (
                  <Fragment key={booking.id}>
                    <tr className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : booking.id)}
                          aria-expanded={expanded}
                          aria-label={tCommon('viewDetails')}
                          className={ICON_BTN}
                        >
                          <ChevronDown
                            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-white/75">
                        {booking.reference}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">{booking.movieTitle}</td>
                      <td className="px-4 py-3">
                        <span className="block text-white/80">{booking.customer.fullName}</span>
                        <span className="block text-xs text-white/45">{booking.customer.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block text-white/70">{formatDay(booking.showDate, locale)}</span>
                        <span className="block text-xs text-white/45">{formatTime(booking.showTime, locale)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          title={booking.seatLabels.join(', ')}
                          className="block max-w-[170px] truncate text-white/60"
                        >
                          {booking.seatLabels.join(', ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {formatMoney(booking.quote.total, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill tone={statusTone(booking.paymentStatus)}>
                          {tStatus(booking.paymentStatus)}
                        </StatusPill>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone={statusTone(booking.status)}>{tStatus(booking.status)}</StatusPill>
                          <select
                            value={booking.status}
                            onChange={(event) => changeStatus(booking, event.target.value as BookingStatus)}
                            disabled={savingId === booking.id}
                            aria-label={t('table.status')}
                            className={cn(STATUS_SELECT, 'disabled:cursor-wait disabled:opacity-60')}
                          >
                            <option value="pending">{tStatus('pending')}</option>
                            <option value="confirmed">{tStatus('confirmed')}</option>
                            <option value="cancelled">{tStatus('cancelled')}</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/45">
                        {new Date(booking.createdAt).toLocaleString(locale)}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-white/[0.02]">
                        <td colSpan={10} className="px-4 py-4">
                          <div className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('email')}
                              </p>
                              <p className="mt-1 text-white/75">{booking.customer.email || tCommon('none')}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tPayment('method')}
                              </p>
                              <p className="mt-1 text-white/75">{booking.paymentMethod || tCommon('none')}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('subtotal')}
                              </p>
                              <p className="mt-1 text-white/75">
                                {formatMoney(booking.quote.subtotal, locale)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('bookingFee')}
                              </p>
                              <p className="mt-1 text-white/75">
                                {formatMoney(booking.quote.bookingFee, locale)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('tax')}
                              </p>
                              <p className="mt-1 text-white/75">
                                {formatMoney(booking.quote.taxAmount, locale)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('total')}
                              </p>
                              <p className="mt-1 font-semibold text-white">
                                {formatMoney(booking.quote.total, locale)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {t('table.cinema')}
                              </p>
                              <p className="mt-1 text-white/75">
                                {booking.cinemaName} · {booking.hallName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">
                                {tSummary('tickets')}
                              </p>
                              <p className="mt-1 text-white/75">{booking.quote.ticketCount}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
