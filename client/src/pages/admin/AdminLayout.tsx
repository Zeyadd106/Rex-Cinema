import { Link, NavLink, Outlet } from 'react-router-dom';
import { useLang } from '../../context/LangContext';

export default function AdminLayout() {
  const { t } = useLang();
  const link = ({ isActive }: { isActive: boolean }) =>
    `block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-vox-pink text-white shadow-[0_4px_14px_rgba(212,15,125,0.35)]' : 'text-slate-600 hover:bg-slate-50 hover:text-vox-pink'}`;
  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-[6%] py-12 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-24">
          <h2 className="mb-4 px-2 text-lg font-bold text-vox-blue">{t.admin.panel}</h2>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:grid lg:space-y-1 lg:overflow-visible lg:pb-0">
            <NavLink to="/admin" end className={link}>{t.admin.dashboard}</NavLink>
            <NavLink to="/admin/movies" className={link}>{t.admin.movies}</NavLink>
            <NavLink to="/admin/cinemas" className={link}>{t.admin.cinemas}</NavLink>
            <NavLink to="/admin/showtimes" className={link}>{t.admin.showtimes}</NavLink>
            <NavLink to="/admin/bookings" className={link}>{t.admin.bookings}</NavLink>
            <NavLink to="/admin/check-in" className={link}>{t.admin.checkin}</NavLink>
            <NavLink to="/admin/users" className={link}>{t.admin.users}</NavLink>
            <NavLink to="/admin/settings" className={link}>{t.admin.settings}</NavLink>
          </nav>
          <Link to="/" className="mt-4 block px-2 text-sm font-medium text-slate-500 transition hover:text-vox-pink">{t.admin.backToSite}</Link>
        </aside>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
