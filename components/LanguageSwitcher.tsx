'use client';
import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale = locale === 'en' ? 'ar' : 'en';

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: nextLocale })}
      aria-label={t('language')}
      title={t('language')}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition',
        'text-white/80 ring-1 ring-white/15 hover:bg-white/10 hover:text-white focus-visible:bg-white/10',
        className,
      )}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {nextLocale === 'ar' ? t('switchToAr') : t('switchToEn')}
    </button>
  );
}
