import { CalendarClock } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import MovieGrid from '@/components/MovieGrid';
import { listMovies } from '@/lib/movies';

export const dynamic = 'force-dynamic';

export default async function ComingSoonPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('comingSoonPage');
  const movies = listMovies({ status: 'coming-soon' });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      {movies.length ? (
        <>
          <MovieGrid movies={movies} showStatus />
          <p className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-white/50">
            {t('notifyNote')}
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-24 text-center">
          <CalendarClock className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="text-lg font-semibold text-white/70">{t('noMovies')}</p>
        </div>
      )}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'comingSoonPage' });
  return { title: t('title'), description: t('subtitle') };
}
