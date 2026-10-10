import type { FollowUp, Prayer, Sermon } from '../db';
import { OBEDIENCE_STEPS, type ObedienceStep } from '../data/scripture';
import { DAY, dayNumber, parseIsoDate } from './dates';

/** Same step for everyone on a given day, cycling through the list. */
export function stepForDate(d: Date | number = new Date()): ObedienceStep {
  const n = dayNumber(d);
  return OBEDIENCE_STEPS[((n % OBEDIENCE_STEPS.length) + OBEDIENCE_STEPS.length) % OBEDIENCE_STEPS.length];
}

export function stepById(id: string): ObedienceStep | undefined {
  return OBEDIENCE_STEPS.find((s) => s.id === id);
}

/**
 * Follow-up rhythm after a sermon: recall the next day, apply mid-week,
 * prepare for small group at the end of the week. Due at 8am local.
 */
export function buildFollowUps(s: Pick<Sermon, 'date' | 'application' | 'questions'>): FollowUp[] {
  const base = parseIsoDate(s.date).getTime() + 8 * 60 * 60 * 1000;
  const step = s.application.trim().replace(/[.!?]+$/, '');
  return [
    { key: 'recall', dueAt: base + 1 * DAY, prompt: 'In one sentence, what was the main point, and why does it matter to you?' },
    {
      key: 'apply',
      dueAt: base + 3 * DAY,
      prompt: step ? `Have you taken your step yet: “${step}”? What happened?` : 'What is one thing you have done differently because of this sermon?',
    },
    {
      key: 'prepare',
      dueAt: base + 5 * DAY,
      prompt: s.questions.length ? 'Which discussion question will you bring to your group, and what is your answer?' : 'What would you share with a friend from this sermon?',
    },
  ];
}

/** Keep answers when the sermon date or step changes. */
export function rebuildFollowUps(s: Sermon): FollowUp[] {
  return buildFollowUps(s).map((f) => {
    const old = s.followUps.find((o) => o.key === f.key);
    return old ? { ...f, response: old.response, doneAt: old.doneAt } : f;
  });
}

export function dueFollowUps(sermons: Sermon[], now = Date.now()) {
  const out: { sermon: Sermon; followUp: FollowUp }[] = [];
  for (const sermon of sermons) for (const f of sermon.followUps) if (!f.doneAt && f.dueAt <= now) out.push({ sermon, followUp: f });
  return out.sort((a, b) => a.followUp.dueAt - b.followUp.dueAt);
}

export function prayersToRevisit(prayers: Prayer[], now = Date.now()) {
  return prayers.filter((p) => p.status === 'praying' && p.revisitAt <= now).sort((a, b) => a.revisitAt - b.revisitAt);
}

export const REVISIT_OPTIONS = [
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 182 },
  { label: '1 year', days: 365 },
];

/** Consecutive days with a completed step, ending today or yesterday. */
export function livedOutStreak(doneDates: string[], today = new Date()): number {
  const set = new Set(doneDates);
  const t = dayNumber(today);
  const key = (n: number) => {
    const d = new Date(n * DAY);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  };
  let n = set.has(key(t)) ? t : t - 1;
  let count = 0;
  while (set.has(key(n))) {
    count++;
    n--;
  }
  return count;
}
