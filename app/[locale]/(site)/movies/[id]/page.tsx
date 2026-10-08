import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Globe, Languages, Play, Star, Ticket, User } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Poster from '@/components/Poster';
import ShowtimePicker from '@/components/ShowtimePicker';
import { getMovie } from '@/lib/movies';
import { listShowtimes } from '@/lib/showtimes';
import { formatDay } from '@/lib/format';
import { datePlusDays, todayISO } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const movie = getMovie(id);
  if (!movie) return {};
  return { title: movie.title, description: movie.description.slice(0, 160) };
}

export default async function MovieDetailsPage({ params }: Params) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const movie = getMovie(id);
  if (!movie) notFound();

  const t = await getTranslations('moviePage');
  const tCommon = await getTranslations('common');
  const tStatus = await getTranslations('status');

  const comingSoon = movie.status === 'coming-soon';
  const showtimes = comingSoon ? [] : listShowtimes({ movieId: movie.id, from: todayISO(), to: datePlusDays(7) });

  const metaChips = [
    { icon: Star, label: t('rating'), value: movie.rating },
    { icon: Clock, label: t('duration'), value: movie.duration },
    { icon: Languages, label: t('language'), value: movie.language },
    { icon: Calendar, label: t('releaseDate'), value: formatDay(movie.releaseDate, locale) },
    { icon: Globe, label: t('genre'), value: movie.genre.join(', ') },
    ...(movie.director ? [{ icon: User, label: t('director'), value: movie.director }] : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/movies"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t('backToMovies')}
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
        <Poster
          src={movie.poster}
          alt={movie.title}
          priority
          sizes="(max-width: 1024px) 60vw, 300px"
          className="mx-auto aspect-2/3 w-full max-w-[300px] rounded-2xl ring-1 ring-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${comingSoon ? 'bg-amber-400 text-black' : 'bg-[#e31837] text-white'}`}
            >
              {tStatus(comingSoon ? 'comingSoon' : 'nowShowing')}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70 ring-1 ring-white/15">
              {t('rating')}: {movie.rating}
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{movie.title}</h1>

          <div className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {metaChips.map((chip) => (
              <div key={chip.label} className="flex items-center gap-2.5 text-sm">
                <chip.icon className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                <span className="text-white/40">{chip.label}</span>
                <span className="ms-auto font-medium text-white">{chip.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('synopsis')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              {movie.description || t('synopsisEmpty')}
            </p>
          </div>

          {movie.cast.length ? (
            <div className="mt-5">
              <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('cast')}</h2>
              <p className="mt-2 text-sm text-white/60">{movie.cast.join(' · ')}</p>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            {comingSoon ? (
              <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-300 ring-1 ring-amber-400/30">
                {t('notBookable')}
              </p>
            ) : (
              <Link
                href={`/book-movie?movie=${encodeURIComponent(movie.id)}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#e31837] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c41530]"
              >
                <Ticket className="h-4 w-4" aria-hidden="true" />
                {t('bookMovie')}
              </Link>
            )}
            {movie.trailerUrl ? (
              <a
                href={movie.trailerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/10"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                {t('trailer')}
              </a>
            ) : null}
          </div>
        </div>
      </div>

      {!comingSoon ? (
        <section className="mt-14 border-t border-white/10 pt-10">
          <h2 className="text-2xl font-bold text-white">{t('showtimes')}</h2>
          <p className="mt-2 text-sm text-white/50">{t('showtimesHint')}</p>
          <div className="mt-6">
            {showtimes.length ? (
              <ShowtimePicker movieId={movie.id} showtimes={showtimes} />
            ) : (
              <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">
                {t('noShowtimes')}
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
