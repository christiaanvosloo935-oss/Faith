import { db, type ObedienceEntry, type Sermon } from '../db';
import { cloneLayout, themeById } from '../data/sermonThemes';
import { PACT_QUESTIONS } from '../data/scripture';
import { createNeed, newTask } from './actions';
import { DAY, isoDate } from './dates';
import { uid } from './ids';
import { buildFollowUps, stepForDate } from './logic';

/** Sample content so a new person can see every section working. */
export async function seedDemo() {
  const now = Date.now();

  await db.prayers.bulkAdd([
    { title: 'Wisdom about the job offer', body: 'Lord, show me whether to stay or go. Give me peace either way.', category: 'Work', createdAt: now - 40 * DAY, revisitAt: now - 2 * DAY, status: 'praying', visibility: 'private' },
    { title: 'Healing for Ouma’s hip', body: '', category: 'Health', createdAt: now - 12 * DAY, revisitAt: now + 18 * DAY, status: 'praying', visibility: 'private' },
    { title: 'Patience with the kids in the mornings', body: '', category: 'Family', createdAt: now - 5 * DAY, revisitAt: now + 9 * DAY, status: 'praying', visibility: 'private' },
    { title: 'A home closer to church', body: '', category: 'Provision', createdAt: now - 220 * DAY, revisitAt: now - 100 * DAY, status: 'answered', answeredAt: now - 90 * DAY, answerNote: 'The house on Kerk Street came up the week we had given up looking.', visibility: 'private' },
    { title: 'Reconciliation with my brother', body: '', category: 'Family', createdAt: now - 400 * DAY, revisitAt: now - 300 * DAY, status: 'differently', answeredAt: now - 280 * DAY, answerNote: 'Not the big conversation I wanted, but we braai together every month now.', visibility: 'private' },
    { title: 'Safe travels for the mission team', body: '', category: 'Church', createdAt: now - 30 * DAY, revisitAt: now - 15 * DAY, status: 'answered', answeredAt: now - 14 * DAY, answerNote: 'Everyone home safe, and 12 new believers in the village.', visibility: 'private' },
  ]);

  const circleId = (await db.circles.add({ name: 'Tuesday small group', members: ['Sarah', 'Thabo', 'Pieter', 'Lerato'], createdAt: now - 60 * DAY })) as number;
  const n1 = await createNeed({
    circleId,
    author: 'Sarah',
    title: 'Baby Noah arrived! Meals for the first week would be a huge help',
    detail: 'We are exhausted but so grateful. No nuts, please.',
    tasks: [newTask('meal', 'Bring a meal', 'Mon dinner'), newTask('meal', 'Bring a meal', 'Wed dinner'), newTask('errand', 'Run an errand', 'Groceries Thu')],
  });
  const need = await db.needs.get(n1);
  await db.needs.update(n1, { prayedBy: ['Thabo', 'Lerato'], tasks: need!.tasks.map((t, i) => (i === 0 ? { ...t, claimedBy: 'Thabo' } : t)) });
  await createNeed({ circleId, author: 'Pieter', title: 'Job interview on Friday', detail: '', tasks: [newTask('ride', 'Give a ride', 'Fri 8am, car in for service')] });

  const pactId = (await db.pacts.add({ partner: 'Johan', checkInDay: 4, questions: PACT_QUESTIONS, startedAt: now - 50 * DAY })) as number;
  await db.checkins.bulkAdd([
    {
      pactId,
      from: 'Johan',
      createdAt: now - 3 * DAY,
      answers: [
        { question: PACT_QUESTIONS[0], answer: 'Tired but hopeful. Work has been heavy.', shared: true },
        { question: PACT_QUESTIONS[5], answer: 'Pray that I lead my family well this week.', shared: true },
      ],
      commitment: 'Morning prayer before checking email',
      shareId: uid(),
    },
    {
      pactId,
      from: 'me',
      createdAt: now - 9 * DAY,
      answers: PACT_QUESTIONS.map((q, i) => ({ question: q, answer: i === 0 ? 'Grateful. God has been near.' : i === 1 ? 'In a conversation with a colleague about grief.' : '', shared: i !== 3 })),
      commitment: 'Phone out of the bedroom by 10pm',
      shareId: uid(),
    },
  ]);

  const sunday = now - new Date().getDay() * DAY - (new Date().getDay() < 2 ? 7 * DAY : 0);
  const mk = (s: Omit<Sermon, 'layout' | 'followUps' | 'createdAt' | 'shareId'>): Sermon => {
    const base = { ...s, layout: cloneLayout(themeById(s.theme).layout), createdAt: now, shareId: uid(), followUps: [] };
    return { ...base, followUps: buildFollowUps(base) };
  };
  const s1 = mk({
    title: 'The Good Shepherd',
    preacher: 'Ds. Marais',
    church: 'Moedergemeente',
    date: isoDate(sunday),
    passage: 'John 10:1–18',
    mainPoint: 'Jesus knows you by name and lays down his life for you. You are never an anonymous sheep.',
    notes: 'Shepherds in Israel led from the front; they did not drive from behind.\n\n“I am the good shepherd: the good shepherd giveth his life for the sheep.” (v.11)\n\nThe hireling runs when the wolf comes. Jesus stays.',
    questions: ['Where do you most need to hear the Shepherd’s voice right now?', 'Who in your life needs someone to stay rather than run?'],
    application: 'Spend ten minutes each morning listening before asking.',
    theme: 'shepherd',
    visibility: 'community',
  });
  s1.followUps[0] = { ...s1.followUps[0], response: 'He knows me by name, so I don’t have to earn my place.', doneAt: now - DAY };
  const s2 = mk({
    title: 'Sowing in Tears',
    preacher: 'Ps. Naidoo',
    church: 'Grace Fellowship',
    date: isoDate(sunday - 14 * DAY),
    passage: 'Psalm 126',
    mainPoint: 'God turns seasons of weeping into harvests of joy, but sowing still happens in the tears.',
    notes: '“They that sow in tears shall reap in joy.” (v.5)\n\nLament is not the opposite of faith; it is faith that keeps talking to God.',
    questions: ['What are you sowing in tears right now?'],
    application: 'Write a psalm of lament, honestly, and end it with one line of hope.',
    theme: 'harvest',
    visibility: 'community',
  });
  s2.followUps = s2.followUps.map((f) => ({ ...f, response: 'Done, and it helped more than I expected.', doneAt: f.dueAt + DAY }));
  await db.sermons.bulkAdd([s1, s2]);


  const entries: ObedienceEntry[] = [];
  for (const back of [1, 2, 3, 5, 6, 8, 9, 10, 13, 15]) {
    const d = now - back * DAY;
    if (await db.obedience.where('date').equals(isoDate(d)).first()) continue;
    entries.push({ date: isoDate(d), stepId: stepForDate(d).id, status: back === 6 ? 'skipped' : 'done', reflection: back === 1 ? 'Took my neighbour some soup. We talked for an hour.' : '', updatedAt: d });
  }
  await db.obedience.bulkAdd(entries);
}
