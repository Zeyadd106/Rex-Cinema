import { ArrowLeft, Info, X } from 'lucide-react';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AdminNav from '@/components/admin/AdminNav';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Link } from '@/i18n/navigation';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin');
  const tNav = await getTranslations('nav');

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={tNav('brand')}>
            <Image
              src="/logo.png"
              alt=""
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-md object-contain"
            />
            <span className="text-lg font-bold uppercase tracking-[0.18em] text-white">
              Rex<span className="text-[#e31837]"> Cinema</span>
            </span>
          </Link>
          <span className="hidden h-7 w-px bg-white/10 sm:block" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{t('title')}</p>
            <p className="truncate text-xs text-white/50">{t('subtitle')}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              {tNav('home')}
            </Link>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <AdminNav />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#009ddb]/30 bg-[#009ddb]/10 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#009ddb]" aria-hidden="true" />
          <p className="flex-1 text-xs leading-relaxed text-white/60">{t('authNote')}</p>
          <X className="mt-0.5 h-4 w-4 shrink-0 text-white/25" aria-hidden="true" />
        </div>

        <main className="py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
