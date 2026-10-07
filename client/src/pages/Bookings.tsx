import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Booking } from '../types';
import { useLang } from '../context/LangContext';
import { fmtDay } from '../i18n';

export function posterSrc(path: string | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}/uploads/posters/${path}`;
}

function StatusPill({ booking, paid, pending, cancelled }: { booking: Booking; paid: string; pending: string; cancelled: string }) {
  const isCancelled = booking.status === 'Cancelled';
  const isPaid = booking.payment_status === 'paid';
  const cls = isCancelled
    ? 'bg-slate-100 text-slate-500 ring-slate-200'
    : isPaid
      ? 'bg-green-100 text-green-700 ring-green-200'
      : 'bg-amber-100 text-amber-800 ring-amber-200';
  const label = isCancelled ? cancelled : isPaid ? paid : pending;
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${cls}`}>{label}</span>;
}

export default function Bookings() {
  const { t, lang } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'topay' | 'paid' | 'cancelled'>('all');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/bookings')
      .then(({ data }) => setBookings(data.bookings))
      .catch((e) => setError(apiError(e)));
  };
  useEffect(load, []);

  const cancel = async (id: number) => {
    if (confirmId !== id) {
      setConfirmId(id);
      setTimeout(() => setConfirmId((c) => (c === id ? null : c)), 4000);
      return;
    }
    setConfirmId(null);
    try {
      await api.delete(`/bookings/${id}/cancel`);
      setMsg(t.bookingsPage.cancelled);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const visible = bookings.filter((b) => {
    if (filter === 'topay') return b.payment_status !== 'paid' && b.status === 'pending';
    if (filter === 'paid') return b.payment_status === 'paid';
    if (filter === 'cancelled') return b.status === 'Cancelled';
    return true;
  });

  const tabs = [
    { id: 'all', label: t.bookingsPage.all, count: bookings.length },
    { id: 'topay', label: t.bookingsPage.toPay, count: bookings.filter((b) => b.payment_status !== 'paid' && b.status === 'pending').length },
    { id: 'paid', label: t.bookingsPage.paidOnly, count: bookings.filter((b) => b.payment_status === 'paid').length },
    { id: 'cancelled', label: t.bookingsPage.cancelledTab, count: bookings.filter((b) => b.status === 'Cancelled').length },
  ] as const;

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-[6%] py-12">
        <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.bookingsPage.title}</h1>
        {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
        {error && <p className="mb-4 text-red-600">{error}</p>}

        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                filter === tab.id
                  ? 'border-vox-pink bg-vox-pink text-white shadow-[0_4px_14px_rgba(212,15,125,0.35)]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-vox-pink hover:text-vox-pink'
              }`}
            >
              {tab.label} <span className={`ms-1 rounded-full px-1.5 text-xs ${filter === tab.id ? 'bg-white/25' : 'bg-slate-100'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {visible.map((b) => {
            const poster = posterSrc(b.poster_path);
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-vox-pink/50 hover:shadow-md">
                {poster ? (
                  <img src={poster} alt={b.movie_title} className="h-24 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-vox-navy to-black text-2xl font-bold text-vox-pink">
                    {(b.movie_title ?? '?').charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/bookings/${b.id}`} className="font-bold text-slate-900 transition hover:text-vox-pink">{b.movie_title}</Link>
                    <StatusPill booking={b} paid={t.bookingsPage.statusPaid} pending={t.bookingsPage.statusPending} cancelled={t.bookingsPage.statusCancelled} />
                    {b.checked_in_at && <span className="text-xs font-semibold text-green-600">{t.bookingsPage.checkedIn}</span>}
                  </div>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {b.cinema_name ? `${b.cinema_name} • ` : ''}{b.show_date ? fmtDay(b.show_date, lang) : ''} • {b.show_time?.slice(0, 5)} • {b.booking_reference} • <b className="text-slate-800">${Number(b.total_price).toFixed(2)}</b>
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {b.payment_status !== 'paid' && b.status === 'pending' && (
                    <Link to={`/pay/${b.id}`} className="rounded-lg bg-vox-pink px-5 py-2 text-sm font-bold text-white transition hover:bg-vox-pink-dark">{t.bookingsPage.pay}</Link>
                  )}
                  <Link to={`/bookings/${b.id}`} className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-vox-pink hover:text-vox-pink">{t.bookingsPage.view}</Link>
                  {b.status === 'pending' && (
                    <button
                      onClick={() => cancel(b.id)}
                      className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${confirmId === b.id ? 'border-red-600 bg-red-600 text-white' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                    >
                      {confirmId === b.id ? t.bookingsPage.tapConfirm : t.bookingsPage.cancelBtn}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && !error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
              <p className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl shadow ring-1 ring-slate-200">🎟</p>
              <p className="font-semibold text-slate-700">{t.bookingsPage.empty}</p>
              <Link to="/" className="mt-4 inline-block rounded-full bg-vox-pink px-8 py-2.5 text-sm font-bold text-white transition hover:bg-vox-pink-dark">{t.bookingsPage.browse}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
