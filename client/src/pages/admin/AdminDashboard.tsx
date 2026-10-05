import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiError } from '../../services/api';
import { AdminStats } from '../../types';
import { useLang } from '../../context/LangContext';

export default function AdminDashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(({ data }) => setStats(data.stats)).catch((e) => setError(apiError(e)));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-500">{t.common.loading}</p>;

  const cards = [
    { label: t.admin.totalUsers, value: stats.total_users },
    { label: t.admin.totalBookings, value: stats.total_bookings },
    { label: t.admin.totalMovies, value: stats.total_movies },
    { label: t.admin.comingSoonC, value: stats.coming_soon_count },
    { label: t.admin.revenue, value: `$${Number(stats.revenue).toFixed(2)}` },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.dashboard}</h1>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-vox-pink">{c.value}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-3 text-xl font-bold">{t.admin.recentBookings}</h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-2.5 font-semibold">{t.admin.ref}</th><th className="px-4 py-2.5 font-semibold">{t.admin.user}</th><th className="px-4 py-2.5 font-semibold">{t.admin.movie}</th><th className="px-4 py-2.5 font-semibold">{t.admin.total}</th><th className="px-4 py-2.5 font-semibold">{t.admin.status}</th></tr>
          </thead>
          <tbody>
            {stats.recent_bookings.map((b) => (
              <tr key={b.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-2.5"><Link to={`/admin/bookings/${b.id}`} className="font-semibold text-vox-pink hover:underline">{b.booking_reference}</Link></td>
                <td className="px-4 py-2.5 text-slate-700">{b.user_name}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.movie_title}</td>
                <td className="px-4 py-2.5 text-slate-700">${Number(b.total_price).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-slate-700">{b.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

