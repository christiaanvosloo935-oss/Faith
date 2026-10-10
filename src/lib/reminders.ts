import { db } from '../db';
import { VAPID_PUBLIC_KEY, syncConfigured } from '../config';
import { ensureSession } from '../sync/client';
import { DAY } from './dates';
import { fromBase64Url } from './share';

/* ─── Calendar (.ics): works on every phone, no server needed ─── */

export interface CalEvent {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  minutes?: number;
  /** Repeat every N days, e.g. 7 for weekly. */
  repeatDays?: number;
  url?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

/** Fold lines longer than 75 octets, as the iCalendar spec requires. */
function fold(line: string) {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = ' ' + rest.slice(74);
  }
  out.push(rest);
  return out.join('\r\n');
}

export function buildIcs(events: CalEvent[], now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Faith//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const e of events) {
    const end = new Date(e.start.getTime() + (e.minutes ?? 15) * 60000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}@faith-app`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(e.start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    if (e.repeatDays) lines.push(e.repeatDays % 7 === 0 ? `RRULE:FREQ=WEEKLY;INTERVAL=${e.repeatDays / 7}` : `RRULE:FREQ=DAILY;INTERVAL=${e.repeatDays}`);
    lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(e.title)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(filename: string, events: CalEvent[]) {
  const blob = new Blob([buildIcs(events)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

const appUrl = (hash: string) => `${location.origin}${location.pathname}#${hash}`;

/** A time on the given day, local. */
export function atTime(day: number | Date, hours: number, minutes = 0) {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Next occurrence of a weekday (0 = Sunday) at a time, today included if still ahead. */
export function nextWeekday(weekday: number, hours: number, from = new Date()) {
  const d = atTime(from, hours);
  const add = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  if (d <= from) d.setDate(d.getDate() + 7);
  return d;
}

/* Reminder text is generic on purpose: no prayer content leaves the device. */
export const reminderFor = {
  prayer: (createdAt: number, revisitAt: number) => ({
    id: `prayer-${createdAt}`,
    fireAt: atTime(revisitAt, 8),
    title: 'A prayer is ready to look back on',
    body: 'Open Faith and remember how God has answered.',
    url: '#/prayer?tab=lookback',
  }),
  sermon: (shareId: string, key: string, dueAt: number) => ({
    id: `sermon-${shareId}-${key}`,
    fireAt: new Date(dueAt),
    title: 'Sermon follow-through',
    body: 'A short question about Sunday’s sermon is waiting for you.',
    url: '#/sermons',
  }),
  pact: (checkInDay: number) => ({
    id: 'pact-weekly',
    fireAt: nextWeekday(checkInDay, 19),
    title: 'Weekly check-in',
    body: 'Time for your accountability check-in.',
    url: '#/circle?tab=pact',
    repeatDays: 7,
  }),
  walk: (hours: number, minutes: number) => {
    const t = atTime(new Date(), hours, minutes);
    if (t.getTime() <= Date.now()) t.setTime(t.getTime() + DAY);
    return { id: 'walk-daily', fireAt: t, title: 'Today’s step', body: 'One small act of obedience is waiting for you.', url: '#/walk', repeatDays: 1 };
  },
};

export type Reminder = ReturnType<(typeof reminderFor)['prayer']> & { repeatDays?: number };

export const toCalEvent = (r: Reminder): CalEvent => ({ uid: r.id, title: r.title, description: r.body, start: r.fireAt, repeatDays: r.repeatDays, url: appUrl(r.url.slice(1)) });

/** Every upcoming reminder this device knows about. */
export async function allUpcoming(): Promise<Reminder[]> {
  const now = Date.now();
  const out: Reminder[] = [];
  for (const p of await db.prayers.where('status').equals('praying').toArray()) {
    const r = reminderFor.prayer(p.createdAt, p.revisitAt);
    if (r.fireAt.getTime() > now) out.push(r);
  }
  for (const s of await db.sermons.toArray())
    for (const f of s.followUps) if (!f.doneAt && f.dueAt > now) out.push(reminderFor.sermon(s.shareId, f.key, f.dueAt));
  const pact = await db.pacts.toCollection().first();
  if (pact) out.push(reminderFor.pact(pact.checkInDay));
  const walk = (await db.settings.get('walkReminder'))?.value as string | undefined;
  if (walk) {
    const [h, m] = walk.split(':').map(Number);
    out.push(reminderFor.walk(h, m));
  }
  return out;
}

/* ─── Push notifications (via Supabase) ─── */

export function pushSupported() {
  return syncConfigured() && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

export async function pushEnabled() {
  return pushSupported() && Notification.permission === 'granted' && !!(await db.settings.get('push'))?.value;
}

export async function enablePush() {
  if (!pushSupported()) throw new Error(isIos() && !isStandalone() ? 'On iPhone, first add Faith to your Home Screen (Share → Add to Home Screen), then open it from there.' : 'Notifications are not available here.');
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications were not allowed. You can change this in your phone’s settings.');
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromBase64Url(VAPID_PUBLIC_KEY) as BufferSource }));
  const { sb } = await ensureSession();
  const json = sub.toJSON();
  const { error } = await sb.from('push_subscriptions').upsert({ endpoint: json.endpoint, subscription: json });
  if (error) throw new Error(error.message);
  await db.settings.put({ key: 'push', value: true });
  await syncAllReminders();
}

export async function disablePush() {
  await db.settings.put({ key: 'push', value: false });
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const { sb } = await ensureSession();
      await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      await sub.unsubscribe();
    }
  } catch {
    /* already gone */
  }
}

/** Create or move a push reminder. Silently does nothing if push is off. */
export async function schedule(r: Reminder) {
  if (!(await pushEnabled())) return;
  try {
    const { sb } = await ensureSession();
    await sb.from('reminders').upsert({ id: r.id, fire_at: r.fireAt.toISOString(), title: r.title, body: r.body, url: r.url, repeat_days: r.repeatDays ?? null, sent_at: null });
  } catch {
    /* offline: syncAllReminders catches up next time */
  }
}

export async function cancel(...ids: string[]) {
  if (!(await pushEnabled())) return;
  try {
    const { sb } = await ensureSession();
    await sb.from('reminders').delete().in('id', ids);
  } catch {
    /* ignore */
  }
}

export async function syncAllReminders() {
  if (!(await pushEnabled())) return;
  const list = await allUpcoming();
  const { sb } = await ensureSession();
  const rows = list.map((r) => ({ id: r.id, fire_at: r.fireAt.toISOString(), title: r.title, body: r.body, url: r.url, repeat_days: r.repeatDays ?? null, sent_at: null }));
  if (rows.length) await sb.from('reminders').upsert(rows);
}
