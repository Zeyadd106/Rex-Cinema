const BRAND = 'REX CINEMAS';

export default function Splash({ leaving = false, onSkip }: { leaving?: boolean; onSkip?: () => void }) {
  return (
    <div
      role="status"
      aria-label="Loading REX Cinemas"
      onClick={onSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#050b16] ${leaving ? 'splash-leaving' : ''}`}
    >
      {/* ambient glows */}
      <div className="splash-orb splash-orb-pink" aria-hidden="true" />
      <div className="splash-orb splash-orb-blue" aria-hidden="true" />
      <div className="splash-grain" aria-hidden="true" />

      {/* logo mark */}
      <div className="relative flex items-center justify-center">
        <span className="splash-ring" aria-hidden="true" />
        <span className="splash-ring splash-ring-2" aria-hidden="true" />
        <span className="splash-glow" aria-hidden="true" />
        <img src="/logo.svg" alt="" aria-hidden="true" className="splash-logo h-28 w-28 sm:h-32 sm:w-32" draggable={false} />
        <span className="splash-shine" aria-hidden="true" />
      </div>

      {/* brand text */}
      <h1 className="mt-6 flex overflow-hidden text-2xl font-bold uppercase tracking-[6px] text-white sm:text-3xl" aria-label={BRAND}>
        {BRAND.split('').map((ch, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`splash-letter ${ch === ' ' ? 'w-3 sm:w-4' : ''} ${i >= 4 ? 'text-vox-pink' : ''}`}
            style={{ animationDelay: `${0.45 + i * 0.055}s` }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </h1>
      <p className="splash-sub mt-2 text-[11px] font-medium uppercase tracking-[4px] text-white/45">
        Experience the magic
      </p>

      {/* progress bar */}
      <div className="mt-8 h-[3px] w-44 overflow-hidden rounded-full bg-white/10 sm:w-52">
        <div className="splash-bar h-full w-full origin-left rounded-full bg-gradient-to-r from-vox-pink via-[#ff4d8d] to-vox-blue" />
      </div>

      {onSkip && (
        <button
          onClick={(e) => { e.stopPropagation(); onSkip(); }}
          className="absolute bottom-6 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[2px] text-white/35 transition hover:bg-white/5 hover:text-white/70"
        >
          Skip
        </button>
      )}
    </div>
  );
}
