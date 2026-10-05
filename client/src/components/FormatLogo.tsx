import type { CSSProperties } from 'react';
import { FORMATS } from '../pages/WaysToWatch';

function Icon({ format }: { format: string }) {
  const common = 'format-logo-icon';
  switch (format) {
    case 'imax':
      return (
        <svg viewBox="0 0 32 20" className={common} aria-hidden="true">
          <rect x="1.5" y="1.5" width="29" height="17" rx="2.5" className="fl-frame" />
          <line x1="6" y1="7" x2="26" y2="7" className="fl-scan" />
          <line x1="6" y1="11" x2="26" y2="11" className="fl-scan fl-scan-2" />
          <line x1="6" y1="14.5" x2="19" y2="14.5" className="fl-scan fl-scan-3" />
        </svg>
      );
    case 'max':
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <polygon points="13,1 4,14 11,14 10,23 20,9 13,9" className="fl-bolt" />
        </svg>
      );
    case 'gold':
      return (
        <svg viewBox="0 0 28 22" className={common} aria-hidden="true">
          <path d="M2 17 L4 7 L9.5 12 L14 4 L18.5 12 L24 7 L26 17 Z" className="fl-crown" />
          <rect x="2" y="18.2" width="24" height="2.4" rx="1.2" className="fl-crown-base" />
          <circle cx="14" cy="4" r="1.6" className="fl-spark" />
          <circle cx="4" cy="7" r="1.2" className="fl-spark fl-spark-2" />
          <circle cx="24" cy="7" r="1.2" className="fl-spark fl-spark-3" />
        </svg>
      );
    case '4dx':
      return (
        <svg viewBox="0 0 34 20" className={common} aria-hidden="true">
          <g className="fl-wind" strokeLinecap="round">
            <line x1="1" y1="5" x2="13" y2="5" />
            <line x1="1" y1="10" x2="17" y2="10" />
            <line x1="1" y1="15" x2="13" y2="15" />
          </g>
          <g className="fl-chevrons" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20,4 26,10 20,16" />
            <polyline points="25,4 31,10 25,16" />
          </g>
        </svg>
      );
    case 'kids':
      return (
        <svg viewBox="0 0 30 24" className={common} aria-hidden="true">
          <g className="fl-balloon fl-balloon-1">
            <circle cx="9" cy="8" r="5" />
            <line x1="9" y1="13" x2="9" y2="21" />
          </g>
          <g className="fl-balloon fl-balloon-2">
            <circle cx="21" cy="6.5" r="4" />
            <line x1="21" y1="10.5" x2="21" y2="21" />
          </g>
          <circle cx="15" cy="18" r="1.4" className="fl-dot" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
          <circle cx="12" cy="12" r="8.5" className="fl-halo" />
          <circle cx="12" cy="12" r="3.2" className="fl-core" />
          <path d="M4 12h3 M17 12h3 M12 4v3 M12 17v3" className="fl-rays" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function FormatLogo({ format, className = '' }: { format: string; className?: string }) {
  const key = format.toLowerCase();
  const meta = FORMATS[key] ?? { name: format.toUpperCase(), color: '#d40f7d' };
  const style = { '--format-color': meta.color } as CSSProperties;
  return (
    <span className={`format-logo format-logo-${key} ${className}`} style={style} role="img" aria-label={`${meta.name} logo`}>
      <Icon format={key} />
      <span className="format-logo-text">{meta.name}</span>
      <span className="format-logo-sheen" aria-hidden="true" />
    </span>
  );
}
