'use client';
import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useBooking } from '@/context/BookingContext';
import BookingStepper from '@/components/BookingStepper';
import { ApiError, api } from '@/lib/client';
import { hasErrors, validatePayment, type ErrorMap } from '@/lib/validation';
import type { Booking } from '@/types/booking';
import { cn } from '@/lib/utils';

const PAYMENT_FIELDS = ['holder', 'cardNumber', 'expiry', 'cvc'];
const KNOWN_CODES = [
  'required',
  'tooShort',
  'invalid',
  'invalidPhone',
  'invalidEmail',
  'expired',
  'notFound',
  'past',
  'taken',
  'disabled',
  'tooMany',
  'seats',
  'showtime',
  'generic',
  'unknown',
];

type Method = 'credit_card' | 'debit_card';

interface InputProps {
  id: string;
  label: string;
  icon?: LucideIcon;
  value: string;
  type?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  autoComplete?: string;
  maxLength?: number;
  error: string | null;
  onChange: (value: string) => void;
}

function PaymentInput({
  id,
  label,
  icon: Icon,
  value,
  type = 'text',
  inputMode = 'text',
  autoComplete,
  maxLength,
  error,
  onChange,
}: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold text-white/70">
        {Icon ? <Icon className="h-4 w-4 text-[#e31837]" aria-hidden="true" /> : null}
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={label}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          'mt-2 h-12 w-full rounded-xl border bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:bg-white/10',
          error ? 'border-[#e31837]' : 'border-white/15 focus:border-[#e31837]/70',
        )}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-[#e31837]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function PaymentClient() {
  const t = useTranslations('payment');
  const tBook = useTranslations('book');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('validation');
  const tDash = useTranslations('dashboard');
  const router = useRouter();
  const { draft, ready, reset, addRecent } = useBooking();

  const [method, setMethod] = useState<Method>('credit_card');
  const [holder, setHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<ErrorMap>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [startOver, setStartOver] = useState(false);
  const [pending, setPending] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

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

  const hasDraft = Boolean(
    draft.movieId && draft.showtimeId && draft.seats.length && draft.customer.fullName.trim(),
  );

  const emptyMessage = !draft.movieId
    ? tBook('noMovie')
    : !draft.showtimeId
      ? tBook('noShowtime')
      : !draft.seats.length
        ? tBook('noSeats')
        : tDash('empty');

  const fieldError = (field: string) => {
    const codes = errors[field];
    if (!codes?.length) return null;
    return KNOWN_CODES.includes(codes[0]) ? tVal(codes[0]) : tVal('generic');
  };

  const updateField = (field: string, value: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'holder') setHolder(value);
    if (field === 'cardNumber') {
      setCardNumber(value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim());
    }
    if (field === 'expiry') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
    }
    if (field === 'cvc') setCvc(value.replace(/\D/g, '').slice(0, 4));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = validatePayment({ holder, cardNumber, expiry, cvc });
    setErrors(found);
    setBanner(null);
    setStartOver(false);
    if (hasErrors(found)) return;

    setPending(true);
    try {
      const { booking } = await api.post<{ booking: Booking }>('/bookings', {
        showtimeId: draft.showtimeId,
        seats: draft.seats,
        customer: draft.customer,
        payment: { holder, cardNumber, expiry, cvc },
      });
      reset();
      addRecent(booking.reference);
      setSucceeded(true);
      router.replace(`/confirmation?ref=${encodeURIComponent(booking.reference)}`);
    } catch (error) {
      const fieldErrors: ErrorMap = {};
      let nextBanner: string | null = null;
      if (error instanceof ApiError) {
        for (const [field, codes] of Object.entries(error.errors)) {
          if (PAYMENT_FIELDS.includes(field)) {
            fieldErrors[field] = codes;
            continue;
          }
          const code = codes[0];
          nextBanner = KNOWN_CODES.includes(code) ? tVal(code) : tVal('generic');
        }
        if (error.status === 409) {
          nextBanner = tVal('taken');
          setStartOver(true);
        }
        if (!nextBanner && !Object.keys(fieldErrors).length) nextBanner = t('failed');
      } else {
        nextBanner = t('failed');
      }
      setErrors(fieldErrors);
      setBanner(nextBanner);
    } finally {
      setPending(false);
    }
  };

  if (!ready || succeeded) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-sm text-white/50 sm:px-6">
        {tCommon('loading')}
      </div>
    );
  }

  if (!hasDraft) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <CreditCard className="h-10 w-10 text-white/20" aria-hidden="true" />
          <p className="max-w-sm text-lg font-semibold text-white/70">{emptyMessage}</p>
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

  const methods: { key: Method; label: string }[] = [
    { key: 'credit_card', label: t('creditCard') },
    { key: 'debit_card', label: t('debitCard') },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <header>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">{t('title')}</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">{t('subtitle')}</p>
      </header>

      <BookingStepper steps={steps} current={4} className="mt-6" />

      <form onSubmit={submit} noValidate className="mt-8 rounded-2xl border border-white/10 bg-[#0f0f0f] p-5 sm:p-6">
        <div>
          <h2 className="text-xs font-semibold tracking-widest text-white/40 uppercase">{t('method')}</h2>
          <div role="radiogroup" aria-label={t('method')} className="mt-3 grid grid-cols-2 gap-3">
            {methods.map((item) => (
              <button
                key={item.key}
                type="button"
                role="radio"
                aria-checked={method === item.key}
                onClick={() => setMethod(item.key)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition',
                  method === item.key
                    ? 'border-[#e31837] bg-[#e31837]/10 text-white ring-1 ring-[#e31837]/50'
                    : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white',
                )}
              >
                <CreditCard className="h-4 w-4 shrink-0 text-[#e31837]" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-5">
          <PaymentInput
            id="cardHolder"
            label={t('cardHolder')}
            value={holder}
            autoComplete="cc-name"
            error={fieldError('holder')}
            onChange={(value) => updateField('holder', value)}
          />
          <PaymentInput
            id="cardNumber"
            label={t('cardNumber')}
            icon={CreditCard}
            value={cardNumber}
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={23}
            error={fieldError('cardNumber')}
            onChange={(value) => updateField('cardNumber', value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <PaymentInput
              id="expiry"
              label={t('expiry')}
              value={expiry}
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              error={fieldError('expiry')}
              onChange={(value) => updateField('expiry', value)}
            />
            <PaymentInput
              id="cvc"
              label={t('cvc')}
              value={cvc}
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              error={fieldError('cvc')}
              onChange={(value) => updateField('cvc', value)}
            />
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 rounded-xl border border-[#009ddb]/30 bg-[#009ddb]/10 px-4 py-3 text-xs leading-relaxed text-white/70">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#009ddb]" aria-hidden="true" />
          {t('testHint')}
        </p>

        {banner ? (
          <div className="mt-6 rounded-xl border border-[#e31837]/40 bg-[#e31837]/10 px-4 py-3">
            <p className="flex items-start gap-2 text-sm font-semibold text-[#e31837]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {banner}
            </p>
            {startOver ? (
              <Link
                href="/book-movie"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#e31837] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#c41530]"
              >
                {t('startOver')}
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#e31837] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#c41530] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
          {pending ? t('processing') : t('payNow')}
        </button>

        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/40">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-white/30" aria-hidden="true" />
          {t('secure')}
        </p>
      </form>

      <button
        type="button"
        onClick={() => router.push('/booking-details')}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
        {t('backToDetails')}
      </button>
    </div>
  );
}
