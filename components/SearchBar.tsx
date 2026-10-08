'use client';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}

export default function SearchBar({ value, onChange, placeholder, className }: SearchBarProps) {
  const t = useTranslations();

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="pointer-events-none absolute start-4 h-4.5 w-4.5 text-white/40" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 w-full rounded-full border border-white/15 bg-white/5 ps-11 pe-11 text-sm text-white outline-none transition placeholder:text-white/40 focus:border-[#e31837]/70 focus:bg-white/10"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clear')}
          className="absolute end-3 rounded-full p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
