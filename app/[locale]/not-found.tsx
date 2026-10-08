'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <p className="text-7xl font-bold text-[#e31837]/30">404</p>
      <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="max-w-md text-sm text-white/50">{t('notFoundText')}</p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-[#e31837] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#c41530]"
      >
        {t('goHome')}
      </Link>
    </div>
  );
}
