'use client';
import { RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SeatMapPayload } from '@/types/seat';
import { cn } from '@/lib/utils';

interface SeatMapProps {
  map: SeatMapPayload;
  selected: string[];
  onToggle: (seatId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

const LEGEND = [
  { key: 'legendAvailable', className: 'bg-white/15 ring-white/25' },
  { key: 'legendSelected', className: 'bg-[#e31837] ring-[#e31837]' },
  { key: 'legendOccupied', className: 'bg-[#2a2a2a] ring-white/10' },
  { key: 'legendDisabled', className: 'bg-[repeating-linear-gradient(135deg,#1a1a1a_0_5px,#2e2e2e_5px_10px)] ring-white/10' },
] as const;

export default function SeatMap({ map, selected, onToggle, onRefresh, className }: SeatMapProps) {
  const t = useTranslations('book');
  const selectedSet = new Set(selected);
  const rowSeats = map.rows.map((row) => map.seats.filter((s) => s.row === row));

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-6 flex justify-center">
        <div className="w-4/5 max-w-lg text-center">
          <div className="screen-beam h-2 rounded-[100%] bg-gradient-to-r from-transparent via-white to-transparent opacity-80 blur-[2px]" />
          <div className="mx-auto mt-1 h-6 rounded-b-[100%] bg-gradient-to-b from-white/25 to-transparent" />
          <p className="mt-1 text-[11px] font-semibold tracking-[0.3em] text-white/45 uppercase">{t('screen')}</p>
        </div>
      </div>

      <div className="mx-auto flex w-fit flex-col gap-1.5 overflow-x-auto pb-2" role="group" aria-label={t('screenAria')}>
        {rowSeats.map((seats, rowIndex) => (
          <div key={map.rows[rowIndex]} className="seat-row-enter flex items-center gap-1.5" style={{ animationDelay: `${rowIndex * 45}ms` }}>
            <span className="w-5 text-center text-[11px] font-semibold text-white/35 select-none" aria-hidden="true">
              {map.rows[rowIndex]}
            </span>
            {seats.map((seat) => {
              const isSelected = selectedSet.has(seat.id);
              const isDisabled = seat.state === 'disabled';
              const isOccupied = seat.state === 'occupied';
              const interactive = !isDisabled && !isOccupied;

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!interactive}
                  onClick={() => onToggle(seat.id)}
                  aria-pressed={isSelected}
                  aria-label={t('seatAria', { label: seat.label })}
                  aria-disabled={!interactive}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-t-md text-[10px] font-bold transition duration-150 sm:h-8 sm:w-8',
                    'ring-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]',
                    isSelected
                      ? 'seat-selected-pop bg-[#e31837] text-white ring-[#e31837] shadow-[0_0_12px_rgba(227,24,55,0.55)]'
                      : isOccupied
                        ? 'cursor-not-allowed bg-[#2a2a2a] text-white/25 ring-white/10'
                        : isDisabled
                          ? 'cursor-not-allowed bg-[repeating-linear-gradient(135deg,#1a1a1a_0_5px,#2e2e2e_5px_10px)] text-white/25 ring-white/10'
                          : 'cursor-pointer bg-white/15 text-white/70 ring-white/25 hover:bg-white/30 hover:text-white',
                  )}
                >
                  {seat.number}
                </button>
              );
            })}
            <span className="w-5 text-center text-[11px] font-semibold text-white/35 select-none" aria-hidden="true">
              {map.rows[rowIndex]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-white/10 pt-5">
        {LEGEND.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2 text-xs text-white/60">
            <span className={cn('h-3.5 w-3.5 rounded-t-sm ring-1 ring-inset', item.className)} aria-hidden="true" />
            {t(item.key)}
          </span>
        ))}
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="ms-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            {t('refresh')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
