import { useEffect, useState } from 'react';
import { api, apiError } from '../../services/api';
import { Cinema, Hall } from '../../types';
import { useLang } from '../../context/LangContext';

const FORMATS = ['Standard', 'IMAX', 'MAX', 'GOLD', '4DX', 'KIDS'];

export default function AdminCinemas() {
  const { t } = useLang();
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', city: '', address: '' });
  const [editing, setEditing] = useState<number | null>(null);
  const [hallForm, setHallForm] = useState({ cinema_id: '', name: '', format: 'Standard', row_labels: 'A,B,C,D,E,F,G', seats_per_row: '10' });
  const [showHallForm, setShowHallForm] = useState<number | null>(null);

  const load = () => {
    api.get('/cinemas').then(({ data }) => setCinemas(data.cinemas)).catch((e) => setError(apiError(e)));
    api.get('/cinemas/halls').then(({ data }) => setHalls(data.halls)).catch(() => undefined);
  };
  useEffect(load, []);

  const submitCinema = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/cinemas/${editing}`, form);
        setMsg(t.admin.cinemaUpdated);
      } else {
        await api.post('/cinemas', form);
        setMsg(t.admin.cinemaCreated);
      }
      setForm({ name: '', city: '', address: '' });
      setEditing(null);
      load();
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  const removeCinema = async (id: number) => {
    if (!confirm(t.admin.deleteCinemaConfirm)) return;
    try {
      await api.delete(`/cinemas/${id}`);
      setMsg(t.admin.cinemaDeleted);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const submitHall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/cinemas/halls', {
        cinema_id: Number(hallForm.cinema_id),
        name: hallForm.name,
        format: hallForm.format,
        row_labels: hallForm.row_labels,
        seats_per_row: Number(hallForm.seats_per_row),
      });
      setMsg(data.message);
      setHallForm({ cinema_id: '', name: '', format: 'Standard', row_labels: 'A,B,C,D,E,F,G', seats_per_row: '10' });
      setShowHallForm(null);
      load();
    } catch (err) {
      setMsg(apiError(err));
    }
  };

  const removeHall = async (id: number) => {
    if (!confirm(t.admin.deleteHallConfirm)) return;
    try {
      await api.delete(`/cinemas/halls/${id}`);
      setMsg(t.admin.hallDeleted);
      load();
    } catch (e) {
      setMsg(apiError(e));
    }
  };

  const input = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-vox-pink';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-vox-blue sm:text-3xl">{t.admin.cinemas}</h1>
      {msg && <p className="mb-4 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}

      <form onSubmit={submitCinema} className="mb-8 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.cinemaName}</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="Mall of Egypt" /></div>
        <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.city}</label>
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} placeholder="Giza" /></div>
        <div className="w-full min-w-0 flex-1 sm:min-w-[220px]"><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.addressF}</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} /></div>
        <button className="rounded-lg bg-vox-pink px-6 py-2 text-sm font-bold text-white transition hover:bg-vox-pink-dark">{editing ? t.admin.updateCinema : t.admin.addCinema}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', city: '', address: '' }); }} className="text-sm font-medium text-slate-500 transition hover:text-vox-pink">{t.admin.cancelBtn}</button>}
      </form>

      <div className="space-y-6">
        {cinemas.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{c.name} <span className="text-sm font-normal text-slate-500">— {c.city}</span></h2>
                <p className="text-xs text-slate-500">{c.address} • {c.hall_count} {t.admin.halls} • {c.upcoming_count} {t.admin.upcomingShows}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => { setEditing(c.id); setForm({ name: c.name, city: c.city, address: c.address }); }} className="font-semibold text-vox-pink hover:underline">{t.common.edit}</button>
                <button onClick={() => removeCinema(c.id)} className="font-medium text-red-500 hover:underline">{t.common.delete}</button>
                <button onClick={() => { setShowHallForm(showHallForm === c.id ? null : c.id); setHallForm((f) => ({ ...f, cinema_id: String(c.id) })); }} className="font-semibold text-green-600 hover:underline">{t.admin.addHall}</button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-start text-sm">
                <thead className="text-xs text-slate-500"><tr><th className="py-1.5 pe-4 font-semibold">{t.admin.hall}</th><th className="py-1.5 pe-4 font-semibold">{t.admin.format}</th><th className="py-1.5 pe-4 font-semibold">{t.admin.seats}</th><th className="py-1.5 font-semibold">{t.common.actions}</th></tr></thead>
                <tbody>
                  {halls.filter((h) => h.cinema_id === c.id).map((h) => (
                    <tr key={h.id} className="border-t border-slate-100">
                      <td className="py-1.5 pe-4 text-slate-700">{h.name}</td>
                      <td className="py-1.5 pe-4"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">{h.format}</span></td>
                      <td className="py-1.5 pe-4 text-slate-700">{h.seat_count}</td>
                      <td className="py-1.5"><button onClick={() => removeHall(h.id)} className="font-medium text-red-500 hover:underline">{t.common.delete}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showHallForm === c.id && (
              <form onSubmit={submitHall} className="mt-3 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.hallName}</label>
                  <input required value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} className={input} placeholder="Standard Hall 2" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.format}</label>
                  <select value={hallForm.format} onChange={(e) => setHallForm({ ...hallForm, format: e.target.value })} className={input}>
                    {FORMATS.map((f) => <option key={f}>{f}</option>)}
                  </select></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.rows}</label>
                  <input required value={hallForm.row_labels} onChange={(e) => setHallForm({ ...hallForm, row_labels: e.target.value })} className={input} /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-500">{t.admin.seatsPerRow}</label>
                  <input type="number" min={1} max={30} required value={hallForm.seats_per_row} onChange={(e) => setHallForm({ ...hallForm, seats_per_row: e.target.value })} className={input} /></div>
                <button className="rounded-lg bg-vox-pink px-5 py-2 text-sm font-bold text-white transition hover:bg-vox-pink-dark">{t.admin.createHall}</button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


