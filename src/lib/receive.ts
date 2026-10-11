import { db, type CheckIn, type HelpTask, type Need, type Sermon } from '../db';
import { buildFollowUps } from './logic';
import { needCreated } from '../sync/engine';
import type { SharePacket } from './share';

export type ReceivedNeed = Omit<Need, 'id' | 'circleId'> & { circleName: string };

/** Union of two copies of the same task: a claim or completion from either side wins. */
export function mergeTasks(a: HelpTask[], b: HelpTask[]): HelpTask[] {
  const out = new Map(a.map((t) => [t.id, { ...t }]));
  for (const t of b) {
    const cur = out.get(t.id);
    if (!cur) out.set(t.id, { ...t });
    else out.set(t.id, { ...cur, claimedBy: cur.claimedBy ?? t.claimedBy, done: cur.done || t.done });
  }
  return [...out.values()];
}

export async function receiveNeed(data: ReceivedNeed, circleId?: number): Promise<'added' | 'updated'> {
  const existing = await db.needs.where('shareId').equals(data.shareId).first();
  if (existing) {
    await db.needs.update(existing.id!, {
      prayedBy: [...new Set([...existing.prayedBy, ...data.prayedBy])],
      tasks: mergeTasks(existing.tasks, data.tasks),
      resolved: existing.resolved || data.resolved,
    });
    await needCreated(existing.id!);
    return 'updated';
  }
  let cid = circleId;
  if (!cid) {
    const match = await db.circles.where('name').equals(data.circleName).first();
    cid = match?.id ?? ((await db.circles.add({ name: data.circleName, members: [data.author], createdAt: Date.now() })) as number);
  }
  const { circleName: _n, ...need } = data;
  await needCreated((await db.needs.add({ ...need, circleId: cid })) as number);
  return 'added';
}

export async function receiveCheckIn(p: SharePacket<Omit<CheckIn, 'id' | 'pactId' | 'from'>>): Promise<'added' | 'exists' | 'no-pact'> {
  const pact = await db.pacts.toCollection().first();
  if (!pact) return 'no-pact';
  if (await db.checkins.where('shareId').equals(p.data.shareId).first()) return 'exists';
  await db.checkins.add({ ...p.data, pactId: pact.id!, from: p.from });
  return 'added';
}

export async function receiveSermon(data: Omit<Sermon, 'id' | 'followUps'>): Promise<{ id: number; existed: boolean }> {
  const existing = await db.sermons.where('shareId').equals(data.shareId).first();
  if (existing) return { id: existing.id!, existed: true };
  const id = (await db.sermons.add({ ...data, followUps: buildFollowUps(data) })) as number;
  return { id, existed: false };
}

