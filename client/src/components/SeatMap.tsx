import { Seat } from '../types';
import { useLang } from '../context/LangContext';

export default function SeatMap({
  seats,
  selected,
  onToggle,
}: {
  seats: Seat[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const { t } = useLang();
  const rows = [...new Set(seats.map((s) => s.row))].sort();
  const byId = new Map(seats.map((s) => [s.id, s]));
  const selectedNames = selected
    .map((id) => byId.get(id)?.seat_number)
    .filter(Boolean)
    .join('  •  ');
  const bookedCount = seats.filter((s) => !s.is_available && !selected.includes(s.id)).length;
  const availCount = seats.filter((s) => s.is_available).length;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0a0e1a] p-3 shadow-[0_24px_60px_rgba(3,7,18,0.55)] ring-1 ring-white/10 sm:p-8">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[130%] -translate-x-1/2 rounded-[100%] bg-vox-pink/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-vox-blue/[0.07] to-transparent" />

      {/* screen */}
      <div className="relative mb-1">
        <div className="screen-beam mx-auto h-[7px] w-3/4 rounded-[100%] bg-gradient-to-r from-transparent via-cyan-100 to-transparent shadow-[0_0_28px_rgba(165,243,252,0.9)]" />
        <div className="screen-beam mx-auto h-20 w-2/3 bg-gradient-to-b from-cyan-100/25 via-vox-pink/10 to-transparent blur-lg" style={{ animationDelay: '0.6s' }} />
        <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-[6px] text-white/60">{t.seat.screen}</p>
      </div>

      {/* selected pill */}
      <div className="flex min-h-8 items-center justify-center px-2">
        {selected.length > 0 && (
          <p className="max-w-full truncate rounded-full bg-amber-400/15 px-4 py-1 text-xs font-bold tracking-wide text-amber-300 ring-1 ring-amber-400/40">
            {selectedNames}
          </p>
        )}
      </div>

      {/* seat rows */}
      <div className="relative mt-2 space-y-2.5 overflow-x-auto pb-1">
        {rows.map((row, ri) => (
          <div key={row} className="seat-row-enter mx-auto flex w-fit min-w-max items-center justify-center gap-1 px-4 sm:gap-2" style={{ animationDelay: `${ri * 70}ms` }}>
            <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-white/35">{row}</span>
            {seats.filter((s) => s.row === row).map((s) => {
              const isSel = selected.includes(s.id);
              const locked = !s.is_available && !isSel;
              return (
                <button
                  key={s.id}
                  disabled={locked}
                  onClick={() => onToggle(s.id)}
                  title={s.seat_number + (s.is_held && !isSel ? ' (held)' : '')}
                  aria-pressed={isSel}
                  className={`relative h-7 w-7 text-[10px] font-bold transition-all duration-150 sm:h-9 sm:w-9 sm:text-[11px] ${
                    locked
                      ? 'cursor-not-allowed rounded-md bg-white/[0.06] text-white/20 ring-1 ring-white/10'
                      : isSel
                        ? 'seat-selected-pop rounded-t-xl rounded-b-md bg-gradient-to-b from-amber-200 via-amber-400 to-amber-500 text-black shadow-[0_0_18px_rgba(251,191,36,0.65)] ring-1 ring-amber-200'
                        : 'rounded-t-xl rounded-b-md bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 text-slate-200 shadow-[0_3px_0_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] ring-1 ring-white/15 hover:-translate-y-1 hover:from-vox-pink hover:via-[#b30f68] hover:to-[#7d0a48] hover:text-white hover:shadow-[0_8px_22px_rgba(212,15,125,0.55)] hover:ring-vox-pink active:translate-y-0 active:scale-95'
                  }`}
                >
                  {/* seat highlight */}
                  {!locked && <span className="pointer-events-none absolute inset-x-1.5 top-1 h-1 rounded-full bg-white/30" />}
                  <span className="relative">{s.number}</span>
                </button>
              );
            })}
            <span className="w-6 shrink-0 text-center font-mono text-xs font-bold text-white/35">{row}</span>
          </div>
        ))}
      </div>

      {/* legend with live counts */}
      <div className="relative mt-7 flex flex-wrap justify-center gap-x-7 gap-y-2 text-xs text-white/65">
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-t-md rounded-b-sm bg-gradient-to-b from-slate-600 to-slate-900 ring-1 ring-white/20" />
          {t.seat.available} <b className="text-white">{availCount}</b>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-t-md rounded-b-sm bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
          {t.seat.selected} <b className="text-white">{selected.length}</b>
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-md bg-white/[0.06] ring-1 ring-white/10" />
          {t.seat.booked} <b className="text-white">{bookedCount}</b>
        </span>
      </div>
    </div>
  );
}
