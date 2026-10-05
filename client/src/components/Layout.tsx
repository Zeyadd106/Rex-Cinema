import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

function EgyptFlag() {
  return (
    <span className="inline-flex h-4 w-6 flex-col overflow-hidden rounded-[2px] ring-1 ring-black/10" title="Egypt">
      <span className="h-1/3 bg-[#ce1126]" />
      <span className="h-1/3 bg-white" />
      <span className="h-1/3 bg-black" />
    </span>
  );
}

interface DropItem {
  label: string;
  to: string;
}

function NavDrop({ label, to, items, mobile }: { label: string; to: string; items: DropItem[]; mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  if (mobile) {
    return (
      <div className="border-b border-slate-100">
        <div className="flex items-center">
          <Link to={to} className="flex-1 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900">{label}</Link>
          <button onClick={() => setOpen((o) => !o)} className="px-5 py-3 text-slate-500" aria-label="toggle submenu">{open ? '▴' : '▾'}</button>
        </div>
        {open && items.map((it) => (
          <Link key={it.label} to={it.to} className="block bg-slate-50 px-8 py-2.5 text-sm text-slate-700">{it.label}</Link>
        ))}
      </div>
    );
  }
  return (
    <div className="group relative" onMouseLeave={() => setOpen(false)}>
      <div className="flex items-center">
        <NavLink
          to={to}
          className={({ isActive }) => `flex items-center gap-1 border-b-[3px] px-4 pb-[13px] pt-4 text-[13px] font-semibold uppercase tracking-wider transition ${isActive ? 'border-vox-pink text-vox-pink' : 'border-transparent text-vox-ink hover:border-vox-pink/40 hover:text-vox-pink'}`}
        >
          {label} <span className="text-[9px] text-slate-400">▼</span>
        </NavLink>
      </div>
      <div className="invisible absolute start-0 top-full z-50 min-w-[230px] translate-y-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="overflow-hidden rounded-xl border border-slate-100 border-t-[3px] border-t-vox-pink bg-white py-1 shadow-[0_18px_40px_rgba(10,28,52,0.16)]">
          {items.map((it) => (
            <Link key={it.label} to={it.to} className="block border-s-[3px] border-transparent px-5 py-2.5 text-[13px] font-medium uppercase tracking-wide text-slate-600 transition hover:border-vox-pink hover:bg-[#fdf2f8] hover:text-vox-pink">
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, toggle } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  // Login carries its own brand-strip footer like the reference auth page
  const hideFooter = ['/login', '/register', '/forgot-password'].includes(location.pathname) || location.pathname.startsWith('/reset/');
  // The login/signup pages are standalone screens like the reference (own logo + footer)
  const hideHeader = ['/login', '/register'].includes(location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); setMobileOpen(false); setUserOpen(false); }
    };
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileOpen(false);
    navigate(`/movies?q=${encodeURIComponent(query.trim())}`);
    setQuery('');
  };

  const goMovies = () => {
    setMobileOpen(false);
    navigate('/movies');
  };

  const formats = ['IMAX', 'MAX', 'GOLD', '4DX', 'KIDS'];

  return (
    <div className="min-h-screen bg-black text-white">
      {!hideHeader && (
      <header role="banner" className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${scrolled ? 'shadow-[0_6px_24px_rgba(10,28,52,0.14)]' : 'shadow-[0_1px_0_rgba(10,28,52,0.08)]'}`}>
        {/* ── Utility bar ─────────────────────────────── */}
        <div className="bg-gradient-to-r from-vox-navy via-[#12305c] to-vox-navy text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src="/logo.svg" alt="REX Cinemas" className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <span className="truncate text-base font-bold uppercase tracking-[2px] text-vox-pink sm:text-xl">REX Cinemas</span>
            </Link>
            <nav className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium sm:gap-4">
              <button onClick={() => setSearchOpen((o) => !o)} title={t.search} aria-label={t.search} className="rounded-full p-2 transition hover:bg-white/10 hover:text-vox-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-vox-pink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
              </button>
              {user ? (
                <div className="relative" ref={userRef}>
                  <button onClick={() => setUserOpen((o) => !o)} className="flex items-center gap-1.5 rounded-full border border-white/25 bg-white/5 py-1.5 pe-3 ps-1.5 transition hover:border-vox-pink/70 hover:text-vox-pink focus:outline-none focus-visible:ring-2 focus-visible:ring-vox-pink">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-vox-pink text-[11px] font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden max-w-[100px] truncate sm:inline">{user.name.split(' ')[0]}</span>
                    <span className="text-[9px] text-white/60">▼</span>
                  </button>
                  {userOpen && (
                    <div className="absolute end-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg bg-white py-1 text-slate-800 shadow-xl ring-1 ring-black/5">
                      <Link to="/dashboard" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 transition hover:bg-slate-50 hover:text-vox-pink">{t.dashboard}</Link>
                      <Link to="/bookings" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 transition hover:bg-slate-50 hover:text-vox-pink">{t.myBookings}</Link>
                      {user.is_admin && <Link to="/admin" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 transition hover:bg-slate-50 hover:text-vox-pink">{t.adminLink}</Link>}
                      <button
                        onClick={() => { setUserOpen(false); logout(); navigate('/'); }}
                        className="block w-full px-4 py-2.5 text-start transition hover:bg-slate-50 hover:text-vox-pink"
                      >
                        {t.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/login" className="whitespace-nowrap rounded-full px-2 py-1.5 transition hover:bg-white/10 hover:text-vox-pink sm:px-3">{t.login}</Link>
                  <Link to="/register" className="hidden whitespace-nowrap rounded-full bg-gradient-to-b from-vox-pink to-vox-pink-dark px-5 py-1.5 font-semibold text-white shadow-[0_4px_14px_rgba(212,15,125,0.45)] transition hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(212,15,125,0.55)] sm:inline">{t.signUp}</Link>
                </>
              )}
              <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 ring-1 ring-white/10 md:flex" title={t.egypt}>
                <EgyptFlag />
                <span className="text-white/90">{t.egypt}</span>
              </span>
              <button onClick={toggle} className="rounded-full bg-vox-pink/15 px-3 py-1 font-bold text-vox-pink ring-1 ring-vox-pink/40 transition hover:bg-vox-pink hover:text-white" title="Change language">
                {t.arabic}
              </button>
              <button className="p-1.5 lg:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Navigation">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
              </button>
            </nav>
          </div>
          {/* Search overlay */}
          {searchOpen && (
            <div className="border-t border-white/10">
              <form onSubmit={submitSearch} className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:px-6">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="16.5" y1="16.5" x2="21" y2="21" /></svg>
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/40"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-sm font-medium text-white/50 hover:text-white">✕</button>
              </form>
            </div>
          )}
        </div>

        {/* ── Primary nav (desktop) ───────────────────── */}
        <nav className="hidden border-t border-slate-100 bg-white lg:block" aria-label="Primary">
          <div className="mx-auto flex max-w-7xl items-center px-4 sm:px-6">
            <NavLink to="/" end className={({ isActive }) => `border-b-[3px] px-4 pb-[13px] pt-4 text-[13px] font-semibold uppercase tracking-wider transition ${isActive ? 'border-vox-pink text-vox-pink' : 'border-transparent text-vox-ink hover:border-vox-pink/40 hover:text-vox-pink'}`}>
              {t.home}
            </NavLink>
            <NavDrop label={t.movies} to="/movies" items={[
              { label: t.whatsOn, to: '/movies' },
              { label: t.comingSoon, to: '/coming-soon' },
            ]} />
            <NavDrop label={t.foodDrinks} to="/food-and-drinks" items={[{ label: t.preOrder, to: '/food-and-drinks' }]} />
            <NavDrop label={t.waysToWatch} to="/ways-to-watch" items={[
              { label: t.sensory, to: '/ways-to-watch/sensory-friendly' },
              ...formats.map((f) => ({ label: f, to: `/ways-to-watch/${f.toLowerCase()}` })),
            ]} />
            <NavDrop label={t.offers} to="/offers" items={[{ label: t.ladiesOffer, to: '/offers' }]} />
          </div>
        </nav>

        {/* ── Mobile flyout ───────────────────────────── */}
        {mobileOpen && (
          <nav className="max-h-[70vh] overflow-y-auto border-t border-slate-100 bg-white lg:hidden" aria-label="Mobile">
            <Link to="/" onClick={() => setMobileOpen(false)} className="block border-b border-slate-100 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900">{t.home}</Link>
            <NavDrop mobile label={t.movies} to="/movies" items={[
              { label: t.whatsOn, to: '/movies' },
              { label: t.comingSoon, to: '/coming-soon' },
            ]} />
            <NavDrop mobile label={t.foodDrinks} to="/food-and-drinks" items={[{ label: t.preOrder, to: '/food-and-drinks' }]} />
            <NavDrop mobile label={t.waysToWatch} to="/ways-to-watch" items={[
              { label: t.sensory, to: '/ways-to-watch/sensory-friendly' },
              ...formats.map((f) => ({ label: f, to: `/ways-to-watch/${f.toLowerCase()}` })),
            ]} />
            <NavDrop mobile label={t.offers} to="/offers" items={[{ label: t.ladiesOffer, to: '/offers' }]} />
            {!user && (
              <div className="flex gap-3 p-5">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-vox-pink hover:text-vox-pink">{t.login}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 rounded-full bg-gradient-to-b from-vox-pink to-vox-pink-dark px-4 py-2.5 text-center text-sm font-semibold text-white shadow-[0_4px_14px_rgba(212,15,125,0.4)]">{t.signUp}</Link>
              </div>
            )}
            <button onClick={goMovies} className="m-5 mt-0 w-[calc(100%-2.5rem)] rounded-full bg-gradient-to-b from-vox-pink to-vox-pink-dark px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(212,15,125,0.4)]">{t.movies}</button>
          </nav>
        )}

        {/* ── Cinema strip removed ── */}
      </header>
      )}

      <main>{children}</main>

      {!hideFooter && (
      <footer className="bg-[#ededed] text-sm text-slate-600" role="contentinfo">
        <div className="mx-auto grid max-w-7xl gap-10 px-[6%] py-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="REX Cinemas" className="h-8 w-8" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
              <span className="text-lg font-bold uppercase tracking-[2px] text-vox-pink">REX Cinemas</span>
            </Link>
            <h3 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.footer.stay}</h3>
            <div className="flex gap-2">
              {[
                {
                  label: 'Facebook',
                  href: 'https://www.facebook.com',
                  Icon: (p: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
                      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2-.1-2 0-3.4 1.2-3.4 3.5V11H8.5v3H11v7h2.5z" />
                    </svg>
                  ),
                },
                {
                  label: 'Instagram',
                  href: 'https://www.instagram.com',
                  Icon: (p: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={p.className} aria-hidden="true">
                      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                      <circle cx="12" cy="12" r="3.8" />
                      <circle cx="17" cy="7" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  ),
                },
                {
                  label: 'YouTube',
                  href: 'https://www.youtube.com',
                  Icon: (p: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
                      <path d="M21.6 7.2c-.2-1-1-1.8-2-2C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.6.4c-1 .2-1.8 1-2 2C2 8.9 2 12 2 12s0 3.1.4 4.8c.2 1 1 1.8 2 2 1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4c1-.2 1.8-1 2-2 .4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15.2V8.8L15.5 12 10 15.2z" />
                    </svg>
                  ),
                },
                {
                  label: 'TikTok',
                  href: 'https://www.tiktok.com',
                  Icon: (p: { className?: string }) => (
                    <svg viewBox="0 0 24 24" fill="currentColor" className={p.className} aria-hidden="true">
                      <path d="M16.6 3c.4 2.1 1.9 3.6 4.4 3.8v3c-1.7 0-3.2-.5-4.4-1.4v6.3c0 3.4-2.6 6.1-6 6.1-3.3 0-6-2.7-6-6.1s2.7-6 6-6c.3 0 .7 0 1 .1v3.1c-.3-.1-.7-.2-1-.2-1.6 0-2.9 1.3-2.9 2.9s1.3 3 2.9 3c1.7 0 3-1.3 3-3V3h3z" />
                    </svg>
                  ),
                },
              ].map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" title={`Follow us on ${label}`} aria-label={`Follow us on ${label}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-vox-ink text-[#ededed] transition hover:-translate-y-0.5 hover:bg-vox-pink hover:text-white hover:shadow-[0_6px_16px_rgba(212,15,125,0.4)]">
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
          <nav aria-label="About">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.footer.about}</h3>
            <ul className="space-y-2.5">
              <li><Link className="transition hover:text-vox-pink" to="/ways-to-watch">{t.waysToWatch}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/food-and-drinks">{t.foodDrinks}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/offers">{t.offers}</Link></li>
              <li><a className="transition hover:text-vox-pink" href="mailto:info@rexcinemas.com">{t.footer.contact}</a></li>
            </ul>
          </nav>
          <nav aria-label="Help and support">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.footer.help}</h3>
            <ul className="space-y-2.5">
              <li><Link className="transition hover:text-vox-pink" to="/bookings">{t.myBookings}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/dashboard">{t.dashboard}</Link></li>
              <li><a className="transition hover:text-vox-pink" href="mailto:info@rexcinemas.com">{t.footer.refunds}</a></li>
              <li><a className="transition hover:text-vox-pink" href="mailto:info@rexcinemas.com">{t.footer.privacy}</a></li>
            </ul>
          </nav>
          <nav aria-label="Explore">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">{t.footer.explore}</h3>
            <ul className="space-y-2.5">
              <li><Link className="transition hover:text-vox-pink" to="/movies">{t.whatsOn}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/coming-soon">{t.comingSoon}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/food-and-drinks">{t.footer.foodMenus}</Link></li>
              <li><Link className="transition hover:text-vox-pink" to="/offers">{t.preOrder}</Link></li>
            </ul>
          </nav>
        </div>
        <div className="bg-vox-navy">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-[6%] py-4 text-xs text-white/70">
            <p>{t.footer.rights}</p>
            <p>info@rexcinemas.com</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
