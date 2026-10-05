import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Booking } from '../types';
import { useLang } from '../context/LangContext';

function cardBrand(digits: string): string | null {
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  if (/^3[47]/.test(digits)) return 'AMEX';
  return null;
}

export default function Payment() {
  const { t } = useLang();
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [method, setMethod] = useState<'credit_card' | 'paypal'>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then(({ data }) => setBooking(data.booking))
      .catch((e) => setError(apiError(e)));
  }, [bookingId]);

  const formatCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/payments/process', {
        booking_id: Number(bookingId),
        payment_method: method,
        card_number: cardNumber,
        card_name: cardName,
        expiry_date: expiry,
        cvv,
      });
      navigate(`/confirmation/${bookingId}`);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-vox-pink focus:ring-2 focus:ring-vox-pink/20';
  const label = 'mb-1.5 block text-sm font-semibold text-slate-700';
  const digits = cardNumber.replace(/\D/g, '');
  const brand = cardBrand(digits);
  const total = booking ? Number(booking.total_price).toFixed(2) : '—';

  return (
    <div className="bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-[6%] py-12">
        <h1 className="text-3xl font-bold text-vox-blue">{t.payment.title}</h1>
        <p className="mb-6 mt-1 text-sm text-slate-500">{t.book.summary} • {booking?.movie_title ?? ''}</p>

        {/* stepper */}
        <ol className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <li className="flex items-center gap-2 text-green-600"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-[11px] text-white">✓</span> Seats</li>
          <li className="h-px w-8 bg-slate-300 sm:w-16" />
          <li className="flex items-center gap-2 text-vox-pink"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-vox-pink text-[11px] text-white">2</span> {t.payment.title}</li>
          <li className="h-px w-8 bg-slate-300 sm:w-16" />
          <li className="flex items-center gap-2 text-slate-400"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[11px]">3</span> E-Ticket</li>
        </ol>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── form card ── */}
          <form onSubmit={submit} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(10,28,52,0.08)] sm:p-8">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button" onClick={() => setMethod('credit_card')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition ${method === 'credit_card' ? 'border-vox-pink bg-vox-pink/[0.06] text-vox-pink shadow-[0_6px_18px_rgba(212,15,125,0.15)]' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                {t.payment.card}
              </button>
              <button
                type="button" onClick={() => setMethod('paypal')}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-bold transition ${method === 'paypal' ? 'border-vox-pink bg-vox-pink/[0.06] text-vox-pink shadow-[0_6px_18px_rgba(212,15,125,0.15)]' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-[#003087] text-[11px] font-black italic text-white">P</span>
                {t.payment.paypal}
              </button>
            </div>

            {method === 'credit_card' ? (
              <div className="mt-6 space-y-4">
                {/* live card preview */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vox-navy via-[#14305c] to-black p-5 text-white shadow-lg">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-vox-pink/30 blur-2xl" />
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 shadow-inner" />
                    {brand ? (
                      <span className="rounded bg-white/15 px-2.5 py-1 text-[11px] font-black tracking-widest">{brand}</span>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Card</span>
                    )}
                  </div>
                  <p className="mt-4 font-mono text-lg tracking-[2px] sm:text-xl">
                    {(cardNumber || '•••• •••• •••• ••••').padEnd(19, '•')}
                  </p>
                  <div className="mt-4 flex items-end justify-between text-xs">
                    <div>
                      <p className="uppercase tracking-widest text-white/45">Card holder</p>
                      <p className="mt-0.5 truncate font-semibold uppercase">{cardName || 'YOUR NAME'}</p>
                    </div>
                    <div className="text-end">
                      <p className="uppercase tracking-widest text-white/45">Expires</p>
                      <p className="mt-0.5 font-semibold">{expiry || 'MM/YY'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={label}>{t.payment.cardNum}</label>
                  <input required value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" inputMode="numeric" className={input} />
                </div>
                <div>
                  <label className={label}>{t.payment.cardName}</label>
                  <input required value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="AHMED HASSAN" className={input} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={label}>{t.payment.expiry}</label>
                    <input required value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="12/28" className={input} />
                  </div>
                  <div>
                    <label className={label}>{t.payment.cvv}</label>
                    <input required value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="123" inputMode="numeric" className={input} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-900">
                {t.payment.paypalNote} <b>${total}</b>
              </p>
            )}

            <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-vox-pink to-vox-pink-dark py-4 text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(212,15,125,0.4)] transition hover:-translate-y-px hover:shadow-[0_12px_32px_rgba(212,15,125,0.5)] disabled:opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              {busy ? t.payment.processing : `${t.payment.payBtn} $${total}`}
            </button>

            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: '🔒', label: t.payment.trust[0] },
                { icon: '⚡', label: t.payment.trust[1] },
                { icon: '↩', label: t.payment.trust[2] },
              ].map((b, i) => (
                <div key={i} className="rounded-lg bg-slate-50 px-2 py-2.5 ring-1 ring-slate-100">
                  <p className="text-base">{b.icon}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{b.label}</p>
                </div>
              ))}
            </div>
          </form>

          {/* ── order summary ── */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(10,28,52,0.08)] lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-vox-blue">{t.book.summary}</h2>
            {booking?.poster_url ? (
              <img src={booking.poster_url} alt={booking.movie_title} className="mb-4 aspect-[2/3] w-full rounded-xl object-cover" />
            ) : null}
            <p className="font-bold text-slate-900">{booking?.movie_title ?? '—'}</p>
            <p className="mt-1 text-xs text-slate-500">
              {booking?.cinema_name ? `${booking.cinema_name} • ` : ''}{booking?.show_date} at {booking?.show_time?.slice(0, 5)}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {booking?.seats?.map((s) => (
                <span key={s.id} className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{s.seat_number}</span>
              ))}
            </div>
            <div className="mb-2 mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>{t.payment.subtotal}</span><span>${Number(booking?.subtotal ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>{t.payment.fee}</span><span>${Number(booking?.booking_fee ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>{t.payment.tax}</span><span>${Number(booking?.tax_amount ?? 0).toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900"><span>{t.payment.totalDue}</span><span>${total}</span></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
