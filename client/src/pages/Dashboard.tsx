import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Booking } from '../types';
import { useLang } from '../context/LangContext';
import { posterSrc } from './Bookings';

function BookingRow({ b, paid, pending }: { b: Booking; paid: string; pending: string }) {
  const poster = posterSrc(b.poster_path);
  return (
    <Link to={`/bookings/${b.id}`} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-vox-pink/50 hover:shadow-md">
      {poster ? (
        <img src={poster} alt={b.movie_title} className="h-16 w-11 shrink-0 rounded-md object-cover" loading="lazy" />
      ) : (
        <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-vox-navy to-black text-xl font-bold text-vox-pink">
          {(b.movie_title ?? '?').charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900">{b.movie_title}</p>
        <p className="text-xs text-slate-500">{b.show_date} at {b.show_time?.slice(0, 5)} • {b.booking_reference} • ${Number(b.total_price).toFixed(2)}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700 ring-green-200' : 'bg-amber-100 text-amber-800 ring-amber-200'}`}>
        {b.payment_status === 'paid' ? paid : pending}
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const { t } = useLang();
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => { setUpcoming(data.upcomingBookings); setHistory(data.bookingHistory); })
      .catch((e) => setError(apiError(e)));
  }, []);

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-[6%] py-12">
        <h1 className="mb-8 text-3xl font-bold text-vox-blue">{t.dash.title}</h1>
        {error && <p className="mb-4 text-red-600">{error}</p>}
        <h2 className="mb-3 text-xl font-bold">{t.dash.upcoming}</h2>
        <div className="mb-10 space-y-3">
          {upcoming.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-100">{t.dash.noUpcoming}</p>}
          {upcoming.map((b) => <BookingRow key={b.id} b={b} paid={t.bookingsPage.statusPaid} pending={t.bookingsPage.statusPending} />)}
        </div>
        <h2 className="mb-3 text-xl font-bold">{t.dash.history}</h2>
        <div className="space-y-3">
          {history.length === 0 && <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 ring-1 ring-slate-100">{t.dash.noHistory}</p>}
          {history.map((b) => <BookingRow key={b.id} b={b} paid={t.bookingsPage.statusPaid} pending={t.bookingsPage.statusPending} />)}
        </div>
      </div>
    </div>
  );
}
