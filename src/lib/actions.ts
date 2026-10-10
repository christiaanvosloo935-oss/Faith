import { db, type CheckIn, type HelpTask, type Need, type Pin, type Sermon } from '../db';
import { uid } from './ids';
import { sendLink, shareUrl, type SharePacket } from './share';
import { needCreated } from '../sync/engine';

export async function createNeed(n: Omit<Need, 'id' | 'createdAt' | 'prayedBy' | 'resolved' | 'shareId'>) {
  const id = (await db.needs.add({ ...n, createdAt: Date.now(), prayedBy: [], resolved: false, shareId: uid() })) as number;
  await needCreated(id);
  return id;
}

export function newTask(kind: HelpTask['kind'], label: string, when?: string): HelpTask {
  return { id: uid(), kind, label, when, done: false };
}

/** Circle needs travel with only the circle's name, never the private prayer they came from. */
export async function shareNeed(need: Need, from: string) {
  const circle = await db.circles.get(need.circleId);
  const { id: _id, circleId: _c, ...data } = need;
  const packet: SharePacket = { v: 1, kind: 'need', from, data: { ...data, circleName: circle?.name ?? 'Circle' } };
  return sendLink(`Prayer need: ${need.title}`, `${from} shared a need with ${circle?.name ?? 'the circle'}: “${need.title}”. Open to pray and help:`, shareUrl(packet));
}

/** Only answers marked "shared" leave the device. */
export async function shareCheckIn(c: CheckIn, from: string) {
  const data = { answers: c.answers.filter((a) => a.shared).map(({ question, answer }) => ({ question, answer, shared: true })), commitment: c.commitment, createdAt: c.createdAt, shareId: c.shareId };
  const packet: SharePacket = { v: 1, kind: 'checkin', from, data };
  return sendLink('Weekly check-in', `${from} sent you their weekly check-in:`, shareUrl(packet));
}

export async function shareSermon(s: Sermon, from: string) {
  const { id: _id, followUps: _f, ...data } = s;
  const packet: SharePacket = { v: 1, kind: 'sermon', from, data };
  return sendLink(s.title, `Sermon notes: ${s.title}${s.passage ? ` (${s.passage})` : ''}`, shareUrl(packet));
}

export async function sharePin(p: Pin, from: string) {
  const { id: _id, ...data } = p;
  const packet: SharePacket = { v: 1, kind: 'pin', from, data };
  return sendLink(`${p.reference} at ${p.placeName}`, `${from} pinned ${p.reference} to ${p.placeName}:`, shareUrl(packet));
}

export function shareResultMessage(r: 'shared' | 'copied' | 'cancelled') {
  return r === 'copied' ? 'Link copied. Paste it into a message.' : r === 'shared' ? 'Shared' : 'Not shared';
}
