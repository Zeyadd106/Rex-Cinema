import { useEffect, useState } from 'react';
import { api, apiError } from '../../services/api';
import { User } from '../../types';
import { useLang } from '../../context/LangContext';

interface AdminUser extends User {
  bookings_count: number;
  created_at: string;
}

export default function AdminUsers() {
  const { t, lang } = useLang();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const load = () => api.get('/admin/users').then(({ data }) => setUsers(data.users)).catch((e) => setError(apiError(e)));
  useEffect(() => { load(); }, []);

  const toggle = async (id: number) => {
    try {
      const { data } = await api.patch(`/admin/users/${id}/toggle-admin`);
      setMsg(data.message);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const remove = async (id: number) => {
    if (!confirm(t.admin.deleteUserConfirm)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setMsg(t.admin.userDeleted);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const yesNo = (v: boolean) => v ? (lang === 'ar' ? 'نعم' : 'Yes') : (lang === 'ar' ? 'لا' : 'No');

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.users}</h1>
      {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-start text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr><th className="px-4 py-2.5 font-semibold">{t.admin.name}</th><th className="px-4 py-2.5 font-semibold">{t.admin.email}</th><th className="px-4 py-2.5 font-semibold">{t.admin.adminCol}</th><th className="px-4 py-2.5 font-semibold">{t.admin.bookingsCol}</th><th className="px-4 py-2.5 font-semibold">{t.common.actions}</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 transition hover:bg-slate-50">
                <td className="px-4 py-2.5 font-semibold text-slate-900">{u.name}</td>
                <td className="px-4 py-2.5 text-slate-700">{u.email}</td>
                <td className="px-4 py-2.5 text-slate-700">{yesNo(Boolean(u.is_admin))}</td>
                <td className="px-4 py-2.5 text-slate-700">{u.bookings_count}</td>
                <td className="flex gap-3 px-4 py-2.5">
                  <button onClick={() => toggle(u.id)} className="font-semibold text-vox-pink hover:underline">{u.is_admin ? t.admin.revokeAdmin : t.admin.makeAdmin}</button>
                  <button onClick={() => remove(u.id)} className="font-medium text-red-500 hover:underline">{t.common.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

