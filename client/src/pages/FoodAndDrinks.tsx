import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

// Item counts per category: Popcorn 3, Snacks 3, Drinks 4, Sweet Treats 3
const CATEGORY_SIZES = [3, 3, 4, 3];

export default function FoodAndDrinks() {
  const { t } = useLang();
  let cursor = 0;
  const sections = t.food.cats.map((category, ci) => {
    const items = t.food.items.slice(cursor, cursor + CATEGORY_SIZES[ci]);
    cursor += CATEGORY_SIZES[ci];
    return { category, items };
  });
  return (
    <div className="bg-white text-slate-900">
    <div className="mx-auto max-w-6xl px-[6%] py-12">
      <p className="text-center text-sm uppercase tracking-widest text-slate-400">{t.food.kicker}</p>
      <h1 className="mb-2 text-center text-3xl font-bold uppercase tracking-widest text-vox-blue">{t.food.title}</h1>
      <p className="mx-auto mb-10 max-w-2xl text-center text-slate-500">
        {t.food.sub}
      </p>
      {sections.map((section) => (
        <div key={section.category} className="mb-10">
          <h2 className="mb-4 text-xl font-bold uppercase tracking-wider text-slate-900">
            <span className="me-2 inline-block h-4 w-1 rounded bg-vox-pink align-middle" />{section.category}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <div key={item.name} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-vox-pink hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <span className="whitespace-nowrap rounded-full bg-vox-pink/10 px-3 py-0.5 text-sm font-bold text-vox-pink">{item.price} EGP</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="text-center">
        <Link to="/" className="inline-block rounded-lg bg-vox-pink px-8 py-2.5 font-bold text-white transition hover:bg-vox-pink-dark">{t.food.browse}</Link>
      </div>
    </div>
    </div>
  );
}
