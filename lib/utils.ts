export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function datePlusDays(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeReference(): string {
  let out = 'REX';
  for (let i = 0; i < 8; i++) out += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  return out;
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Deterministic day index (0 = today) for a YYYY-MM-DD date string. */
export function daysFromToday(date: string): number {
  const target = new Date(`${date}T12:00:00`);
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

export function isValidTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function youtubeEmbedId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)|youtu\.be\/([^?]+)/);
  return m?.[1] ?? m?.[2] ?? null;
}
