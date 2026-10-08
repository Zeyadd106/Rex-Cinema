'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BookingCustomer, BookingDraft } from '@/types/booking';

const DRAFT_KEY = 'rex_booking_draft';
const RECENT_KEY = 'rex_recent_bookings';

const emptyDraft: BookingDraft = {
  movieId: null,
  cinemaId: null,
  hallId: null,
  date: null,
  showtimeId: null,
  seats: [],
  customer: { fullName: '', phone: '', email: '' },
};

interface BookingContextValue {
  draft: BookingDraft;
  ready: boolean;
  update: (patch: Partial<BookingDraft>) => void;
  setCustomer: (customer: Partial<BookingCustomer>) => void;
  reset: () => void;
  recentRefs: string[];
  addRecent: (reference: string) => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);
  const [recentRefs, setRecentRefs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    setDraft(readJson(DRAFT_KEY, emptyDraft));
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      setRecentRefs(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setRecentRefs([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* storage unavailable */
    }
  }, [draft, ready]);

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const setCustomer = useCallback((customer: Partial<BookingCustomer>) => {
    setDraft((prev) => ({ ...prev, customer: { ...prev.customer, ...customer } }));
  }, []);

  const reset = useCallback(() => setDraft(emptyDraft), []);

  const addRecent = useCallback((reference: string) => {
    setRecentRefs((prev) => {
      const next = [reference, ...prev.filter((r) => r !== reference)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ draft, ready, update, setCustomer, reset, recentRefs, addRecent }),
    [draft, ready, update, setCustomer, reset, recentRefs, addRecent],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
