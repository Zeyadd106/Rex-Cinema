import { useEffect, useState } from 'react';
import { api, apiError } from '../../services/api';
import { Hall, Movie, Showtime } from '../../types';
import { useLang } from '../../context/LangContext';

export default function AdminShowtimes() {
  const { t } = useLang();
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [form, setForm] = useState({ movie_id: '', hall_id: '', date: '', time: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    api.get('/showtimes').then(({ data }) => setShowtimes(data.showtimes)).catch((e) => setError(apiError(e)));
    api.get('/movies').then(({ data }) => setMovies(data.movies)).catch(() => undefined);
    api.get('/cinemas/halls').then(({ data }) => setHalls(data.halls)).catch(() => undefined);
  };
  useEffect(load, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/showtimes', { movie_id: Number(form.movie_id), hall_id: Number(form.hall_id), date: form.date, time: form.time });
      setMsg(t.admin.showCreated);
      setForm({ movie_id: '', hall_id: '', date: '', time: '' });
      load();
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t.admin.deleteShowConfirm)) return;
    try {
      await api.delete(`/showtimes/${id}`);
      setMsg(t.admin.showDeleted);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const input = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-vox-pink [color-scheme:light]';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.showtimes}</h1>
      {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={create} className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.movie}</label>
          <select required value={form.movie_id} onChange={(e) => setForm({ ...form, movie_id: e.target.value })} className={input}>
            <option value="">{t.admin.movieForm.selectMovie}</option>
            {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select></div>
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.hall}</label>
          <select required value={form.hall_id} onChange={(e) => setForm({ ...form, hall_id: e.target.value })} className={input}>
            <option value="">{t.admin.movieForm.selectHall}</option>
            {halls.map((h) => <option key={h.id} value={h.id}>{h.cinema_name} — {h.name} ({h.format})</option>)}
          </select></div>
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.date}</label>
          <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={input} /></div>
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.time}</label>
          <input type="time" required value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className={input} /></div>
        <button className="rounded-lg bg-vox-pink px-6 py-2 font-bold text-white transition hover:bg-vox-pink-dark">{t.admin.add}</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-2.5 font-semibold">{t.admin.movie}</th><th className="px-4 py-2.5 font-semibold">{t.admin.cinema}</th><th className="px-4 py-2.5 font-semibold">{t.admin.hall}</th><th className="px-4 py-2.5 font-semibold">{t.admin.date}</th><th className="px-4 py-2.5 font-semibold">{t.admin.time}</th><th className="px-4 py-2.5 font-semibold">{t.common.actions}</th></tr>
          </thead>
          <tbody>
            {showtimes.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{s.movie_title}</td>
                <td className="px-4 py-2.5 text-slate-700">{s.cinema_name ?? '—'}</td>
                <td className="px-4 py-2.5 text-slate-700">{s.hall_name ?? '—'} <span className="text-xs text-slate-400">({s.format})</span></td>
                <td className="px-4 py-2.5 text-slate-700">{s.date}</td>
                <td className="px-4 py-2.5 text-slate-700">{s.time.slice(0, 5)}</td>
                <td className="px-4 py-2.5"><button onClick={() => remove(s.id)} className="font-medium text-red-500 hover:underline">{t.common.delete}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

