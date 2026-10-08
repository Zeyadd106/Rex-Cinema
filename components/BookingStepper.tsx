'use client';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface BookingStepperProps {
  steps: string[];
  current: number;
  className?: string;
}

export default function BookingStepper({ steps, current, className }: BookingStepperProps) {
  const t = useTranslations('dashboard');

  return (
    <nav aria-label={t('progress')} className={cn('no-print', className)}>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {steps.map((label, i) => {
          const completed = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ring-1',
                  completed
                    ? 'bg-[#e31837] text-white ring-[#e31837]'
                    : active
                      ? 'bg-white/15 text-white ring-white/40'
                      : 'bg-white/5 text-white/40 ring-white/10',
                )}
              >
                {completed ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'truncate text-[11px] font-semibold sm:text-xs',
                  completed ? 'text-white/70' : active ? 'text-white' : 'text-white/35',
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('mx-1 h-px min-w-3 flex-1', completed ? 'bg-[#e31837]/50' : 'bg-white/10')}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
