import Dexie, { type EntityTable } from 'dexie';

/**
 * Privacy tiers. Everything lives on this device; the tier records who the
 * person has chosen to share it with (via a link they send themselves).
 */
export type Visibility = 'private' | 'circle' | 'community';

export type PrayerStatus = 'praying' | 'answered' | 'differently';

export interface Prayer {
  id?: number;
  title: string;
  body: string;
  category: string;
  createdAt: number;
  revisitAt: number;
  status: PrayerStatus;
  answeredAt?: number;
  answerNote?: string;
  visibility: Visibility;
  /** The short line shared with a circle; the full body never leaves the device. */
  sharedSummary?: string;
  circleId?: number;
}

export interface Circle {
  id?: number;
  name: string;
  members: string[];
  createdAt: number;
}

export type TaskKind = 'meal' | 'ride' | 'childcare' | 'visit' | 'errand' | 'other';

export interface HelpTask {
  id: string;
  kind: TaskKind;
  label: string;
  when?: string;
  claimedBy?: string;
  done: boolean;
}

export interface Need {
  id?: number;
  circleId: number;
  author: string;
  title: string;
  detail: string;
  createdAt: number;
  prayedBy: string[];
  tasks: HelpTask[];
  resolved: boolean;
  /** Stable id so the same need received twice via link isn't duplicated. */
  shareId: string;
}

export interface Pin {
  id?: number;
  lat: number;
  lng: number;
  placeName: string;
  reference: string;
  text: string;
  note: string;
  createdAt: number;
  visibility: Visibility;
}

export interface ObedienceEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  stepId: string;
  status: 'pending' | 'done' | 'skipped';
  reflection: string;
  updatedAt: number;
}

export interface Pact {
  id?: number;
  partner: string;
  checkInDay: number; // 0 = Sunday
  questions: string[];
  startedAt: number;
}

export interface CheckInAnswer {
  question: string;
  answer: string;
  shared: boolean;
}

export interface CheckIn {
  id?: number;
  pactId: number;
  /** 'me' for my own check-ins, otherwise the partner's name (received via link). */
  from: string;
  createdAt: number;
  answers: CheckInAnswer[];
  commitment: string;
  shareId: string;
}

export type SectionKey =
  | 'passage'
  | 'mainPoint'
  | 'notes'
  | 'questions'
  | 'application'
  | 'followUps';

export type LayoutStyle = 'scroll' | 'cards' | 'journal';
export type Motif = 'leaves' | 'wheat' | 'waves' | 'stone' | 'stars' | 'vine';

export interface SermonLayout {
  style: LayoutStyle;
  motif: Motif;
  palette: string;
  serifBody: boolean;
  sections: { key: SectionKey; visible: boolean }[];
}

export interface FollowUp {
  key: 'recall' | 'apply' | 'prepare';
  dueAt: number;
  prompt: string;
  response?: string;
  doneAt?: number;
}

export interface Sermon {
  id?: number;
  title: string;
  preacher: string;
  church: string;
  date: string; // YYYY-MM-DD
  passage: string;
  mainPoint: string;
  notes: string;
  questions: string[];
  application: string;
  theme: string;
  layout: SermonLayout;
  visibility: Visibility;
  followUps: FollowUp[];
  createdAt: number;
  shareId: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export const db = new Dexie('faith') as Dexie & {
  prayers: EntityTable<Prayer, 'id'>;
  circles: EntityTable<Circle, 'id'>;
  needs: EntityTable<Need, 'id'>;
  pins: EntityTable<Pin, 'id'>;
  obedience: EntityTable<ObedienceEntry, 'id'>;
  pacts: EntityTable<Pact, 'id'>;
  checkins: EntityTable<CheckIn, 'id'>;
  sermons: EntityTable<Sermon, 'id'>;
  settings: EntityTable<Setting, 'key'>;
};

db.version(1).stores({
  prayers: '++id, status, revisitAt, createdAt, answeredAt, circleId',
  circles: '++id, name',
  needs: '++id, circleId, createdAt, resolved, &shareId',
  pins: '++id, createdAt',
  obedience: '++id, &date',
  pacts: '++id',
  checkins: '++id, pactId, createdAt, &shareId',
  sermons: '++id, date, createdAt, &shareId',
  settings: 'key',
});

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export function setSetting(key: string, value: unknown) {
  return db.settings.put({ key, value });
}

const TABLES = ['prayers', 'circles', 'needs', 'pins', 'obedience', 'pacts', 'checkins', 'sermons', 'settings'] as const;

/** Full JSON backup so a lost phone doesn't mean lost prayers. */
export async function exportAll() {
  const out: Record<string, unknown[]> = {};
  for (const t of TABLES) out[t] = await db.table(t).toArray();
  return { app: 'faith', version: 1, exportedAt: Date.now(), data: out };
}

export async function importAll(backup: { app?: string; data?: Record<string, unknown[]> }) {
  if (backup.app !== 'faith' || !backup.data) throw new Error('This file is not a Faith backup.');
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      const rows = backup.data![t];
      if (Array.isArray(rows)) await db.table(t).bulkPut(rows);
    }
  });
}

export async function eraseAll() {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) await db.table(t).clear();
  });
}
