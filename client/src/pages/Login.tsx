import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { apiError } from '../services/api';

function EyeIcon({ off, className }: { off?: boolean; className?: string }) {
  if (off) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.9 2.7-2.6 3.8l3.9 3c2.4-2.2 3.6-5.1 3.7-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.9 3C3.3 21.3 7.3 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-3.9-3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l3.9-3z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l3.9 3c1-2.9 3.7-4.9 6.8-4.9z" />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true" className="text-white">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="12.5" />
      <circle cx="12" cy="16" r="0.6" fill="#f87171" />
    </svg>
  );
}

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  error?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  focused?: boolean;
  trailing?: React.ReactNode;
}

function Field({ id, label, value, onChange, type = 'text', autoComplete, error, onBlur, onFocus, focused, trailing }: FieldProps) {
  const { t } = useLang();
  const filled = value.trim() !== '';
  const showFloating = filled || focused;
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          autoComplete={autoComplete}
          placeholder=" "
          className={`w-full rounded-lg border px-4 text-[15px] font-medium outline-none transition ${
            showFloating ? 'pb-2.5 pt-6' : 'py-3.5'
          } ${
            error
              ? 'border-red-400/80 bg-white/[0.03] text-white focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
              : filled
                ? 'border-slate-300 bg-white text-slate-900 focus:border-vox-pink focus:ring-2 focus:ring-vox-pink/25'
                : 'border-white/25 bg-white/[0.03] text-white placeholder:text-white/35 focus:border-white/60'
          } ${trailing ? 'pe-12' : ''}`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute transition-all ${
            showFloating
              ? `-top-2.5 start-3 px-1.5 text-xs font-semibold ${error ? 'bg-[#0b0b0e] text-red-400' : filled ? 'bg-white text-slate-500' : 'bg-[#0b0b0e] text-white/60'}`
              : `start-4 top-1/2 -translate-y-1/2 text-[15px] ${error ? 'font-medium text-red-400' : 'text-white/40'}`
          }`}
        >
          {label}
        </label>
        {trailing && <div className="absolute end-3 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && <p className="mb-1 mt-1.5 text-sm text-red-400">{t.auth.required}</p>}
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [otp, setOtp] = useState(false);
  const [tried, setTried] = useState(false);
  const [idBlurred, setIdBlurred] = useState(false);
  const [passBlurred, setPassBlurred] = useState(false);
  const [idFocused, setIdFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const idError = (tried || idBlurred) && identifier.trim() === '';
  const passError = !otp && (tried || passBlurred) && password === '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp) {
      setNotice(t.auth.otpSoon);
      return;
    }
    setTried(true);
    if (identifier.trim() === '' || password === '') return;
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const user = await login(identifier.trim(), password);
      const from = (location.state as { from?: string })?.from;
      navigate(from ?? (user.is_admin ? '/admin' : '/'), { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-[#0b0b0e] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="REX Cinemas" className="h-10 w-10" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <span className="text-2xl font-bold uppercase tracking-[2px] text-white">REX <span className="text-vox-pink">Cinemas</span></span>
        </Link>
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-300px)] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2">
        {/* ── Form column ── */}
        <div className="mx-auto w-full max-w-[420px]">
          <h1 className="text-[26px] font-bold">{t.auth.loginTitle}</h1>
          <p className="mb-7 mt-1.5 text-sm text-white/60">
            {t.auth.dontHave} <Link to="/register" className="font-semibold text-vox-blue hover:underline">{t.auth.registerLink}</Link>
          </p>

          <form onSubmit={submit} noValidate className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 ring-1 ring-red-500/30">{error}</p>}
            {notice && <p className="rounded-lg bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-300 ring-1 ring-sky-500/30">{notice}</p>}

            <Field
              id="login-id" label={t.auth.idLabel} value={identifier} onChange={setIdentifier}
              autoComplete="username" error={idError}
              focused={idFocused} onFocus={() => setIdFocused(true)} onBlur={() => { setIdFocused(false); setIdBlurred(true); }}
              trailing={idError ? <ErrorIcon /> : undefined}
            />

            {!otp && (
              <Field
                id="login-pass" label={t.auth.password} type={show ? 'text' : 'password'} value={password} onChange={setPassword}
                autoComplete="current-password" error={passError}
                focused={passFocused} onFocus={() => setPassFocused(true)} onBlur={() => { setPassFocused(false); setPassBlurred(true); }}
                trailing={
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t.auth.hidePass : t.auth.showPass}
                    className={`rounded p-0.5 transition ${passError ? 'text-red-400 hover:text-red-300' : password ? 'text-slate-500 hover:text-slate-800' : 'text-white/45 hover:text-white'}`}>
                    <EyeIcon off={!show} />
                  </button>
                }
              />
            )}

            <div className="flex justify-start">
              <Link to="/forgot-password" className="text-sm font-medium text-vox-blue hover:underline">{t.auth.forgot}</Link>
            </div>

            <button
              type="button" role="switch" aria-checked={otp} onClick={() => { setOtp((o) => !o); setNotice(''); }}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-start transition ${otp ? 'border-vox-pink bg-vox-pink/10' : 'border-white/25 bg-transparent hover:border-white/50'}`}
            >
              <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${otp ? 'bg-vox-pink' : 'bg-white/25'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${otp ? 'start-[22px]' : 'start-0.5'}`} />
              </span>
              <span>
                <span className="flex items-center gap-1.5 text-sm font-bold">
                  {t.auth.otpTitle}
                  <span title="A single-use code sent to your email or phone" className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/40 text-[10px] text-white/70">?</span>
                </span>
                <span className="block text-xs text-white/55">{t.auth.otpSub}</span>
              </span>
            </button>

            <button disabled={busy} className="w-full rounded-lg bg-gradient-to-b from-vox-pink to-vox-pink-dark py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_28px_rgba(212,15,125,0.45)] transition hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(212,15,125,0.55)] disabled:opacity-50">
              {busy ? t.auth.loggingIn : otp ? t.auth.sendCode : t.auth.loginBtn}
            </button>
            <p className="text-center text-[11px] text-white/35">{t.auth.demo}</p>
          </form>

          <div className="mb-5 mt-7 text-center text-xs font-medium uppercase tracking-[2px] text-white/45">{t.auth.orWith}</div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setNotice(`Google ${t.auth.socialSoon}`)}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/30 py-3 transition hover:border-white/70 hover:bg-white/5" aria-label="Log in with Google">
              <GoogleIcon />
            </button>
            <button type="button" onClick={() => setNotice(`Apple ${t.auth.socialSoon}`)}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/30 py-3 transition hover:border-white/70 hover:bg-white/5" aria-label="Log in with Apple">
              <AppleIcon />
            </button>
          </div>
        </div>

        {/* ── Photo panel ── */}
        <div className="hidden overflow-hidden rounded-2xl bg-gradient-to-br from-vox-navy via-[#3a0a14] to-black lg:block">
          <img
            src="/images/login-audience.png" alt="Movie night at REX Cinemas"
            className="aspect-[4/5] w-full object-cover"
            loading="eager"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        </div>
      </div>

      {/* ── Brand strip footer ── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <p className="text-xs text-white/45">© 2026, REX Cinemas. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-2">
            {['REX CINEMAS', 'REX REWARDS', 'GOLD', 'IMAX', '4DX', 'KIDS'].map((b) => (
              <span key={b} className="rounded border border-white/15 px-2 py-1 text-[10px] font-bold tracking-widest text-white/50">{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
