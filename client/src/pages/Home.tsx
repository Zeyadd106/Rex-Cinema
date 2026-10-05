import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../services/api';
import { Movie } from '../types';
import MovieCard, { Poster } from '../components/MovieCard';
import { FORMATS } from './WaysToWatch';
import { useLang } from '../context/LangContext';

function HeroCarousel({ movies }: { movies: Movie[] }) {
  const slides = movies.filter((m) => m.poster_url).slice(0, 8);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    timer.current = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [paused, slides.length]);

  if (slides.length === 0) return null;
  const go = (dir: 1 | -1) => setIndex((index + dir + slides.length) % slides.length);

  return (
    <section
      className="relative h-[62vh] max-h-[640px] min-h-[420px] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Now showing"
    >
      {slides.map((m, i) => (
        <Link
          key={m.id}
          to={`/movies/${m.id}`}
          aria-label={m.title}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        >
          {m.poster_url && (
            <img
              src={m.poster_url} alt={m.title}
              className={`h-full w-full object-cover object-top ${i === index ? 'hero-zoom' : ''}`}
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </Link>
      ))}

      <button
        onClick={() => go(-1)}
        aria-label="Previous"
        className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white transition hover:scale-105 hover:bg-vox-pink sm:left-8"
      >‹</button>
      <button
        onClick={() => go(1)}
        aria-label="Next"
        className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white transition hover:scale-105 hover:bg-vox-pink sm:right-8"
      >›</button>
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to ${s.title}`}
            className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-9 bg-vox-pink' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useLang();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [comingSoon, setComingSoon] = useState<Movie[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/movies', { params: { status: 'current' } })
      .then(({ data }) => setMovies(data.movies))
      .catch((e) => setError(apiError(e)));
    api.get('/movies', { params: { status: 'coming_soon' } })
      .then(({ data }) => setComingSoon((data.movies as Movie[]).slice(0, 4)))
      .catch(() => undefined);
  }, []);

  const filtered = movies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
  const formatKeys = ['imax', 'max', 'gold', '4dx', 'kids'];

  return (
    <div>
      <HeroCarousel movies={movies} />

      <section className="bg-white px-[6%] py-12 text-slate-900">
        <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between">
          <h2 className="text-3xl font-bold tracking-wide text-vox-blue">{t.whatsOn}</h2>
          <Link to="/movies" className="rounded-full border-2 border-vox-pink px-6 py-1.5 text-sm font-semibold text-vox-pink transition hover:bg-vox-pink hover:text-white">{t.homePage.viewAll}</Link>
        </div>
        <div className="mx-auto mb-10 max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.homePage.searchPh}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-[#888] outline-none focus:border-vox-pink"
          />
        </div>
        {error && <p className="mb-6 text-center text-red-600">{error}</p>}
        {filtered.length === 0 && !error && <p className="text-center text-slate-500">{t.homePage.noMovies}</p>}
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => <MovieCard key={m.id} movie={m} action="book" />)}
        </div>
      </section>

      <section className="bg-[#0d0d0d] px-[6%] py-12">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-wide text-vox-blue">{t.homePage.experiences}</h2>
        <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {formatKeys.map((k) => (
            <Link
              key={k}
              to={`/ways-to-watch/${k}`}
              className="group flex h-44 flex-col justify-end overflow-hidden rounded-lg border border-[#333] p-4 transition hover:-translate-y-1 hover:border-vox"
              style={{ background: `linear-gradient(160deg, ${FORMATS[k].color}66, #0a0a0a 70%)` }}
            >
              <span className="text-2xl font-bold uppercase tracking-widest" style={{ color: FORMATS[k].color }}>{FORMATS[k].name}</span>
              <span className="mt-1 line-clamp-2 text-xs text-[#bbb] group-hover:text-white">{t.ways.formats[k]?.tagline ?? FORMATS[k].tagline}</span>
            </Link>
          ))}
        </div>
      </section>

      {comingSoon.length > 0 && (
        <section className="bg-white px-[6%] py-12 text-slate-900">
          <div className="mx-auto mb-8 flex max-w-7xl items-end justify-between">
            <h2 className="text-3xl font-bold tracking-wide text-vox-blue">{t.comingSoon}</h2>
            <Link to="/coming-soon" className="rounded-full border-2 border-vox-pink px-6 py-1.5 text-sm font-semibold text-vox-pink transition hover:bg-vox-pink hover:text-white">{t.homePage.viewAll}</Link>
          </div>
          <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {comingSoon.map((m) => (
              <Link key={m.id} to={`/movies/${m.id}`} className="group relative overflow-hidden rounded-lg border border-[#333] transition hover:-translate-y-1 hover:border-vox">
                <Poster movie={m} className="aspect-[2/3] w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 pt-10">
                  <p className="font-semibold group-hover:text-vox-light">{m.title}</p>
                  <p className="text-xs text-[#aaa]">{new Date(m.release_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

