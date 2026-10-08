'use client';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('errors');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <p className="text-6xl font-bold text-[#e31837]/30">!</p>
      <h1 className="text-2xl font-semibold">{t('errorTitle')}</h1>
      <p className="max-w-md text-sm text-white/50">{t('errorText')}</p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#e31837] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#c41530]"
        >
          {t('tryAgain')}
        </button>
        <Link
          href="/"
          className="rounded-full px-6 py-2.5 text-sm font-bold text-white/70 ring-1 ring-white/20 transition hover:bg-white/10"
        >
          {t('goHome')}
        </Link>
      </div>
    </div>
  );
}
