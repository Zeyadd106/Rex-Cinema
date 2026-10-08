'use client';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Mail, Phone, Ticket, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useBooking } from '@/context/BookingContext';
import BookingStepper from '@/components/BookingStepper';
import BookingSummary from '@/components/BookingSummary';
import { api } from '@/lib/client';
import { hasErrors, validateCustomer, type ErrorMap } from '@/lib/validation';
import type { PriceQuote } from '@/types/booking';
import type { ShowtimeDetails } from '@/types/showtime';
import { cn } from '@/lib/utils';

const CUSTOMER_CODES = ['required', 'tooShort', 'invalidPhone', 'invalidEmail'];

interface FieldProps {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  value: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
  error: string | null;
  onChange: (value: string) => void;
}

function Field({
  id,
  label,
  hint,
  icon: Icon,
  value,
  type = 'text',
  autoComplete,
  optional = false,
  error,
  onChange,
}: FieldProps) {
  const tCommon = useTranslations('common');

  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-white/70">
        <Icon className="h-4 w-4 text-[#e31837]" aria-hidden="true" />
        {label}
        {optional ? (
          <span className="ms-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/40">
            {tCommon('optional')}
          </span>
        ) : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-note`}
        className={cn(
          'mt-2 h-12 w-full rounded-xl border bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:bg-white/10',
          error ? 'border-[#e31837]' : 'border-white/15 focus:border-[#e31837]/70',
        )}
      />
      <p
        id={`${id}-note`}
        className={cn('mt-1.5 text-xs', error ? 'font-medium text-[#e31837]' : 'text-white/40')}
      >
        {error ?? hint}
      </p>
    </div>
  );
}

export default function BookingDetailsClient() {
  const t = useTranslations('bookingDetails');
  const tBook = useTranslations('book');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('validation');
  const tSum = useTranslations('summary');
  const tDash = useTranslations('dashboard');
  const router = useRouter();
  const { draft, ready, setCustomer } = useBooking();

  const [form, setForm] = useState({ fullName: '', phone: '', email: '' });
  const [errors, setErrors] = useState<ErrorMap>({});
  const [showFix, setShowFix] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [showtime, setShowtime] = useState<ShowtimeDetails | null>(null);
  const [quote, setQuote] = useState<PriceQuote | null>(null);

  useEffect(() => {
    if (!ready || seeded) return;
    setSeeded(true);
    setForm(draft.customer);
  }, [ready, seeded, draft.customer]);

  useEffect(() => {
    if (!draft.showtimeId) {
      setShowtime(null);
      return;
    }
    let alive = true;
    setShowtime(null);
    api
      .get<{ showtime: ShowtimeDetails }>(`/showtimes/${encodeURIComponent(draft.showtimeId)}`)
      .then((data) => {
        if (alive) setShowtime(data.showtime);
      })
      .catch(() => {
        if (alive) setShowtime(null);
      });
    return () => {
      alive = false;
    };
  }, [draft.showtimeId]);

  const seatCount = draft.seats.length;

  useEffect(() => {
    if (seatCount < 1) {
      setQuote(null);
      return;
    }
    let alive = true;
    api
      .get<{ quote: PriceQuote }>(`/quote?seats=${seatCount}`)
      .then((data) => {
        if (alive) setQuote(data.quote);
      })
      .catch(() => {
        if (alive) setQuote(null);
      });
    return () => {
      alive = false;
    };
  }, [seatCount]);

  const steps = useMemo(
    () => [
      tDash('steps.movie'),
      tDash('steps.showtime'),
      tDash('steps.seats'),
      tDash('steps.details'),
      tDash('steps.payment'),
    ],
    [tDash],
  );

  const seatLabels = useMemo(
    () => draft.seats.map((id) => id.split(':').pop() ?? id),
    [draft.seats],
  );

  const missingMessage = !draft.movieId
    ? tBook('noMovie')
    : !draft.showtimeId
      ? tBook('noShowtime')
      : tBook('noSeats');

  const fieldError = (field: string) => {
    const codes = errors[field];
    if (!codes?.length) return null;
    return CUSTOMER_CODES.includes(codes[0]) ? tVal(codes[0]) : tVal('generic');
  };

  const updateField = (field: 'fullName' | 'phone' | 'email', value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validateCustomer(form);
    setErrors(found);
    if (hasErrors(found)) {
      setShowFix(true);
      return;
    }
    setShowFix(false);
    setCustomer(form);
    router.push('/payment');
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-white/50 sm:px-6">
        {tCommon('loading')}
      </div>
    );
  }

  if (!draft.movieId || !draft.showtimeId || !draft.seats.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <Ticket className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="text-lg font-semibold text-white/70">{missingMessage}</p>
          <Link
            href="/book-movie"
            className="mt-2 rounded-full bg-[#e31837] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#c41530]"
          >
            {tCommon('bookNow')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <BookingStepper steps={steps} current={3} className="mt-6" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-10">
        <form
          onSubmit={submit}
          noValidate
          className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6"
        >
          <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">
            {t('yourInfo')}
          </h2>
          <p className="mt-2 text-sm text-white/50">{t('requiredNote')}</p>

          <div className="mt-6 flex max-w-xl flex-col gap-5">
            <Field
              id="fullName"
              label={t('fullName')}
              hint={t('fullNameHint')}
              icon={User}
              value={form.fullName}
              autoComplete="name"
              error={fieldError('fullName')}
              onChange={(value) => updateField('fullName', value)}
            />
            <Field
              id="phone"
              label={t('phone')}
              hint={t('phoneHint')}
              icon={Phone}
              type="tel"
              value={form.phone}
              autoComplete="tel"
              error={fieldError('phone')}
              onChange={(value) => updateField('phone', value)}
            />
            <Field
              id="email"
              label={t('email')}
              hint={t('emailHint')}
              icon={Mail}
              type="email"
              value={form.email}
              autoComplete="email"
              optional
              error={fieldError('email')}
              onChange={(value) => updateField('email', value)}
            />
          </div>

          {showFix ? (
            <p className="mt-6 flex items-center gap-2 rounded-xl border border-[#e31837]/40 bg-[#e31837]/10 px-4 py-3 text-sm font-semibold text-[#e31837]">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('fixForm')}
            </p>
          ) : null}

          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#e31837] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#c41530] sm:w-auto"
          >
            {t('continueToPayment')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingSummary
            movieTitle={showtime?.movieTitle ?? tSum('none')}
            cinemaName={showtime?.cinemaName ?? tSum('none')}
            hallName={showtime?.hallName ?? tSum('none')}
            date={showtime?.date ?? draft.date}
            time={showtime?.time ?? null}
            seatLabels={seatLabels}
            quote={quote}
          />
          <Link
            href="/book-movie"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            {tCommon('back')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
