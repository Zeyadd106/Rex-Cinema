import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../../services/api';
import { Movie } from '../../types';
import { useLang } from '../../context/LangContext';

export default function AdminMovies() {
  const { t } = useLang();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => api.get('/movies').then(({ data }) => setMovies(data.movies)).catch((e) => setError(apiError(e)));
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    if (!confirm(t.admin.deleteConfirmMovie)) return;
    try {
      await api.delete(`/movies/${id}`);
      setMsg(t.admin.deletedMovie);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.movies}</h1>
        <Link to="/admin/movies/new" className="rounded-lg bg-vox-pink px-5 py-2.5 font-bold text-white shadow-[0_4px_14px_rgba(212,15,125,0.35)] transition hover:bg-vox-pink-dark">{t.admin.addMovie}</Link>
      </div>
      {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-2.5 font-semibold">{t.admin.titleF}</th><th className="px-4 py-2.5 font-semibold">{t.admin.genre}</th><th className="px-4 py-2.5 font-semibold">{t.admin.rating}</th><th className="px-4 py-2.5 font-semibold">{t.admin.status}</th><th className="px-4 py-2.5 font-semibold">{t.admin.release}</th><th className="px-4 py-2.5 font-semibold">{t.common.actions}</th></tr>
          </thead>
          <tbody>
            {movies.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{m.title}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.genre}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.rating}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.status}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.release_date}</td>
                <td className="flex gap-3 px-4 py-2.5">
                  <Link to={`/admin/movies/${m.id}/edit`} className="font-semibold text-vox-pink hover:underline">{t.common.edit}</Link>
                  <button onClick={() => remove(m.id)} className="font-medium text-red-500 hover:underline">{t.common.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

