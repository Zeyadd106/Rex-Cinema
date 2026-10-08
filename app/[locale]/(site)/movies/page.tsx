import { getTranslations, setRequestLocale } from 'next-intl/server';
import MoviesExplorer from '@/components/MoviesExplorer';
import { listGenres, listMovies } from '@/lib/movies';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ q?: string; genre?: string; status?: string }>;

export default async function MoviesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const status = sp.status === 'now-showing' || sp.status === 'coming-soon' ? sp.status : 'all';

  return (
    <>
      <MoviesExplorer
        movies={listMovies()}
        genres={listGenres()}
        initialQ={sp.q ?? ''}
        initialGenre={sp.genre ?? ''}
        initialStatus={status}
      />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'moviesPage' });
  return { title: t('title'), description: t('subtitle') };
}
