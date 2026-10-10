import { describe, expect, it } from 'vitest';
import { mergeNeedForPush } from './merge';
import { newKey, seal, unseal } from './crypto';
import { parseInvite } from './engine';
import { buildIcs, nextWeekday } from '../lib/reminders';
import type { Need } from '../db';

type Body = Omit<Need, 'id' | 'circleId' | 'dirty'>;
const need = (o: Partial<Body>): Body => ({ author: 'Sarah', title: 'Meals', detail: '', createdAt: 1, prayedBy: [], tasks: [], resolved: false, shareId: 's', ...o });
const task = (id: string, claimedBy?: string, done = false) => ({ id, kind: 'meal' as const, label: 'Meal', claimedBy, done });

describe('mergeNeedForPush', () => {
  it('keeps prayers from everyone and my own toggle', () => {
    const remote = need({ prayedBy: ['Thabo', 'Me'] });
    expect(mergeNeedForPush(need({ prayedBy: ['Lerato'] }), remote, 'Me').prayedBy.sort()).toEqual(['Lerato', 'Thabo']);
    expect(mergeNeedForPush(need({ prayedBy: ['Me'] }), need({ prayedBy: ['Thabo'] }), 'Me').prayedBy.sort()).toEqual(['Me', 'Thabo']);
  });
  it('does not let my stale copy undo someone else’s claim', () => {
    const merged = mergeNeedForPush(need({ tasks: [task('1')] }), need({ tasks: [task('1', 'Thabo')] }), 'Me');
    expect(merged.tasks[0].claimedBy).toBe('Thabo');
  });
  it('lets me claim, release and complete my own tasks', () => {
    expect(mergeNeedForPush(need({ tasks: [task('1', 'Me')] }), need({ tasks: [task('1')] }), 'Me').tasks[0].claimedBy).toBe('Me');
    expect(mergeNeedForPush(need({ tasks: [task('1')] }), need({ tasks: [task('1', 'Me')] }), 'Me').tasks[0].claimedBy).toBeUndefined();
    expect(mergeNeedForPush(need({ tasks: [task('1', 'Me', true)] }), need({ tasks: [task('1', 'Me')] }), 'Me').tasks[0].done).toBe(true);
  });
  it('picks up tasks the author added elsewhere', () => {
    expect(mergeNeedForPush(need({ tasks: [task('1')] }), need({ tasks: [task('1'), task('2')] }), 'Me').tasks.map((t) => t.id)).toEqual(['1', '2']);
  });
});

describe('encryption', () => {
  it('round-trips and rejects the wrong key', async () => {
    const k = newKey();
    const sealed = await seal(k, { title: 'Bid vir Ouma ❤️' });
    expect(sealed.ct).not.toContain('Ouma');
    expect(await unseal(k, sealed)).toEqual({ title: 'Bid vir Ouma ❤️' });
    await expect(unseal(newKey(), sealed)).rejects.toThrow();
  });
});

describe('invites', () => {
  it('parses valid invites and rejects bad ones', () => {
    const id = '0b6c8a7e-1f2d-4c3b-9a8e-7d6c5b4a3f21';
    expect(parseInvite(`circle.${id}.abc`)).toEqual({ type: 'circle', syncId: id, key: 'abc' });
    expect(parseInvite(`pact.${id}.abc`)?.type).toBe('pact');
    expect(parseInvite(`group.${id}.abc`)).toBeNull();
    expect(parseInvite('circle.nope.abc')).toBeNull();
  });
});

describe('calendar', () => {
  it('builds a valid weekly event with an alarm', () => {
    const ics = buildIcs([{ uid: 'pact-weekly', title: 'Weekly check-in; with Johan', start: new Date(Date.UTC(2026, 9, 15, 17)), repeatDays: 7 }], new Date(Date.UTC(2026, 9, 10)));
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART:20261015T170000Z');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;INTERVAL=1');
    expect(ics).toContain(String.raw`SUMMARY:Weekly check-in\; with Johan`);
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
  it('finds the next weekday', () => {
    const sat = new Date(2026, 9, 10, 12);
    expect(nextWeekday(4, 19, sat).getDay()).toBe(4);
    expect(nextWeekday(6, 19, sat).getDate()).toBe(10);
    expect(nextWeekday(6, 9, sat).getDate()).toBe(17);
  });
});
