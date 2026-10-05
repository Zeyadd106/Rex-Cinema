import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiError } from '../../services/api';
import { useLang } from '../../context/LangContext';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Adventure', 'Romance', 'Animation', 'Documentary', 'Thriller'];
const RATINGS = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'PG12', '12+', '16+', '18+', '18TC'];

export default function AdminMovieForm() {
  const { t } = useLang();
  const { id } = useParams();
  const isEdit = Boolean(id && id !== 'new');
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', duration: '', genre: 'Action', rating: 'PG', trailer_url: '', status: 'current', release_date: '' });
  const [poster, setPoster] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/movies/${id}`).then(({ data }) => {
        const m = data.movie;
        setForm({ title: m.title, description: m.description, duration: m.duration, genre: m.genre, rating: m.rating, trailer_url: m.trailer_url ?? '', status: m.status, release_date: m.release_date });
      }).catch((e) => setError(apiError(e)));
    }
  }, [id, isEdit]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (poster) fd.append('poster', poster);
      if (isEdit) await api.put(`/movies/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/movies', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/admin/movies');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-vox-pink [color-scheme:light]';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{isEdit ? t.admin.editMovie : t.admin.newMovie}</h1>
      <form onSubmit={submit} className="grid max-w-3xl gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">{error}</p>}
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.titleF}</label><input required value={form.title} onChange={set('title')} className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.descF}</label><textarea required rows={3} value={form.description} onChange={set('description')} className={input} /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.durationF}</label><input required value={form.duration} onChange={set('duration')} className={input} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.trailerF}</label><input value={form.trailer_url} onChange={set('trailer_url')} placeholder="https://..." className={input} /></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.genreF}</label>
            <select value={form.genre} onChange={set('genre')} className={input}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.ratingF}</label>
            <select value={form.rating} onChange={set('rating')} className={input}>{RATINGS.map((r) => <option key={r}>{r}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.statusF}</label>
            <select value={form.status} onChange={set('status')} className={input}>
              <option value="current">{t.admin.current}</option>
              <option value="coming_soon">{t.admin.comingSoonS}</option>
            </select></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.releaseF}</label><input type="date" required value={form.release_date} onChange={set('release_date')} className={input} /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.posterF} {!isEdit && t.admin.posterReq}</label>
          <input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] ?? null)} className="text-sm text-slate-500" /></div>
        <button disabled={busy} className="rounded-lg bg-vox-pink py-3 font-bold text-white transition hover:bg-vox-pink-dark disabled:opacity-50">
          {busy ? t.admin.saving : isEdit ? t.admin.updateMovie : t.admin.createMovie}
        </button>
      </form>
    </div>
  );
}
