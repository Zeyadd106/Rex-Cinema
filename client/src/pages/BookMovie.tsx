import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Movie, PriceQuote, Seat, Showtime, TICKET_PRICE } from '../types';
import SeatMap from '../components/SeatMap';
import { useLang } from '../context/LangContext';

interface Hold {
  token: string;
  expiresAt: number;
  seatIds: number[];
  quote: PriceQuote;
}

function useCountdown(target: number | null): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return '';
  const ms = Math.max(0, target - now);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function BookMovie() {
  const { t } = useLang();
  const { movieId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [showtimeId, setShowtimeId] = useState<number | null>(Number(params.get('showtime')) || null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [showInfo, setShowInfo] = useState<Showtime | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [hold, setHold] = useState<Hold | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [jumped, setJumped] = useState(false);
  const seatsRef = useRef<HTMLDivElement>(null);
  const countdown = useCountdown(hold?.expiresAt ?? null);
  // Deep-linked from a movie page time button → jump straight to seats
  const preselected = Number(params.get('showtime')) || null;

  useEffect(() => {
    api.get(`/movies/${movieId}`)
      .then(({ data }) => {
        const list = data.showtimes as Showtime[];
        setMovie(data.movie);
        setShowtimes(list);
        // No date/time pickers on this page: use the linked showtime,
        // otherwise auto-pick the earliest available one
        const pre = list.find((s) => s.id === preselected);
        if (pre) {
          setShowtimeId(pre.id);
        } else if (list.length && !showtimeId) {
          const sorted = [...list].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
          setShowtimeId(sorted[0].id);
        }
      })
      .catch((e) => setError(apiError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId]);

  const loadSeats = (id: number, jump = false) => {
    api.get(`/showtimes/${id}/seats`)
      .then(({ data }) => {
        setSeats(data.seats);
        if (jump) {
          setJumped(true);
          setTimeout(() => seatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }
      })
      .catch((e) => setError(apiError(e)));
    api.get(`/showtimes/${id}`).then(({ data }) => setShowInfo(data.showtime)).catch(() => undefined);
  };

  useEffect(() => {
    if (!showtimeId) {
      setSeats([]);
      setSelected([]);
      return;
    }
    setHold(null);
    setSelected([]);
    loadSeats(showtimeId, preselected === showtimeId && !jumped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showtimeId]);

  // Hold expiry watchdog
  useEffect(() => {
    if (hold && Date.now() >= hold.expiresAt) {
      setHold(null);
      setSelected([]);
      setError(t.book.holdExpired);
      if (showtimeId) loadSeats(showtimeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const toggle = (id: number) => {
    if (hold) return; // locked while held
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const createHold = async () => {
    if (!showtimeId || selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/holds', { showtime_id: showtimeId, seat_ids: selected });
      setHold({
        token: data.hold_token,
        expiresAt: new Date(data.expires_at).getTime(),
        seatIds: data.seat_ids,
        quote: data.quote,
      });
      loadSeats(showtimeId);
    } catch (e) {
      setError(apiError(e));
      if (showtimeId) loadSeats(showtimeId);
    } finally {
      setBusy(false);
    }
  };

  const releaseHold = async () => {
    if (hold) {
      try { await api.delete(`/holds/${hold.token}`); } catch { /* ignore */ }
      setHold(null);
      setSelected([]);
      if (showtimeId) loadSeats(showtimeId);
    }
  };

  const proceed = async () => {
    if (!showtimeId || !hold) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/bookings', { showtime_id: showtimeId, seat_ids: hold.seatIds, hold_token: hold.token });
      navigate(`/pay/${data.booking.id}`);
    } catch (e) {
      const msg = apiError(e);
      setError(msg);
      if (/expired|held/i.test(msg)) {
        setHold(null);
        setSelected([]);
        if (showtimeId) loadSeats(showtimeId);
      }
    } finally {
      setBusy(false);
    }
  };

  const heldSeatNames = seats.filter((s) => hold?.seatIds.includes(s.id)).map((s) => s.seat_number).join(', ');
  const selectedNames = seats.filter((s) => selected.includes(s.id)).map((s) => s.seat_number).join(', ');

  return (
    <div className="bg-white text-slate-900">
    <div className="mx-auto max-w-6xl px-[6%] py-12">
      <h1 className="mb-1 text-3xl font-bold text-vox-blue">{t.book.title}{movie ? ` — ${movie.title}` : ''}</h1>
      <p className="mb-8 text-sm text-slate-500">
        ${TICKET_PRICE} {t.book.perSeat}
        {showInfo && ` • ${showInfo.cinema_name} • ${showInfo.hall_name}${showInfo.format !== 'Standard' ? ` (${showInfo.format})` : ''}`}
      </p>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">{error}</p>}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {showtimeId ? (
            <div ref={seatsRef} className="scroll-mt-32">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-vox-blue">{t.book.step2}</h2>
                <button onClick={() => loadSeats(showtimeId)} className="text-xs font-medium text-slate-500 hover:text-vox-pink">{t.book.refresh}</button>
              </div>
              <SeatMap seats={seats} selected={hold ? hold.seatIds : selected} onToggle={toggle} />
              {!hold ? (
                <button
                  disabled={selected.length === 0 || busy}
                  onClick={createHold}
                  className="mt-4 w-full rounded-md bg-vox-pink py-3 font-semibold text-white transition hover:bg-vox-pink-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy ? t.book.booking : `${t.book.holdSeats} (${selected.length})${selectedNames ? ` (${selectedNames})` : ''}`}
                </button>
              ) : (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <b>{heldSeatNames}</b> {t.book.heldFor} <b className="tabular-nums">{countdown}</b>.
                  <button onClick={releaseHold} className="ms-3 font-medium underline hover:text-amber-700">{t.book.release}</button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">{t.book.selectPrompt}</p>
          )}
        </div>
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 font-semibold text-vox-blue">{t.book.summary}</h2>
          <p className="text-sm text-slate-500">{t.book.movieL}</p>
          <p className="mb-3 font-semibold text-slate-900">{movie?.title ?? '—'}</p>
          <p className="text-sm text-slate-500">{t.book.seatsL}</p>
          <p className="mb-3 font-semibold text-slate-900">{hold ? heldSeatNames : selectedNames || '—'}</p>
          {hold ? (
            <div className="mb-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between text-slate-600"><span>{t.book.subtotal}</span><span>${hold.quote.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>{t.book.fee}</span><span>${hold.quote.booking_fee.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>{t.book.tax} ({hold.quote.tax_rate}%)</span><span>${hold.quote.tax_amount.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold text-slate-900"><span>{t.book.totalDue}</span><span>${hold.quote.total.toFixed(2)}</span></div>
            </div>
          ) : (
            <div className="mb-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold text-slate-900">
              <span>{t.book.totalDue}</span>
              <span>{selected.length === 0 ? '—' : `${t.book.from} $${(selected.length * TICKET_PRICE).toFixed(2)}`}</span>
            </div>
          )}
          <button
            disabled={!hold || busy}
            onClick={proceed}
            className="w-full rounded-md bg-vox-pink py-3 font-semibold text-white transition hover:bg-vox-pink-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? t.book.booking : t.book.proceed}
          </button>
          {!hold && <p className="mt-2 text-center text-xs text-slate-400">{t.book.holdFirst}</p>}
        </aside>
      </div>
    </div>
    </div>
  );
}
