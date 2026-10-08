'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className }: ModalProps) {
  const t = useTranslations('common');

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={onClose}
    >
      <div className="flex min-h-full items-start justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(event) => event.stopPropagation()}
          className={cn(
            'my-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0f0f0f] shadow-[0_24px_60px_rgba(0,0,0,0.6)]',
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <h2 className="text-base font-bold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e31837]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
