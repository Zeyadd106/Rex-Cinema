import { Link, useParams } from 'react-router-dom';
import FormatLogo from '../components/FormatLogo';
import { useLang } from '../context/LangContext';

export const FORMATS: Record<string, { name: string; tagline: string; body: string[]; color: string }> = {
  imax: {
    name: 'IMAX',
    tagline: "The world's most immersive cinema experience",
    body: [
      'IMAX auditoriums feature a floor-to-ceiling, wall-to-wall screen and a precision sound system tuned to perfection — every seat is the best seat in the house.',
      'Select blockbusters are shot with IMAX film cameras, expanding the picture up to 40% more than standard screenings.',
    ],
    color: '#2563eb',
  },
  max: {
    name: 'MAX',
    tagline: 'Huge screens. Stunning sound. Maximum impact',
    body: [
      'MAX is our giant-screen premium format: a massive wall-to-wall screen paired with immersive multidimensional sound that puts you inside the story.',
      'Perfect for action blockbusters, sci-fi epics and event cinema that deserves the biggest possible canvas.',
    ],
    color: '#7c3aed',
  },
  gold: {
    name: 'GOLD',
    tagline: 'Luxury cinema, redefined',
    body: [
      'GOLD lounges pair fully-reclinable luxury seats with gourmet food served right to your seat and an exclusive lounge to relax before the film.',
      'Fewer seats, more space, waiter service — the most comfortable way to watch a movie.',
    ],
    color: '#ca8a04',
  },
  '4dx': {
    name: '4DX',
    tagline: 'Feel every moment',
    body: [
      '4DX stimulates all five senses with high-tech motion seats and special effects including wind, fog, lightning, bubbles, water, rain and scents.',
      'Every 4DX title is programmed shot-by-shot so effects sync perfectly with the on-screen action.',
    ],
    color: '#059669',
  },
  kids: {
    name: 'KIDS',
    tagline: 'Cinema made for little movie fans',
    body: [
      'KIDS auditoriums are colourful, family-friendly spaces with adjusted lighting and sound levels so young children feel right at home.',
      'Morning family screenings, kids pricing and a menu of little treats make it the perfect first cinema trip.',
    ],
    color: '#db2777',
  },
  'sensory-friendly': {
    name: 'Sensory Friendly',
    tagline: 'Cinema for everyone',
    body: [
      'Sensory-friendly screenings keep the lights softly on and the sound turned down, with no trailers and freedom to move around.',
      'Designed for guests with sensory sensitivities and their families — everyone deserves the magic of the movies.',
    ],
    color: '#0891b2',
  },
};

export default function WaysToWatch() {
  const { t } = useLang();
  const { slug } = useParams();
  const keys = Object.keys(FORMATS);
  const tr = (k: string) => t.ways.formats[k] ?? { tagline: FORMATS[k].tagline, body: FORMATS[k].body };

  if (!slug) {
    return (
      <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-[6%] py-12">
        <p className="text-center text-sm uppercase tracking-widest text-slate-400">{t.ways.kicker}</p>
        <h1 className="mb-2 text-center text-3xl font-bold uppercase tracking-widest text-vox-blue">{t.ways.title}</h1>
        <p className="mx-auto mb-10 max-w-2xl text-center text-slate-500">{t.ways.sub}</p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((k) => (
            <Link key={k} to={`/ways-to-watch/${k}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-vox-pink hover:shadow-md">
              <div className="flex h-32 items-center justify-center border-b border-slate-100 bg-slate-50" style={{ background: `linear-gradient(135deg, ${FORMATS[k].color}14, #f8fafc)` }}>
                <FormatLogo format={k} className="text-3xl" />
              </div>
              <p className="p-4 text-sm text-slate-500 group-hover:text-slate-900">{tr(k).tagline}</p>
            </Link>
          ))}
        </div>
      </div>
      </div>
    );
  }

  const f = FORMATS[slug.toLowerCase()];
  if (!f) {
    return (
      <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">{t.ways.notFound}</h1>
        <Link to="/ways-to-watch" className="text-vox-pink hover:underline">{t.ways.viewAll}</Link>
      </div>
      </div>
    );
  }

  const ft = tr(slug.toLowerCase());

  return (
    <div className="bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12 text-center">
        <p className="text-center text-sm uppercase tracking-widest text-slate-400">{t.ways.kicker}</p>
        <h1 className="mb-2 mt-3 flex justify-center">
          <FormatLogo format={slug.toLowerCase()} className="text-3xl sm:text-4xl" />
        </h1>
        <p className="mx-auto mb-2 max-w-2xl text-center text-slate-500">{ft.tagline}</p>
        <span
          className="mt-4 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest ring-1"
          style={{ color: f.color, backgroundColor: `${f.color}14`, borderColor: `${f.color}33` }}
        >
          {f.name} Experience
        </span>
      </div>
      <div className="mx-auto max-w-3xl space-y-4 px-6 pb-12 text-slate-600">
        {ft.body.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <Link to="/" className="rounded-lg bg-vox-pink px-8 py-2.5 font-bold text-white transition hover:bg-vox-pink-dark">{t.ways.findShowtimes}</Link>
          <Link to="/ways-to-watch" className="rounded-lg border border-slate-300 px-8 py-2.5 font-semibold text-slate-600 transition hover:border-vox-pink hover:text-vox-pink">{t.ways.allExp}</Link>
        </div>
      </div>
    </div>
  );
}
