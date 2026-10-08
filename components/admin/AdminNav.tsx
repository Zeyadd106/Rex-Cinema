'use client';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const ITEMS: { href: string; key: string; end?: boolean }[] = [
  { href: '/admin', key: 'overview', end: true },
  { href: '/admin/movies', key: 'movies' },
  { href: '/admin/showtimes', key: 'showtimes' },
  { href: '/admin/bookings', key: 'bookings' },
  { href: '/admin/seats', key: 'seats' },
];

export default function AdminNav() {
  const t = useTranslations('admin.nav');
  const tNav = useTranslations('nav');
  const pathname = usePathname();

  const isActive = (href: string, end?: boolean) =>
    end ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label={tNav('primary')} className="flex gap-1.5 overflow-x-auto py-2.5">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={isActive(item.href, item.end) ? 'page' : undefined}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]',
            isActive(item.href, item.end)
              ? 'bg-[#e31837] text-white shadow-[0_6px_18px_rgba(227,24,55,0.35)]'
              : 'text-white/60 hover:bg-white/5 hover:text-white',
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
