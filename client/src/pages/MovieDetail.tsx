import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Movie, Showtime, youtubeEmbed } from '../types';
import { Poster } from '../components/MovieCard';
import MovieCard from '../components/MovieCard';
import { useLang } from '../context/LangContext';
import { fmtDay, fmtLongDate, fmtTime12 } from '../i18n';

function splitStarring(description: string): { synopsis: string; starring: string | null } {
  const idx = description.indexOf('\n\nStarring:');
  if (idx === -1) return { synopsis: description, starring: null };
  return { synopsis: description.slice(0, idx).trim(), starring: description.slice(idx + '\n\nStarring:'.length).trim() };
}

export default function MovieDetail() {
  const { t, lang } = useLang();
  const { id } = useParams();
  const location = useLocation();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [catalog, setCatalog] = useState<Movie[]>([]);
  const [activeDate, setActiveDate] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then(({ data }) => {
        setMovie(data.movie);
        setShowtimes(data.showtimes);
        const dates = [...new Set((data.showtimes as Showtime[]).map((s) => s.date))] as string[];
        if (dates.length) setActiveDate(dates.sort()[0]);
      })
      .catch((e) => setError(apiError(e)));
    api.get('/movies', { params: { status: 'current' } })
      .then(({ data }) => setCatalog(data.movies))
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (location.hash === '#showtimes' && movie) {
      const t = setTimeout(() => document.getElementById('showtimes')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
      return () => clearTimeout(t);
    }
  }, [location.hash, movie]);

  const visible = useMemo(() => showtimes, [showtimes]);
  const dates = useMemo(() => [...new Set(visible.map((s) => s.date))].sort().slice(0, 7), [visible]);
  const shownDate = dates.includes(activeDate) ? activeDate : (dates[0] ?? '');

  const byCinema = useMemo(() => {
    const map = new Map<string, Map<string, Showtime[]>>();
    for (const s of visible.filter((x) => x.date === shownDate)) {
      const c = s.cinema_name ?? 'Cinema';
      const f = `${s.format ?? 'Standard'}${s.hall_name ? ` — ${s.hall_name}` : ''}`;
      if (!map.has(c)) map.set(c, new Map());
      const fm = map.get(c)!;
      const arr = fm.get(f) ?? [];
      arr.push(s);
      fm.set(f, arr);
    }
    return map;
  }, [visible, shownDate]);

  const recommendations = useMemo(() => {
    if (!movie) return [];
    const others = catalog.filter((m) => m.id !== movie.id);
    const sameGenre = others.filter((m) => m.genre === movie.genre);
    const rest = others.filter((m) => m.genre !== movie.genre);
    return [...sameGenre, ...rest].slice(0, 4);
  }, [catalog, movie]);

  if (error) return <p className="p-16 text-center text-red-400">{error}</p>;
  if (!movie) return <p className="p-16 text-center text-[#888]">{t.common.loading}</p>;

  const { synopsis, starring } = splitStarring(movie.description);
  const embed = youtubeEmbed(movie.trailer_url);
  const language = movie.language ?? 'English';
  const pageUrl = window.location.href;
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const tabLabel = (d: string) => (d === todayStr ? t.detail.today : d === tomorrowStr ? t.detail.tomorrow : fmtDay(d, lang));

  const notify = async () => {
    try {
      await api.post(`/movies/${movie.id}/notify`);
      setNotifyMsg(t.detail.notified);
    } catch (e) {
      setNotifyMsg(apiError(e));
    }
  };

  return (
    <div>
      <div className="bg-black text-white">
      <div className="mx-auto max-w-6xl px-[6%] py-10">
      {/* ── Title + classification + share ── */}
      <h1 className="break-words text-2xl font-bold sm:text-4xl">{movie.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className="rounded bg-vox px-2.5 py-0.5 text-sm font-bold">{movie.rating}</span>
        <span className="text-sm text-[#888]">{movie.genre} • {movie.duration} • {language}</span>
        <span className="ms-auto flex items-center gap-2">
          <a
            href={`https://www.facebook.com/dialog/share?app_id=763253787190925&display=page&href=${encodeURIComponent(pageUrl)}`}
            target="_blank" rel="noreferrer" title={`Share "${movie.title}" on Facebook`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-sm font-bold text-white transition hover:opacity-85"
          >f</a>
          <a
            href={`https://x.com/intent/post?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(movie.title)}`}
            target="_blank" rel="noreferrer" title={`Share "${movie.title}" on X`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black transition hover:opacity-85"
          >𝕏</a>
        </span>
      </div>

      {/* ── Poster + trailer ── */}
      <div className="mt-6 grid gap-6 md:grid-cols-[300px_1fr]">
        <Poster movie={movie} className="aspect-[2/3] w-full rounded-lg border border-[#333] object-cover" />
        {embed ? (
          <div className="overflow-hidden rounded-lg border border-[#333] bg-black">
            <iframe src={embed} className="aspect-video h-full min-h-[280px] w-full" allowFullScreen title={`${movie.title} trailer`} />
          </div>
        ) : (
          <div className="flex flex-col justify-center rounded-lg border border-[#333] bg-gradient-to-br from-[#2a0a12] via-[#141414] to-black p-8">
            <p className="text-sm uppercase tracking-widest text-[#888]">{movie.genre}</p>
            <p className="mt-2 line-clamp-4 leading-relaxed text-[#ccc]">{synopsis}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded bg-vox px-3 py-1 text-sm font-bold">{movie.rating}</span>
              <span className="text-sm text-[#aaa]">{movie.duration}{movie.duration !== 'TBA' ? ` ${t.detail.runtimeSuffix}` : ''} • {language}</span>
              {movie.status === 'current' ? (
                <Link to={`/book/${movie.id}`} className="ms-auto rounded-md bg-vox px-8 py-2.5 font-semibold transition hover:bg-vox-dark">{t.detail.bookTickets}</Link>
              ) : (
                <button onClick={notify} className="ms-auto rounded-md bg-vox px-8 py-2.5 font-semibold transition hover:bg-vox-dark">{t.detail.notifyMe}</button>
              )}
            </div>
            {notifyMsg && <p className="mt-3 text-sm text-green-400">{notifyMsg}</p>}
          </div>
        )}
      </div>

      {/* ── View showtimes / notify (hero) ── */}
      {movie.status === 'current' ? (
        <p className="mt-8 text-center">
          <a href="#showtimes" className="inline-block rounded-full bg-vox px-10 py-3 font-bold uppercase tracking-wider transition hover:bg-vox-dark">{t.detail.viewShowtimes}</a>
        </p>
      ) : (
        <div className="mt-8 text-center">
          <p className="mb-3 text-[#aaa]">{t.detail.releasing} {fmtLongDate(movie.release_date, lang)}</p>
          <button onClick={notify} className="inline-block rounded-full bg-vox px-10 py-3 font-bold uppercase tracking-wider transition hover:bg-vox-dark">{t.detail.notifyMe}</button>
          {notifyMsg && <p className="mt-3 text-sm text-green-400">{notifyMsg}</p>}
        </div>
      )}
      </div>
      </div>

      <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-[6%] py-10">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <aside className="h-fit space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm">
          <MetaRow label={t.detail.genre} value={movie.genre} />
          <MetaRow label={t.detail.runningTime} value={movie.duration === 'TBA' ? t.detail.tba : movie.duration} />
          <MetaRow label={t.detail.releaseDate} value={fmtLongDate(movie.release_date, lang)} />
          {starring && <MetaRow label={t.detail.starring} value={starring} />}
          <MetaRow label={t.detail.language} value={language} />
          <MetaRow label={t.detail.subtitles} value={language === 'English' ? 'Arabic' : t.detail.noSubs} />
        </aside>
        <article className="leading-relaxed text-slate-700">
          {synopsis.split('\n\n').map((p, i) => <p key={i} className="mb-4">{p}</p>)}
        </article>
      </div>

      {/* ── Showtimes ── */}
      {movie.status === 'current' && (
        <section id="showtimes" className="scroll-mt-48">
          <hr className="my-8 border-t border-dashed border-slate-300" />
          <h2 className="mb-4 text-2xl font-bold text-vox-blue">{movie.title} - {t.detail.showtimesFor}</h2>
          {dates.length === 0 && <p className="text-slate-500">{t.detail.noTimes}</p>}
          {dates.length > 0 && (
            <nav aria-label="Choose date">
              <ol className="flex gap-2 overflow-x-auto pb-1">
                {dates.map((d) => (
                  <li key={d}>
                    <button
                      onClick={() => setActiveDate(d)}
                      className={`whitespace-nowrap rounded-md border px-5 py-2.5 text-sm font-semibold transition ${d === shownDate ? 'border-vox-pink bg-vox-pink text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-vox-pink hover:text-vox-pink'}`}
                    >
                      {tabLabel(d)}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="mt-6 space-y-8">
            {[...byCinema.entries()].map(([cinema, formats]) => (
              <div key={cinema}>
                <h3 className="mb-3 text-lg font-bold text-vox-pink">{cinema}</h3>
                <ol className="space-y-3">
                  {[...formats.entries()].map(([format, times]) => (
                    <li key={format} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <strong className="mb-2 block text-sm uppercase tracking-wider text-slate-500">{format}</strong>
                      <ol className="flex flex-wrap gap-2">
                        {times.map((s) => (
                          <li key={s.id}>
                            <Link
                              to={`/book/${movie.id}?showtime=${s.id}`}
                              className="inline-block rounded-md border border-slate-300 bg-white px-5 py-2 font-semibold text-slate-800 transition hover:border-vox-pink hover:bg-vox-pink hover:text-white"
                            >
                              {fmtTime12(s.time, lang)}
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Recommendations ── */}
      {recommendations.length > 0 && (
        <section className="mt-12">
          <hr className="my-8 border-t border-dashed border-slate-300" />
          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">{t.detail.recs}</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((m) => <MovieCard key={m.id} movie={m} action={m.status === 'current' ? 'book' : 'none'} />)}
          </div>
        </section>
      )}

      <p className="mt-12 flex flex-wrap justify-center gap-3 pb-4">
        <Link to="/movies" className="rounded-full border-2 border-vox-pink px-8 py-2.5 font-semibold text-vox-pink transition hover:bg-vox-pink hover:text-white">{t.detail.nowShowing}</Link>
        <Link to="/coming-soon" className="rounded-full border-2 border-vox-pink px-8 py-2.5 font-semibold text-vox-pink transition hover:bg-vox-pink hover:text-white">{t.detail.comingSoonBtn}</Link>
      </p>
      </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <p><strong className="text-slate-900">{label}:</strong> <span className="text-slate-600">{value}</span></p>
  );
}
