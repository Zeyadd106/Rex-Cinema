import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../../services/api';
import { Booking } from '../../types';
import { useLang } from '../../context/LangContext';

export default function AdminBookings() {
  const { t } = useLang();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings', { params: { all: 'true' } })
      .then(({ data }) => setBookings(data.bookings))
      .catch((e) => setError(apiError(e)));
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.allBookings}</h1>
      {error && <p className="text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-2.5 font-semibold">{t.admin.ref}</th><th className="px-4 py-2.5 font-semibold">{t.admin.user}</th><th className="px-4 py-2.5 font-semibold">{t.admin.movie}</th><th className="px-4 py-2.5 font-semibold">{t.admin.cinema}</th><th className="px-4 py-2.5 font-semibold">{t.admin.date}</th><th className="px-4 py-2.5 font-semibold">{t.admin.total}</th><th className="px-4 py-2.5 font-semibold">{t.admin.payment}</th></tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-2.5"><Link to={`/admin/bookings/${b.id}`} className="font-semibold text-vox-pink hover:underline">{b.booking_reference}</Link></td>
                <td className="px-4 py-2.5 text-slate-700">{b.user_name}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.movie_title}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.cinema_name ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.show_date}</td>
                <td className="px-4 py-2.5 text-slate-700">${Number(b.total_price).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

