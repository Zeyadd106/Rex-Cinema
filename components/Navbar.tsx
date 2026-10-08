'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search, Ticket, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import LanguageSwitcher from './LanguageSwitcher';

const NAV_ITEMS: { href: string; key: string; end?: boolean }[] = [
  { href: '/', key: 'home', end: true },
  { href: '/movies', key: 'movies' },
  { href: '/coming-soon', key: 'comingSoon' },
  { href: '/dashboard', key: 'dashboard' },
  { href: '/admin', key: 'admin' },
];

export default function Navbar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/movies?q=${encodeURIComponent(q)}` : '/movies');
    setQuery('');
  };

  const isActive = (href: string, end?: boolean) =>
    end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        'no-print sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-md transition-shadow',
        scrolled && 'shadow-[0_10px_30px_rgba(0,0,0,0.45)]',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-[72px]">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={t('brand')}>
          <Image src="/logo.png" alt="" width={38} height={38} className="h-9 w-9 rounded-md object-contain sm:h-10 sm:w-10" priority />
          <span className="hidden text-lg font-bold uppercase tracking-[0.18em] text-white sm:block">
            Rex<span className="text-[#e31837]"> Cinema</span>
          </span>
        </Link>

        <nav aria-label={t('primary')} className="ms-4 hidden items-center gap-1 lg:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3.5 py-2 text-sm font-medium transition',
                    isActive(item.href, item.end)
                      ? 'bg-white/10 text-white'
                      : 'text-white/65 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {t(item.key)}
                </Link>
              ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label={t('search')}
            aria-expanded={searchOpen}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>

          <LanguageSwitcher className="hidden sm:inline-flex" />

          <Link
            href="/book-movie"
            className="hidden items-center gap-1.5 rounded-full bg-[#e31837] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#c41530] sm:inline-flex"
          >
            <Ticket className="h-4 w-4" aria-hidden="true" />
            {tCommon('bookNow')}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('closeMenu') : t('openMenu')}
            aria-expanded={open}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 bg-black/70"
          >
            <form onSubmit={submitSearch} role="search" className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
              <Search className="h-5 w-5 shrink-0 text-white/40" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="w-full bg-transparent text-base text-white outline-none placeholder:text-white/35"
              />
              <button type="submit" className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#e31837]">
                {tCommon('search')}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            aria-label={t('primary')}
            className="overflow-hidden border-t border-white/10 bg-black/95 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-3 text-base font-medium transition',
                    isActive(item.href, item.end)
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {t(item.key)}
                </Link>
              ))}
              <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-4">
                <LanguageSwitcher />
                <Link
                  href="/book-movie"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e31837] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#c41530]"
                >
                  <Ticket className="h-4 w-4" aria-hidden="true" />
                  {tCommon('bookNow')}
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
