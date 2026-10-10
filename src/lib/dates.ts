export const DAY = 24 * 60 * 60 * 1000;

/** Local calendar date as YYYY-MM-DD. */
export function isoDate(d: Date | number = new Date()): string {
  const x = new Date(d);
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${m}-${day}`;
}

/** Parse YYYY-MM-DD as local midnight. */
export function parseIsoDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Days since a fixed epoch, stable across time zones for a local date. */
export function dayNumber(d: Date | number = new Date()): number {
  const x = new Date(d);
  return Math.floor(Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) / DAY);
}

export function formatDate(t: number | string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const d = typeof t === 'string' ? parseIsoDate(t) : new Date(t);
  return d.toLocaleDateString(undefined, opts);
}

export function relativeDays(t: number, now = Date.now()): string {
  const diff = Math.round((dayNumber(t) - dayNumber(now)));
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return diff < 14 ? `in ${diff} days` : `in ${Math.round(diff / 7)} weeks`;
  const a = -diff;
  if (a < 14) return `${a} days ago`;
  if (a < 60) return `${Math.round(a / 7)} weeks ago`;
  if (a < 365) return `${Math.round(a / 30)} months ago`;
  return `${(a / 365).toFixed(a < 730 ? 1 : 0)} years ago`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 5) return 'Peace be with you';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
