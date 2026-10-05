import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api, apiError } from '../services/api';
import { Ticket } from '../types';
import { useLang } from '../context/LangContext';

export default function Confirmation() {
  const { t } = useLang();
  const { bookingId } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/bookings/${bookingId}/ticket`)
      .then(({ data }) => setTicket(data.ticket))
      .catch((e) => setError(apiError(e)));
  }, [bookingId]);

  if (error) return <p className="bg-white p-16 text-center text-red-600">{error}</p>;
  if (!ticket) return <p className="bg-white p-16 text-center text-slate-400">{t.common.loading}</p>;

  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-xl px-6 py-12 text-center">
        <div className="check-pop mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-green-400 to-green-600 text-4xl text-white shadow-[0_12px_32px_rgba(22,163,74,0.45)]">✓</div>
        <h1 className="text-3xl font-bold text-vox-blue">{t.ticket.success}</h1>
        <p className="mb-8 mt-2 text-slate-500">{t.ticket.confirmedSub}</p>

        {/* ── Ticket ── */}
        <div className="ticket-enter overflow-hidden rounded-2xl bg-white text-left shadow-[0_24px_60px_rgba(10,28,52,0.14)] ring-1 ring-slate-200">
          {/* header */}
          <div className="bg-gradient-to-r from-vox-pink-dark via-vox-pink to-vox-pink-dark px-6 py-4 text-center">
            <p className="text-lg font-black uppercase tracking-[3px] text-white">{t.ticket.eticket}</p>
            <p className="mt-0.5 font-mono text-xs tracking-[4px] text-white/80">{ticket.booking_reference}</p>
          </div>

          <div className="p-6 sm:px-8">
            <TicketRow label={t.ticket.movieL} value={ticket.movie_title} strong />
            {ticket.cinema_name && (
              <TicketRow
                label={t.ticket.cinemaL}
                value={`${ticket.cinema_name}${ticket.hall_name ? ` • ${ticket.hall_name}` : ''}${ticket.format && ticket.format !== 'Standard' ? ` (${ticket.format})` : ''}`}
              />
            )}
            <TicketRow label={t.ticket.dateTime} value={`${ticket.show_date} at ${ticket.show_time?.slice(0, 5)}`} />
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
              <span className="text-slate-400">{t.ticket.seatsL}</span>
              <span className="flex flex-wrap justify-end gap-1.5">
                {ticket.seats.map((s) => (
                  <span key={s} className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{s}</span>
                ))}
              </span>
            </div>
            <TicketRow label={t.ticket.totalPaid} value={`$${Number(ticket.total_price).toFixed(2)}`} strong />
          </div>

          {/* perforation */}
          <div className="relative">
            <div className="border-t-2 border-dashed border-slate-200" />
            <span className="absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full bg-slate-50 ring-1 ring-slate-200" />
            <span className="absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full bg-slate-50 ring-1 ring-slate-200" />
          </div>

          {/* stub */}
          <div className="bg-slate-50/60 px-6 py-6 text-center sm:px-8">
            <div className="mx-auto w-fit rounded-2xl border-4 border-white bg-white p-3 shadow-md">
              <QRCodeSVG value={ticket.qr_data} size={168} />
            </div>
            <p className="mt-3 font-mono text-xs tracking-[4px] text-slate-400">{ticket.booking_reference}</p>
            {ticket.checked_in_at && (
              <p className="mx-auto mt-3 w-fit rounded-full bg-green-100 px-4 py-1 text-sm font-bold text-green-700 ring-1 ring-green-200">
                ✓ {t.ticket.checkedInAt} {new Date(ticket.checked_in_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => window.print()} className="rounded-xl border-2 border-slate-300 bg-white px-8 py-2.5 font-semibold text-slate-700 transition hover:border-vox-pink hover:text-vox-pink">{t.ticket.print}</button>
          <Link to="/bookings" className="rounded-xl bg-gradient-to-b from-vox-pink to-vox-pink-dark px-8 py-2.5 font-semibold text-white shadow-[0_8px_24px_rgba(212,15,125,0.35)] transition hover:-translate-y-px">{t.ticket.myBookings}</Link>
        </div>
      </div>
    </div>
  );
}

function TicketRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-2.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`text-end ${strong ? 'text-base font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{value}</span>
    </div>
  );
}
