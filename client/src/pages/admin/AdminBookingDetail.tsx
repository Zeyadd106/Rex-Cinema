import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiError } from '../../services/api';
import { Booking } from '../../types';
import { useLang } from '../../context/LangContext';

export default function AdminBookingDetail() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`).then(({ data }) => setBooking(data.booking)).catch((e) => setError(apiError(e)));
  }, [id]);

  const destroy = async () => {
    if (!confirm(t.admin.deleteBookingConfirm)) return;
    try {
      await api.delete(`/bookings/${id}`);
      navigate('/admin/bookings');
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  if (!booking) return <p className="text-slate-500">{t.common.loading}</p>;

  return (
    <div>
      <h1 className="mb-6 break-words text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.bookingTitle} {booking.booking_reference}</h1>
      {msg && <p className="mb-4 text-sm text-red-600">{msg}</p>}
      <div className="max-w-2xl space-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm sm:p-8">
        <p><span className="text-slate-400">{t.admin.userL}:</span> <b className="text-slate-800">{booking.user_name} ({booking.user_email})</b></p>
        <p><span className="text-slate-400">{t.admin.movieL}:</span> <b className="text-slate-800">{booking.movie_title}</b></p>
        <p><span className="text-slate-400">{t.admin.showL}:</span> <b className="text-slate-800">{booking.show_date} at {booking.show_time?.slice(0, 5)}</b></p>
        <p><span className="text-slate-400">{t.admin.seatsL}:</span> <b className="text-slate-800">{booking.seats?.map((s) => s.seat_number).join(', ')}</b></p>
        <p><span className="text-slate-400">{t.admin.totalL}:</span> <b className="text-slate-800">${Number(booking.total_price).toFixed(2)}</b></p>
        <p><span className="text-slate-400">{t.admin.statusL}:</span> <b className="text-slate-800">{booking.status} / {booking.payment_status}</b></p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/admin/bookings" className="rounded-lg border border-slate-300 px-6 py-2.5 font-semibold text-slate-600 transition hover:border-vox-pink hover:text-vox-pink">{t.common.back}</Link>
        <button onClick={destroy} className="rounded-lg border border-red-200 px-6 py-2.5 font-semibold text-red-500 transition hover:bg-red-50">{t.common.delete}</button>
      </div>
    </div>
  );
}
