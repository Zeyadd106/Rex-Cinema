import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Offers() {
  const { t } = useLang();
  const OFFERS = t.offersPage.items;
  return (
    <div className="bg-white text-slate-900">
    <div className="mx-auto max-w-6xl px-[6%] py-12">
      <p className="text-center text-sm uppercase tracking-widest text-slate-400">{t.offersPage.kicker}</p>
      <h1 className="mb-2 text-center text-3xl font-bold uppercase tracking-widest text-vox-blue">{t.offersPage.title}</h1>
      <p className="mx-auto mb-10 max-w-2xl text-center text-slate-500">{t.offersPage.sub}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <article key={o.title} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-vox-pink hover:shadow-md">
            <div className="bg-gradient-to-br from-vox-pink-dark via-[#a30c60] to-black px-5 py-6">
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">{o.badge}</span>
              <h2 className="mt-3 text-2xl font-bold text-white">{o.title}</h2>
            </div>
            <p className="flex-1 p-5 text-sm leading-relaxed text-slate-600">{o.body}</p>
            <div className="p-5 pt-0">
              <Link to="/movies" className="inline-block rounded-md border-2 border-vox-pink px-5 py-2 text-sm font-semibold text-vox-pink transition hover:bg-vox-pink hover:text-white">{o.cta}</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
    </div>
  );
}
