import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { apiError } from '../services/api';
import { GoogleIcon, AppleIcon } from './Login';

type Title = 'Mr' | 'Mrs' | 'Miss/Ms';

function EgyptFlag() {
  return (
    <span className="inline-flex h-5 w-7 shrink-0 flex-col overflow-hidden rounded-[3px] ring-1 ring-white/25" title="Egypt">
      <span className="h-1/3 bg-[#ce1126]" />
      <span className="h-1/3 bg-white" />
      <span className="h-1/3 bg-black" />
    </span>
  );
}

export default function Register() {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [title, setTitle] = useState<Title>('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [rewards, setRewards] = useState(true);
  const [insider, setInsider] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const phoneDigits = phone.replace(/[\s-]/g, '');
  const phoneValid = /^\+?\d{8,15}$/.test(phoneDigits);

  const err = (bad: boolean) => tried && bad;
  const firstErr = err(firstName.trim().length < 2);
  const lastErr = err(lastName.trim().length < 2);
  const emailErr = err(!emailValid);
  const phoneErr = err(!phoneValid);
  const dobErr = err(!birthDate);
  const passErr = err(password.length < 8);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (firstErr || lastErr || emailErr || phoneErr || dobErr || passErr) return;
    setError('');
    setBusy(true);
    try {
      const { user } = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
        phone: `+20${phoneDigits.replace(/^\+?20/, '').replace(/^0/, '')}`,
        birth_date: birthDate,
        gender: title === 'Mr' ? 'male' : 'female',
      });
      navigate(user.is_admin ? '/admin' : '/', { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const field = (bad: boolean) =>
    `w-full rounded-lg border bg-transparent px-4 py-3.5 text-[15px] text-white outline-none transition placeholder:text-white/40 focus:ring-2 ${
      bad
        ? 'border-red-400/80 focus:border-red-400 focus:ring-red-400/20'
        : 'border-white/25 hover:border-white/45 focus:border-vox-pink focus:ring-vox-pink/25'
    }`;
  const msg = (bad: boolean) => bad && <p className="mt-1.5 text-sm text-red-400">{t.auth.required}</p>;

  return (
    <div className="bg-[#0b0b0e] text-white">
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/logo.svg" alt="REX Cinemas" className="h-10 w-10" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
          <span className="text-2xl font-bold uppercase tracking-[2px] text-white">REX <span className="text-vox-pink">Cinemas</span></span>
        </Link>
      </div>
      <div className="mx-auto grid min-h-[calc(100vh-300px)] max-w-6xl items-start gap-10 px-6 py-10 lg:grid-cols-2">
        {/* ── Form column ── */}
        <div className="mx-auto w-full max-w-[440px]">
          <h1 className="text-[26px] font-bold uppercase tracking-wide">{t.auth.createTitle}</h1>
          <p className="mb-6 mt-1.5 text-sm text-white/60">
            {t.auth.haveAccount} <Link to="/login" className="font-semibold text-vox-blue hover:underline">{t.auth.loginLink}</Link>
          </p>

          <p className="mb-3 text-[15px] text-white/85">{t.auth.signupWith}</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setNotice(`Google ${t.auth.socialSoon}`)}
              className="flex items-center justify-center rounded-lg border border-white/30 py-3 transition hover:border-white/70 hover:bg-white/5" aria-label="Sign up with Google">
              <GoogleIcon />
            </button>
            <button type="button" onClick={() => setNotice(`Apple ${t.auth.socialSoon}`)}
              className="flex items-center justify-center rounded-lg border border-white/30 py-3 transition hover:border-white/70 hover:bg-white/5" aria-label="Sign up with Apple">
              <AppleIcon />
            </button>
          </div>

          <div className="my-5 text-center text-xs font-medium uppercase tracking-[2px] text-white/45">{t.auth.or}</div>

          <form onSubmit={submit} noValidate className="space-y-4">
            {error && <p className="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 ring-1 ring-red-500/30">{error}</p>}
            {notice && <p className="rounded-lg bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-300 ring-1 ring-sky-500/30">{notice}</p>}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2" role="radiogroup" aria-label="Title">
              {(['Mr', 'Mrs', 'Miss/Ms'] as Title[]).map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 text-[15px] text-white/85">
                  <input
                    type="radio" name="title" checked={title === opt} onChange={() => setTitle(opt)}
                    className="h-5 w-5 accent-vox-blue"
                  />
                  {opt === 'Mr' ? t.auth.mr : opt === 'Mrs' ? t.auth.mrs : t.auth.miss}
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t.auth.firstName} autoComplete="given-name" className={field(firstErr)} />
                {msg(firstErr)}
              </div>
              <div>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={t.auth.lastName} autoComplete="family-name" className={field(lastErr)} />
                {msg(lastErr)}
              </div>
            </div>

            <div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.auth.email} autoComplete="email" className={field(emailErr)} />
              {msg(emailErr)}
            </div>

            <div>
              <div className="flex">
                <span className="inline-flex items-center gap-1.5 rounded-s-lg border border-e-0 border-white/25 bg-white/5 px-3 text-sm font-semibold text-white/85">
                  <EgyptFlag /> +20
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white/50"><path d="m6 9 6 6 6-6" /></svg>
                </span>
                <input
                  value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^\d\s-]/g, ''))}
                  placeholder={t.auth.phonePh} inputMode="tel" autoComplete="tel"
                  className={`${field(phoneErr)} rounded-s-none border-s-0`}
                />
              </div>
              {msg(phoneErr)}
            </div>

            <div>
              <div className="relative">
                <input
                  type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  aria-label="Date of birth"
                  className={`${field(dobErr)} pe-12 [color-scheme:dark] ${birthDate ? '' : 'text-white/40'}`}
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-white/45">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              {!birthDate && <p className="mt-1.5 text-sm text-white/40">{t.auth.dobHint}</p>}
              {msg(dobErr)}
            </div>

            <div>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.auth.passwordPh} autoComplete="new-password"
                  className={`${field(passErr)} pe-12`}
                />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t.auth.hidePass : t.auth.showPass}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 transition hover:text-white">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {show ? (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {msg(passErr)}
            </div>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${rewards ? 'border-vox-pink/70 bg-vox-pink/[0.07]' : 'border-white/20 hover:border-white/40'}`}>
              <input type="checkbox" checked={rewards} onChange={(e) => setRewards(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-vox-pink" />
              <span className="text-sm leading-relaxed text-white/80">
                {t.auth.rewardsTitle} <span className="font-medium text-vox-blue">{t.auth.rewardsTerms}</span>
              </span>
              <span className="ms-auto hidden rounded bg-white/10 px-2 py-1 text-[10px] font-bold tracking-widest text-white/70 sm:block">★ SHARE</span>
            </label>

            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${insider ? 'border-vox-pink/70 bg-vox-pink/[0.07]' : 'border-white/20 hover:border-white/40'}`}>
              <input type="checkbox" checked={insider} onChange={(e) => setInsider(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded accent-vox-pink" />
              <span className="text-sm leading-relaxed text-white/80">
                {t.auth.insider}
              </span>
            </label>

            <button disabled={busy} className="w-full rounded-lg bg-gradient-to-b from-vox-pink to-vox-pink-dark py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_28px_rgba(212,15,125,0.45)] transition hover:-translate-y-px hover:shadow-[0_10px_32px_rgba(212,15,125,0.55)] disabled:opacity-50">
              {busy ? t.auth.creating : t.auth.createBtn}
            </button>
          </form>
        </div>

        {/* ── Photo panel ── */}
        <div className="hidden overflow-hidden rounded-2xl bg-gradient-to-br from-vox-navy via-[#3a0a14] to-black lg:sticky lg:top-6 lg:block">
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
          <p className="text-xs text-white/45">{t.footer.rights}</p>
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
