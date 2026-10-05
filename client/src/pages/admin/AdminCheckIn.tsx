import { useState } from 'react';
import { api, apiError } from '../../services/api';
import { useLang } from '../../context/LangContext';

interface CheckInResult {
  message: string;
  booking: {
    booking_reference: string;
    movie_title: string;
    show_date: string;
    show_time: string;
    user_name: string;
    seats: string[];
    checked_in_at?: string;
  };
}

export default function AdminCheckIn() {
  const { t } = useLang();
  const [ref, setRef] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setResult(null);
    let body: Record<string, string> = { booking_reference: ref.trim(), check_in_token: token.trim() };
    // Allow pasting the raw scanned QR JSON
    const raw = ref.trim();
    if (raw.startsWith('{')) {
      body = { qr_data: raw };
    }
    try {
      const { data } = await api.post('/admin/check-in', body);
      setResult(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-slate-900 outline-none placeholder:text-slate-400 focus:border-vox-pink';

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.checkinTitle}</h1>
      <p className="mb-6 text-sm text-slate-500">{t.admin.checkinSub}</p>
      <form onSubmit={submit} className="grid max-w-xl gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}
        {result && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <p className="font-semibold">{result.message}</p>
            <div className="mt-2 space-y-1 text-green-700/90">
              <p><b>{result.booking.movie_title}</b> — {result.booking.show_date} at {result.booking.show_time?.slice(0, 5)}</p>
              <p>Guest: {result.booking.user_name} • Seats: {result.booking.seats.join(', ')}</p>
              <p>Ref: <span className="font-mono">{result.booking.booking_reference}</span></p>
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.checkinRef}</label>
           <input required value={ref} onChange={(e) => setRef(e.target.value)} placeholder="REXXXXXXXXX" className={input} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.checkinCode}</label>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="••••••••" className={input} />
        </div>
        <button disabled={busy} className="rounded-lg bg-vox-pink py-3 font-bold text-white transition hover:bg-vox-pink-dark disabled:opacity-50">
          {busy ? t.admin.checkingIn : t.admin.checkinBtn}
        </button>
      </form>
    </div>
  );
}
