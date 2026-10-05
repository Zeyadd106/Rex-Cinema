import { useEffect, useState } from 'react';
import { api, apiError } from '../../services/api';
import { useLang } from '../../context/LangContext';

export default function AdminSettings() {
  const { t } = useLang();
  const [form, setForm] = useState({ site_name: '', contact_email: '', phone_number: '', address: '', booking_fee: '0', tax_rate: '5' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => setForm((f) => ({ ...f, ...data.settings }))).catch((e) => setError(apiError(e)));
  }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/admin/settings', { ...form, booking_fee: Number(form.booking_fee), tax_rate: Number(form.tax_rate) });
      setMsg(data.message);
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-vox-pink';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.settings}</h1>
      {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
      <form onSubmit={submit} className="grid max-w-2xl gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.siteName}</label><input value={form.site_name} onChange={set('site_name')} className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.contactEmail}</label><input value={form.contact_email} onChange={set('contact_email')} className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.phoneF}</label><input value={form.phone_number} onChange={set('phone_number')} className={input} /></div>
        <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.address}</label><input value={form.address} onChange={set('address')} className={input} /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.bookingFee}</label><input type="number" min={0} step="0.01" value={form.booking_fee} onChange={set('booking_fee')} className={input} /></div>
          <div><label className="mb-1 block text-sm font-medium text-slate-600">{t.admin.taxRate}</label><input type="number" min={0} max={100} step="0.01" value={form.tax_rate} onChange={set('tax_rate')} className={input} /></div>
        </div>
        <button className="rounded-lg bg-vox-pink py-3 font-bold text-white transition hover:bg-vox-pink-dark">{t.admin.saveSettings}</button>
      </form>
    </div>
  );
}
