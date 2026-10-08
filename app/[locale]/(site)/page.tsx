import { ArrowRight, Clock, Crown, MapPin, Maximize, Ticket, Waves } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import MovieGrid from '@/components/MovieGrid';
import { featuredMovies, listMovies } from '@/lib/movies';
import { listCinemas, listHalls } from '@/lib/showtimes';

export const dynamic = 'force-dynamic';

const FORMAT_CARDS = [
  { key: 'imax', Icon: Maximize },
  { key: 'gold', Icon: Crown },
  { key: '4dx', Icon: Waves },
] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tCommon = await getTranslations('common');
  const tFormats = await getTranslations('formats');

  const nowShowing = listMovies({ status: 'now-showing' });
  const featured = featuredMovies(6);
  const comingSoon = listMovies({ status: 'coming-soon' }).slice(0, 4);
  const cinemas = listCinemas();
  const hallCount = listHalls().length;

  const stats = [
    { label: t('statMovies'), value: nowShowing.length },
    { label: t('statScreens'), value: hallCount },
    { label: t('statLocations'), value: cinemas.length },
    { label: t('statFormats'), value: FORMAT_CARDS.length },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(227,24,55,0.22),transparent_55%)]" aria-hidden="true" />
        <div className="absolute -top-32 start-1/4 h-72 w-72 rounded-full bg-[#e31837]/25 blur-[120px]" aria-hidden="true" />
        <div className="absolute -bottom-24 end-1/5 h-64 w-64 rounded-full bg-amber-500/10 blur-[110px]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-widest text-white/60 uppercase ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e31837]" aria-hidden="true" />
            {t('heroEyebrow')}
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.08] font-bold text-white sm:text-5xl lg:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">{t('heroSubtitle')}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/movies"
              className="inline-flex items-center gap-2 rounded-full bg-[#e31837] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c41530]"
            >
              {t('heroBrowse')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
            <Link
              href="/book-movie"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/10"
            >
              <Ticket className="h-4 w-4" aria-hidden="true" />
              {t('heroBook')}
            </Link>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-black/60 px-5 py-4 backdrop-blur-sm">
                <dt className="text-xs text-white/40">{stat.label}</dt>
                <dd className="mt-1 text-2xl font-bold text-white">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Featured ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('featured')}</h2>
          </div>
          <Link href="/movies" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-white/50 transition hover:text-[#e31837]">
            {tCommon('viewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <MovieGrid movies={featured} />
      </section>

      {/* ── Now showing ──────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('nowShowing')}</h2>
            <p className="mt-2 text-sm text-white/50">{t('nowShowingSubtitle')}</p>
          </div>
          <MovieGrid movies={nowShowing.slice(0, 10)} />
        </div>
      </section>

      {/* ── Formats ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('formats')}</h2>
          <p className="mt-2 text-sm text-white/50">{t('formatsSubtitle')}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FORMAT_CARDS.map(({ key, Icon }) => (
            <div
              key={key}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6 transition hover:border-[#e31837]/50"
            >
              <Icon className="h-8 w-8 text-[#e31837]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-white">{tFormats(`${key}.name`)}</h3>
              <p className="mt-1.5 text-sm text-white/50">{tFormats(`${key}.tagline`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cinema info ──────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('cinemaInfo')}</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">{t('cinemaInfoText')}</p>
            <div className="mt-6 flex items-center gap-4 text-sm text-white/50">
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
                {t('hours')}
              </span>
            </div>
            <Link
              href="/book-movie"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#e31837]"
            >
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {t('findUs')}
            </Link>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {cinemas.map((cinema) => (
              <li key={cinema.id} className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/40 p-4">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">{cinema.name}</p>
                  <p className="mt-0.5 text-xs text-white/45">{cinema.address}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Coming soon ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('comingSoon')}</h2>
            <p className="mt-2 text-sm text-white/50">{t('comingSoonSubtitle')}</p>
          </div>
          <Link href="/coming-soon" className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-white/50 transition hover:text-[#e31837]">
            {tCommon('viewAll')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </div>
        <MovieGrid movies={comingSoon} />
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-[#e31837]/30 bg-gradient-to-r from-[#e31837]/20 via-[#e31837]/8 to-transparent">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between md:py-16">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('ctaTitle')}</h2>
            <p className="mt-2 max-w-lg text-sm text-white/60">{t('ctaText')}</p>
          </div>
          <Link
            href="/book-movie"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#e31837] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#c41530]"
          >
            <Ticket className="h-4 w-4" aria-hidden="true" />
            {t('ctaButton')}
          </Link>
        </div>
      </section>
    </>
  );
}
