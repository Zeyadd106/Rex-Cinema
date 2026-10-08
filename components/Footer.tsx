import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const SOCIALS: { label: string; href: string; path: string }[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com',
    path: 'M13.5 9H16V6h-2.5C11.6 6 10 7.6 10 9.5V11H8v3h2v7h3v-7h2.3l.4-3H13v-1.2c0-.5.2-.8.5-.8z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com',
    path: 'M12 8.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8zm0 5.3a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM17.4 8.6a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM16.9 4H7.1A3.1 3.1 0 0 0 4 7.1v9.8A3.1 3.1 0 0 0 7.1 20h9.8a3.1 3.1 0 0 0 3.1-3.1V7.1A3.1 3.1 0 0 0 16.9 4zm2 12.9a2 2 0 0 1-2 2H7.1a2 2 0 0 1-2-2V7.1a2 2 0 0 1 2-2h9.8a2 2 0 0 1 2 2v9.8z',
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com',
    path: 'M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z',
  },
];

export default function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');

  return (
    <footer className="no-print border-t border-white/10 bg-[#0a0a0a] text-sm text-white/60" role="contentinfo">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md object-contain" />
            <span className="text-base font-bold uppercase tracking-[0.18em] text-white">
              Rex<span className="text-[#e31837]"> Cinema</span>
            </span>
          </Link>
          <p className="mt-4 leading-relaxed">{t('about')}</p>
          <div className="mt-5 flex gap-2">
            {SOCIALS.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                title={label}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/70 ring-1 ring-white/10 transition hover:bg-[#e31837] hover:text-white"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <nav aria-label={t('explore')}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">{t('explore')}</h2>
          <ul className="space-y-2.5">
            <li><Link className="transition hover:text-[#e31837]" href="/movies">{tNav('movies')}</Link></li>
            <li><Link className="transition hover:text-[#e31837]" href="/coming-soon">{tNav('comingSoon')}</Link></li>
            <li><Link className="transition hover:text-[#e31837]" href="/dashboard">{tNav('dashboard')}</Link></li>
            <li><Link className="transition hover:text-[#e31837]" href="/admin">{tNav('admin')}</Link></li>
          </ul>
        </nav>

        <nav aria-label={t('support')}>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">{t('support')}</h2>
          <ul className="space-y-2.5">
            <li><Link className="transition hover:text-[#e31837]" href="/book-movie">{t('bookNow')}</Link></li>
            <li><Link className="transition hover:text-[#e31837]" href="/dashboard">{tNav('dashboard')}</Link></li>
            <li>
              <a className="transition hover:text-[#e31837]" href="mailto:info@rexcinemas.com">
                {t('contactTitle')}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">{t('contactTitle')}</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              <a className="transition hover:text-white" href="mailto:info@rexcinemas.com">info@rexcinemas.com</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              <span dir="ltr">+123 456 7890</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              <span>{t('locations')}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
              <span>{t('hours')}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('rights')}</p>
          <p>info@rexcinemas.com</p>
        </div>
      </div>
    </footer>
  );
}
