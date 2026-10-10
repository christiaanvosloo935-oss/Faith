import { describe, expect, it } from 'vitest';
import { buildFollowUps, dueFollowUps, livedOutStreak, prayersToRevisit, rebuildFollowUps, stepForDate } from './logic';
import { decodePacket, encodePacket } from './share';
import { distanceKm, nearest } from './geo';
import { mergeTasks } from './receive';
import { DAY, isoDate } from './dates';
import { BIBLICAL_SITES, OBEDIENCE_STEPS } from '../data/scripture';
import type { Prayer, Sermon } from '../db';

describe('daily step', () => {
  it('is stable within a day and changes the next day', () => {
    const a = new Date(2026, 9, 10, 7);
    const b = new Date(2026, 9, 10, 22);
    const c = new Date(2026, 9, 11, 7);
    expect(stepForDate(a).id).toBe(stepForDate(b).id);
    expect(stepForDate(a).id).not.toBe(stepForDate(c).id);
  });
  it('covers every step in a cycle', () => {
    const seen = new Set<string>();
    for (let i = 0; i < OBEDIENCE_STEPS.length; i++) seen.add(stepForDate(new Date(2026, 0, 1 + i)).id);
    expect(seen.size).toBe(OBEDIENCE_STEPS.length);
  });
});

describe('sermon follow-ups', () => {
  const base = { date: '2026-10-04', application: 'Call my brother', questions: ['Q1'] };
  it('schedules recall, apply and prepare after the sermon', () => {
    const f = buildFollowUps(base);
    expect(f.map((x) => x.key)).toEqual(['recall', 'apply', 'prepare']);
    expect(isoDate(f[0].dueAt)).toBe('2026-10-05');
    expect(isoDate(f[1].dueAt)).toBe('2026-10-07');
    expect(isoDate(f[2].dueAt)).toBe('2026-10-09');
    expect(f[1].prompt).toContain('Call my brother');
  });
  it('keeps answers when rebuilt', () => {
    const f = buildFollowUps(base);
    f[0] = { ...f[0], response: 'Grace', doneAt: 1 };
    const s = { ...base, followUps: f, date: '2026-10-11' } as Sermon;
    const r = rebuildFollowUps(s);
    expect(r[0].response).toBe('Grace');
    expect(isoDate(r[0].dueAt)).toBe('2026-10-12');
  });
  it('lists only due, unanswered follow-ups', () => {
    const f = buildFollowUps(base);
    const s = { ...base, id: 1, followUps: [{ ...f[0], doneAt: 5 }, f[1], f[2]] } as Sermon;
    const now = f[1].dueAt + 1000;
    expect(dueFollowUps([s], now).map((d) => d.followUp.key)).toEqual(['apply']);
  });
});

describe('prayers to revisit', () => {
  it('returns praying prayers whose revisit date has passed', () => {
    const now = Date.now();
    const p = (o: Partial<Prayer>) => ({ title: '', body: '', category: '', createdAt: 0, revisitAt: now - DAY, status: 'praying', visibility: 'private', ...o }) as Prayer;
    const list = [p({ title: 'due' }), p({ title: 'later', revisitAt: now + DAY }), p({ title: 'answered', status: 'answered' })];
    expect(prayersToRevisit(list, now).map((x) => x.title)).toEqual(['due']);
  });
});

describe('streak', () => {
  it('counts consecutive days ending today or yesterday', () => {
    const today = new Date(2026, 9, 10, 12);
    expect(livedOutStreak(['2026-10-10', '2026-10-09', '2026-10-08', '2026-10-06'], today)).toBe(3);
    expect(livedOutStreak(['2026-10-09', '2026-10-08'], today)).toBe(2);
    expect(livedOutStreak(['2026-10-07'], today)).toBe(0);
  });
});

describe('share links', () => {
  it('round-trips unicode content', () => {
    const p = { v: 1 as const, kind: 'need' as const, from: 'Ané', data: { title: 'Bid vir Ouma ❤️ “hip”' } };
    expect(decodePacket(encodePacket(p))).toEqual(p);
  });
  it('rejects garbage', () => {
    expect(() => decodePacket('bm90LWpzb24')).toThrow();
  });
});

describe('help tasks merge', () => {
  it('keeps claims and completions from both copies', () => {
    const a = [{ id: '1', kind: 'meal' as const, label: 'Meal', done: false }, { id: '2', kind: 'ride' as const, label: 'Ride', done: false, claimedBy: 'Thabo' }];
    const b = [{ id: '1', kind: 'meal' as const, label: 'Meal', done: false, claimedBy: 'Sarah' }, { id: '2', kind: 'ride' as const, label: 'Ride', done: true, claimedBy: 'Thabo' }];
    expect(mergeTasks(a, b)).toEqual([
      { id: '1', kind: 'meal', label: 'Meal', done: false, claimedBy: 'Sarah' },
      { id: '2', kind: 'ride', label: 'Ride', done: true, claimedBy: 'Thabo' },
    ]);
  });
});

describe('geo', () => {
  it('measures Jerusalem to Bethlehem at about 8 km', () => {
    const j = BIBLICAL_SITES.find((s) => s.id === 'jerusalem')!;
    const b = BIBLICAL_SITES.find((s) => s.id === 'bethlehem')!;
    expect(distanceKm(j, b)).toBeGreaterThan(7);
    expect(distanceKm(j, b)).toBeLessThan(10);
  });
  it('finds the nearest site', () => {
    expect(nearest({ lat: 41.9, lng: 12.5 }, BIBLICAL_SITES)?.item.id).toBe('rome');
  });
});
