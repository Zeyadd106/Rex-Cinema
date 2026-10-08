'use client';
import { useMemo, useState } from 'react';
import { Film } from 'lucide-react';
import { useTranslations } from 'next-intl';
import MovieGrid from '@/components/MovieGrid';
import SearchBar from '@/components/SearchBar';
import type { Movie } from '@/types/movie';
import { cn } from '@/lib/utils';

type StatusFilter = 'all' | 'now-showing' | 'coming-soon';

interface MoviesExplorerProps {
  movies: Movie[];
  genres: string[];
  initialQ?: string;
  initialGenre?: string;
  initialStatus?: StatusFilter;
}

const STATUS_TABS: { key: StatusFilter; labelKey: string }[] = [
  { key: 'all', labelKey: 'filterAll' },
  { key: 'now-showing', labelKey: 'filterNowShowing' },
  { key: 'coming-soon', labelKey: 'filterComingSoon' },
];

export default function MoviesExplorer({ movies, genres, initialQ = '', initialGenre = '', initialStatus = 'all' }: MoviesExplorerProps) {
  const t = useTranslations('moviesPage');
  const tCommon = useTranslations('common');
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [genre, setGenre] = useState(initialGenre);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return movies.filter((movie) => {
      if (status !== 'all' && movie.status !== status) return false;
      if (genre && !movie.genre.includes(genre)) return false;
      if (needle) {
        const haystack = `${movie.title} ${movie.description} ${movie.genre.join(' ')}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [movies, q, status, genre]);

  const clear = () => {
    setQ('');
    setStatus('all');
    setGenre('');
  };

  const hasFilters = Boolean(q || genre || status !== 'all');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <SearchBar value={q} onChange={setQ} placeholder={t('searchPlaceholder')} className="w-full lg:max-w-sm" />

        <div role="tablist" aria-label={t('title')} className="flex gap-1.5 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={status === tab.key}
              type="button"
              onClick={() => setStatus(tab.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm',
                status === tab.key ? 'bg-[#e31837] text-white' : 'text-white/60 hover:text-white',
              )}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        <label className="relative w-full lg:w-auto">
          <span className="sr-only">{t('genre')}</span>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-10 w-full appearance-none rounded-full border border-white/15 bg-white/5 px-4 pe-9 text-sm text-white outline-none transition focus:border-[#e31837]/70 lg:w-auto"
          >
            <option value="" className="bg-black">
              {t('allGenres')}
            </option>
            {genres.map((g) => (
              <option key={g} value={g} className="bg-black">
                {g}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute end-3.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-e border-t border-white/50" aria-hidden="true" />
        </label>

        <p className="text-sm text-white/40 lg:ms-auto">{t('count', { count: filtered.length })}</p>
      </div>

      {filtered.length ? (
        <MovieGrid movies={filtered} showStatus />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <Film className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="text-lg font-semibold text-white/70">{t('noResults')}</p>
          <p className="max-w-sm text-sm text-white/40">{t('noResultsHint')}</p>
          {hasFilters ? (
            <button
              type="button"
              onClick={clear}
              className="mt-2 rounded-full bg-[#e31837] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#c41530]"
            >
              {t('clearFilters')}
            </button>
          ) : null}
          {!hasFilters ? (
            <p className="text-sm text-white/40">{tCommon('noResults')}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
