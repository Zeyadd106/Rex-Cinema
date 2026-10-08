import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PillTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

const TONES: Record<PillTone, string> = {
  success: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  danger: 'bg-[#e31837]/15 text-[#ff6b81] ring-[#e31837]/40',
  warning: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  info: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  neutral: 'bg-white/10 text-white/60 ring-white/15',
};

export function statusTone(value: string): PillTone {
  if (value === 'confirmed' || value === 'paid' || value === 'now-showing') return 'success';
  if (value === 'pending' || value === 'coming-soon') return 'warning';
  if (value === 'cancelled' || value === 'failed') return 'danger';
  return 'neutral';
}

export default function StatusPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
