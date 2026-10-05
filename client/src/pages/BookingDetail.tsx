import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Booking } from '../types';
import { useLang } from '../context/LangContext';

export default function BookingDetail() {
  const { t } = useLang();
  const { id } = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data.booking))
      .catch((e) => setError(apiError(e)));
  }, [id]);

  if (error) return <p className="p-16 text-center text-red-400">{error}</p>;
  if (!booking) return <p className="p-16 text-center text-[#888]">{t.common.loading}</p>;

  return (
    <div className="bg-white text-slate-900">
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 break-words text-2xl font-bold text-vox-blue sm:text-3xl">{t.bookingDetail.title} {booking.booking_reference}</h1>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        <Row label={t.bookingDetail.movieL} value={booking.movie_title ?? '—'} />
        {booking.cinema_name && <Row label={t.bookingDetail.cinemaL} value={`${booking.cinema_name}${booking.hall_name ? ` • ${booking.hall_name}` : ''}${booking.format && booking.format !== 'Standard' ? ` (${booking.format})` : ''}`} />}
        <Row label={t.bookingDetail.dateTime} value={`${booking.show_date} at ${booking.show_time?.slice(0, 5)}`} />
        <Row label={t.bookingDetail.seatsL} value={booking.seats?.map((s) => s.seat_number).join(', ') ?? '—'} />
        <Row label={t.bookingDetail.subtotal} value={`$${Number(booking.subtotal ?? 0).toFixed(2)}`} />
        <Row label={t.bookingDetail.fee} value={`$${Number(booking.booking_fee ?? 0).toFixed(2)}`} />
        <Row label={t.bookingDetail.tax} value={`$${Number(booking.tax_amount ?? 0).toFixed(2)}`} />
        <Row label={t.bookingDetail.totalL} value={`$${Number(booking.total_price).toFixed(2)}`} />
        <Row label={t.bookingDetail.status} value={`${booking.status} / ${booking.payment_status}`} />
        {booking.checked_in_at && <Row label={t.bookingDetail.checkedIn} value={new Date(booking.checked_in_at).toLocaleString()} />}
        {booking.payment && <Row label={t.bookingDetail.transaction} value={`${booking.payment.transaction_id} (${booking.payment.payment_method})`} />}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {booking.payment_status === 'paid' ? (
          <Link to={`/confirmation/${booking.id}`} className="rounded-lg bg-vox-pink px-6 py-2.5 font-semibold text-white transition hover:bg-vox-pink-dark">{t.bookingDetail.viewTicket}</Link>
        ) : (
          <Link to={`/pay/${booking.id}`} className="rounded-lg bg-vox-pink px-6 py-2.5 font-semibold text-white transition hover:bg-vox-pink-dark">{t.bookingDetail.payNow}</Link>
        )}
        <Link to="/bookings" className="rounded-lg border border-slate-300 px-6 py-2.5 text-slate-600 transition hover:border-vox-pink hover:text-vox-pink">{t.bookingDetail.back}</Link>
      </div>
    </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-end font-semibold text-slate-800">{value}</span>
    </div>
  );
}
