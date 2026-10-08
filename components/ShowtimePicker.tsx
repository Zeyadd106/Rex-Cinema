'use client';
import { useMemo, useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { ShowtimeDetails } from '@/types/showtime';
import { formatDay, formatTime } from '@/lib/format';
import { daysFromToday, todayISO } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ShowtimePickerProps {
  movieId: string;
  showtimes: ShowtimeDetails[];
}

export default function ShowtimePicker({ movieId, showtimes }: ShowtimePickerProps) {
  const t = useTranslations('moviePage');
  const tBook = useTranslations('book');
  const locale = useLocale();

  const dates = useMemo(() => [...new Set(showtimes.map((s) => s.date))].sort(), [showtimes]);
  const [activeDate, setActiveDate] = useState(() => dates[0] ?? todayISO());
  const dayShowtimes = useMemo(
    () => showtimes.filter((s) => s.date === activeDate),
    [showtimes, activeDate],
  );

  if (!showtimes.length) return null;

  const dateLabel = (date: string) => {
    const delta = daysFromToday(date);
    if (delta === 0) return tBook('today');
    if (delta === 1) return tBook('tomorrow');
    return formatDay(date, locale);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('showtimes')}>
        {dates.map((date) => (
          <button
            key={date}
            role="tab"
            aria-selected={date === activeDate}
            type="button"
            onClick={() => setActiveDate(date)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ring-1',
              date === activeDate
                ? 'bg-[#e31837] text-white ring-[#e31837]'
                : 'text-white/60 ring-white/15 hover:bg-white/5 hover:text-white',
            )}
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {dateLabel(date)}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dayShowtimes.map((showtime) => (
          <Link
            key={showtime.id}
            href={`/book-movie?movie=${encodeURIComponent(movieId)}&showtime=${encodeURIComponent(showtime.id)}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-[#e31837]/60 hover:bg-[#e31837]/10"
          >
            <span className="flex items-center gap-2 text-base font-bold text-white">
              <Clock className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
              {formatTime(showtime.time, locale)}
            </span>
            <span className="flex flex-col items-end text-xs">
              <span className="font-semibold text-white/70">{showtime.format}</span>
              <span className="text-white/40">{showtime.cinemaName}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
