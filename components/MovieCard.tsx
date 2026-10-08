'use client';
import { ArrowRight, Clock, Star, Ticket } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Movie } from '@/types/movie';
import { formatDay } from '@/lib/format';
import { cn } from '@/lib/utils';
import Poster from './Poster';

interface MovieCardProps {
  movie: Movie;
  /** Show the status badge (now showing / coming soon). */
  showStatus?: boolean;
  className?: string;
}

export default function MovieCard({ movie, showStatus = false, className }: MovieCardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const comingSoon = movie.status === 'coming-soon';
  const detailsHref = `/movies/${movie.id}`;
  const bookHref = `/book-movie?movie=${encodeURIComponent(movie.id)}`;

  return (
    <article className={cn('group flex h-full flex-col', className)}>
      <Link
        href={detailsHref}
        className="relative block aspect-2/3 w-full overflow-hidden rounded-xl bg-[#141414] ring-1 ring-white/10 transition duration-300 group-hover:ring-[#e31837]/60"
      >
        <Poster src={movie.poster} alt={movie.title} className="h-full w-full" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-90 transition group-hover:opacity-100" />

        {showStatus || comingSoon ? (
          <span
            className={cn(
              'absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase',
              comingSoon ? 'bg-amber-400 text-black' : 'bg-[#e31837] text-white',
            )}
          >
            {t(comingSoon ? 'status.comingSoon' : 'status.nowShowing')}
          </span>
        ) : null}

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
          {movie.rating}
        </span>

        <span className="absolute bottom-3 left-3 right-3 flex items-center gap-1 text-xs font-medium text-white/85">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {movie.duration}
          <span className="mx-1 h-1 w-1 rounded-full bg-white/40" aria-hidden="true" />
          {movie.genre.slice(0, 2).join(' · ')}
        </span>
      </Link>

      <div className="mt-3 flex flex-1 flex-col">
        <Link href={detailsHref} className="text-base font-semibold text-white transition group-hover:text-[#e31837]">
          {movie.title}
        </Link>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-xs">
          {comingSoon ? (
            <span className="text-amber-300/90">
              {t('moviePage.releaseIn', { date: formatDay(movie.releaseDate, locale) })}
            </span>
          ) : (
            <Link
              href={bookHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-[#e31837]"
            >
              <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.bookNow')}
            </Link>
          )}
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-white/50 transition hover:text-white"
            aria-label={`${t('common.viewDetails')}: ${movie.title}`}
          >
            {t('common.viewDetails')}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
