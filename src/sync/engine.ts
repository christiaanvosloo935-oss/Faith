import { useSyncExternalStore } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { db, type CheckIn, type Circle, type Need, type Pact } from '../db';
import { syncConfigured } from '../config';
import { PACT_QUESTIONS } from '../data/scripture';
import { uid } from '../lib/ids';
import { ensureSession } from './client';
import { newKey, seal, unseal, type Sealed } from './crypto';
import { mergeNeedForPush } from './merge';

/**
 * Live sync. A "space" is a synced circle or pact. Every record in it is
 * encrypted on this device with the space's key before upload; the server
 * stores and relays opaque blobs. Local IndexedDB stays the source of truth,
 * so the app keeps working offline and catches up when the network returns.
 */

export type SpaceType = 'circle' | 'pact';
interface Space {
  type: SpaceType;
  localId: number;
  syncId: string;
  key: string;
}

type Kind = 'meta' | 'member' | 'need' | 'checkin';
interface Row extends Sealed {
  id: string;
  circle_id: string;
  kind: Kind;
  updated_at: string;
  updated_by: string | null;
}

type NeedBody = Omit<Need, 'id' | 'circleId' | 'dirty'>;
interface CheckInBody {
  author: string;
  createdAt: number;
  answers: { question: string; answer: string; shared: true }[];
  commitment: string;
}
interface Meta {
  name?: string;
  checkInDay?: number;
  questions?: string[];
}

/* ─── Status ─── */

export type SyncStatus = 'off' | 'connecting' | 'live' | 'offline' | 'error';
let status: SyncStatus = 'off';
let lastError = '';
const listeners = new Set<() => void>();
function setStatus(s: SyncStatus, err = '') {
  status = s;
  lastError = err;
  listeners.forEach((l) => l());
}
export function useSyncStatus() {
  const s = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => status,
  );
  return { status: s, error: lastError };
}

/* ─── Helpers ─── */

async function myName() {
  return ((await db.settings.get('name'))?.value as string) || 'Friend';
}

async function spaces(): Promise<Space[]> {
  const circles = (await db.circles.toArray()).filter((c) => c.syncId && c.key);
  const pacts = (await db.pacts.toArray()).filter((p) => p.syncId && p.key);
  return [
    ...circles.map((c) => ({ type: 'circle' as const, localId: c.id!, syncId: c.syncId!, key: c.key! })),
    ...pacts.map((p) => ({ type: 'pact' as const, localId: p.id!, syncId: p.syncId!, key: p.key! })),
  ];
}

/** A stable per-space id for my "member" record. */
async function memberItemId(syncId: string) {
  const k = `member:${syncId}`;
  const existing = (await db.settings.get(k))?.value as string | undefined;
  if (existing) return existing;
  const id = uid();
  await db.settings.put({ key: k, value: id });
  return id;
}

async function upsertItem(space: Space, id: string, kind: Kind, value: unknown) {
  const { sb } = await ensureSession();
  const sealed = await seal(space.key, value);
  const { error } = await sb.from('items').upsert({ id, circle_id: space.syncId, kind, ...sealed, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

async function fetchItem<T>(space: Space, id: string): Promise<T | null> {
  const { sb } = await ensureSession();
  const { data, error } = await sb.from('items').select('iv, ct').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? unseal<T>(space.key, data) : null;
}

export function inviteLink(type: SpaceType, syncId: string, key: string) {
  return `${location.origin}${location.pathname}#/join/${type}.${syncId}.${key}`;
}

export function parseInvite(token: string): { type: SpaceType; syncId: string; key: string } | null {
  const [type, syncId, key] = token.split('.');
  if ((type !== 'circle' && type !== 'pact') || !/^[0-9a-f-]{36}$/i.test(syncId ?? '') || !key) return null;
  return { type, syncId, key };
}

/* ─── Turning sync on, joining ─── */

async function createSpace(type: SpaceType, meta: Meta): Promise<{ syncId: string; key: string }> {
  const { sb } = await ensureSession();
  const syncId = uid();
  const key = newKey();
  let r = await sb.from('circles').insert({ id: syncId });
  if (r.error) throw new Error(r.error.message);
  r = await sb.from('circle_members').insert({ circle_id: syncId });
  if (r.error) throw new Error(r.error.message);
  const space: Space = { type, localId: 0, syncId, key };
  await upsertItem(space, syncId, 'meta', meta);
  await upsertItem(space, await memberItemId(syncId), 'member', { name: await myName() });
  return { syncId, key };
}

export async function enableCircleSync(circle: Circle): Promise<string> {
  setStatus('connecting');
  const { syncId, key } = await createSpace('circle', { name: circle.name });
  await db.circles.update(circle.id!, { syncId, key });
  await db.needs.where('circleId').equals(circle.id!).modify({ dirty: true });
  await startSync();
  return inviteLink('circle', syncId, key);
}

export async function enablePactSync(pact: Pact): Promise<string> {
  setStatus('connecting');
  const { syncId, key } = await createSpace('pact', { checkInDay: pact.checkInDay, questions: pact.questions });
  await db.pacts.update(pact.id!, { syncId, key });
  await db.checkins.where('pactId').equals(pact.id!).filter((c) => c.from === 'me').modify({ dirty: true });
  await startSync();
  return inviteLink('pact', syncId, key);
}

export async function joinSpace(type: SpaceType, syncId: string, key: string): Promise<{ localId: number }> {
  setStatus('connecting');
  const { sb } = await ensureSession();
  const { error } = await sb.from('circle_members').insert({ circle_id: syncId });
  if (error && error.code !== '23505') throw new Error(error.code === '23503' ? 'This invite is no longer valid.' : error.message);

  const space: Space = { type, localId: 0, syncId, key };
  const meta = (await fetchItem<Meta>(space, syncId)) ?? {};
  let localId: number;
  if (type === 'circle') {
    const existing = await db.circles.where('syncId').equals(syncId).first();
    localId = existing?.id ?? ((await db.circles.add({ name: meta.name ?? 'Circle', members: [], createdAt: Date.now(), syncId, key })) as number);
  } else {
    const existing = (await db.pacts.where('syncId').equals(syncId).first()) ?? (await db.pacts.toCollection().first());
    if (existing && existing.syncId && existing.syncId !== syncId) throw new Error('You already have a live pact. End it first to join a new one.');
    if (existing) {
      await db.pacts.update(existing.id!, { syncId, key });
      localId = existing.id!;
    } else {
      localId = (await db.pacts.add({ partner: 'Partner', checkInDay: meta.checkInDay ?? 0, questions: meta.questions ?? PACT_QUESTIONS, startedAt: Date.now(), syncId, key })) as number;
    }
  }
  await upsertItem({ ...space, localId }, await memberItemId(syncId), 'member', { name: await myName() });
  await db.settings.delete(`pulled:${syncId}`);
  await startSync();
  return { localId };
}

/** Stop syncing on this device. Local data stays. */
export async function leaveSpace(type: SpaceType, localId: number) {
  const rec = type === 'circle' ? await db.circles.get(localId) : await db.pacts.get(localId);
  if (!rec?.syncId) return;
  try {
    const { sb, userId } = await ensureSession();
    await sb.from('circle_members').delete().eq('circle_id', rec.syncId).eq('user_id', userId);
  } catch {
    /* offline: membership simply lingers */
  }
  if (type === 'circle') await db.circles.update(localId, { syncId: undefined, key: undefined });
  else await db.pacts.update(localId, { syncId: undefined, key: undefined });
  await startSync();
}

/* ─── Writing ─── */

/** Save a need locally and, if its circle is live, upload it. */
export async function saveNeed(id: number, change: Partial<Need> | ((n: Need) => Partial<Need>)) {
  const n = await db.needs.get(id);
  if (!n) return;
  const patch = typeof change === 'function' ? change(n) : change;
  const circle = await db.circles.get(n.circleId);
  await db.needs.update(id, { ...patch, dirty: !!circle?.syncId });
  if (circle?.syncId) void pushNeed(id).catch(() => setStatus(navigator.onLine ? 'error' : 'offline'));
}

export async function needCreated(id: number) {
  const n = await db.needs.get(id);
  const circle = n && (await db.circles.get(n.circleId));
  if (!circle?.syncId) return;
  await db.needs.update(id, { dirty: true });
  void pushNeed(id).catch(() => setStatus(navigator.onLine ? 'error' : 'offline'));
}

async function pushNeed(id: number) {
  const n = await db.needs.get(id);
  const circle = n && (await db.circles.get(n.circleId));
  if (!n || !circle?.syncId || !circle.key) return;
  const space: Space = { type: 'circle', localId: circle.id!, syncId: circle.syncId, key: circle.key };
  const { id: _i, circleId: _c, dirty: _d, ...local } = n;
  const remote = await fetchItem<NeedBody>(space, n.shareId);
  const merged = mergeNeedForPush(local, remote, await myName());
  await upsertItem(space, n.shareId, 'need', merged);
  await db.needs.update(id, { ...merged, dirty: false });
}

export async function checkInCreated(id: number) {
  const c = await db.checkins.get(id);
  const pact = c && (await db.pacts.get(c.pactId));
  if (!c || !pact?.syncId) return;
  await db.checkins.update(id, { dirty: true });
  void pushCheckIn(id).catch(() => setStatus(navigator.onLine ? 'error' : 'offline'));
}

/** Only the answers marked "shared" are uploaded. */
async function pushCheckIn(id: number) {
  const c = await db.checkins.get(id);
  const pact = c && (await db.pacts.get(c.pactId));
  if (!c || c.from !== 'me' || !pact?.syncId || !pact.key) return;
  const body: CheckInBody = {
    author: await myName(),
    createdAt: c.createdAt,
    answers: c.answers.filter((a) => a.shared && a.answer.trim()).map(({ question, answer }) => ({ question, answer, shared: true })),
    commitment: c.commitment,
  };
  await upsertItem({ type: 'pact', localId: pact.id!, syncId: pact.syncId, key: pact.key }, c.shareId, 'checkin', body);
  await db.checkins.update(id, { dirty: false });
}

async function pushDirty() {
  for (const n of await db.needs.filter((x) => !!x.dirty).toArray()) await pushNeed(n.id!);
  for (const c of await db.checkins.filter((x) => !!x.dirty).toArray()) await pushCheckIn(c.id!);
}

/* ─── Reading ─── */

async function applyRemote(space: Space, row: Row, myUserId: string) {
  if (row.updated_by === myUserId && row.kind !== 'meta') return;
  const value = await unseal<unknown>(space.key, row);
  switch (row.kind) {
    case 'meta': {
      const m = value as Meta;
      if (space.type === 'circle' && m.name) await db.circles.update(space.localId, { name: m.name });
      break;
    }
    case 'member': {
      const { name } = value as { name: string };
      if (row.updated_by === myUserId || !name) break;
      if (space.type === 'circle') {
        const c = await db.circles.get(space.localId);
        if (c && !c.members.includes(name)) await db.circles.update(space.localId, { members: [...c.members, name] });
      } else {
        await db.pacts.update(space.localId, { partner: name });
      }
      break;
    }
    case 'need': {
      const body = value as NeedBody;
      const local = await db.needs.where('shareId').equals(row.id).first();
      if (!local) await db.needs.add({ ...body, circleId: space.localId, shareId: row.id });
      else if (local.dirty) await pushNeed(local.id!);
      else await db.needs.update(local.id!, { ...body });
      break;
    }
    case 'checkin': {
      const body = value as CheckInBody;
      const local = await db.checkins.where('shareId').equals(row.id).first();
      const rec = { pactId: space.localId, from: body.author, createdAt: body.createdAt, answers: body.answers, commitment: body.commitment, shareId: row.id };
      if (local) await db.checkins.update(local.id!, rec);
      else await db.checkins.add(rec as CheckIn);
      break;
    }
  }
}

async function pull(space: Space, myUserId: string) {
  const { sb } = await ensureSession();
  const since = ((await db.settings.get(`pulled:${space.syncId}`))?.value as string) ?? '1970-01-01T00:00:00Z';
  const { data, error } = await sb.from('items').select('*').eq('circle_id', space.syncId).gt('updated_at', since).order('updated_at').limit(1000);
  if (error) throw new Error(error.message);
  // Meta and members first so names are in place before content.
  const order: Kind[] = ['meta', 'member', 'need', 'checkin'];
  const rows = (data as Row[]).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  for (const row of rows) {
    try {
      await applyRemote(space, row, myUserId);
    } catch {
      /* undecryptable or malformed row: skip it */
    }
  }
  const latest = rows.reduce((m, r) => (r.updated_at > m ? r.updated_at : m), since);
  await db.settings.put({ key: `pulled:${space.syncId}`, value: latest });
}

/* ─── Lifecycle ─── */

let channels: RealtimeChannel[] = [];
let started = false;

export async function startSync() {
  if (!syncConfigured()) return setStatus('off');
  const list = await spaces();
  for (const ch of channels) void ch.unsubscribe();
  channels = [];
  if (!list.length) return setStatus('off');
  if (!navigator.onLine) return setStatus('offline');
  setStatus('connecting');
  try {
    const { sb, userId } = await ensureSession();
    await pushDirty();
    for (const s of list) await pull(s, userId);
    channels = list.map((s) =>
      sb
        .channel(`items:${s.syncId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `circle_id=eq.${s.syncId}` }, (p) => {
          const row = p.new as Row;
          if (row?.id) void applyRemote(s, row, userId).catch(() => {});
        })
        .subscribe((st) => {
          if (st === 'SUBSCRIBED') setStatus('live');
          else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') setStatus('error', 'Live connection dropped. Retrying…');
        }),
    );
  } catch (e) {
    setStatus(navigator.onLine ? 'error' : 'offline', (e as Error).message);
  }
  if (!started) {
    started = true;
    window.addEventListener('online', () => void startSync());
    window.addEventListener('offline', () => setStatus('offline'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && status !== 'connecting') void startSync();
    });
  }
}
