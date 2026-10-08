'use client';
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LoadingState() {
  const t = useTranslations('common');
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-[#0f0f0f] px-4 py-14 text-sm text-white/50"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      {t('loading')}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#e31837]/30 bg-[#e31837]/10 px-4 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-[#e31837]" aria-hidden="true" />
      <p className="text-sm font-semibold text-white">{t('error')}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/15 transition hover:bg-[#e31837] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]"
        >
          {t('retry')}
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-12 text-center">
      <Inbox className="h-6 w-6 text-white/30" aria-hidden="true" />
      <p className="text-sm text-white/50">{message}</p>
    </div>
  );
}
