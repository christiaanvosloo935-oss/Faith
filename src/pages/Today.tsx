import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { db, type CheckIn, type Need, type Pact, type Prayer, type Sermon } from '../db';
import { DAY, formatDate, greeting, isoDate, WEEKDAYS } from '../lib/dates';
import { dueFollowUps, prayersToRevisit, stepForDate } from '../lib/logic';
import { Verse, useMyName } from '../components/ui';
import { Leaf, Sprig, VineDivider } from '../components/Decor';
import { IconCircle, IconPrayer, IconSermon, IconWalk } from '../components/Icons';

function plural(n: number, word: string, none?: string) {
  if (n === 0 && none) return none;
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export default function Today() {
  const me = useMyName();
  const step = stepForDate();
  const today = isoDate();
  const prayers = useLiveQuery(() => db.prayers.toArray(), [], [] as Prayer[]);
  const sermons = useLiveQuery(() => db.sermons.toArray(), [], [] as Sermon[]);
  const needs = useLiveQuery(() => db.needs.filter((n) => !n.resolved).toArray(), [], [] as Need[]);
  const entry = useLiveQuery(() => db.obedience.where('date').equals(today).first(), [today]);
  const pact = useLiveQuery(() => db.pacts.toCollection().first(), [], undefined as Pact | undefined);
  const lastCheckIn = useLiveQuery(
    async () => (pact?.id ? (await db.checkins.where('pactId').equals(pact.id).filter((c) => c.from === 'me').sortBy('createdAt')).pop() : undefined),
    [pact?.id],
    undefined as CheckIn | undefined,
  );
  const named = useLiveQuery(() => db.settings.get('name'), []);

  const revisit = prayersToRevisit(prayers);
  const followUps = dueFollowUps(sermons);
  const openTasks = needs.flatMap((n) => n.tasks.filter((t) => !t.claimedBy).map((t) => ({ n, t })));
  const checkInDue = pact && (!lastCheckIn || Date.now() - lastCheckIn.createdAt > 6 * DAY);
  const answeredCount = prayers.filter((p) => p.status !== 'praying').length;

  return (
    <div className="page today">
      <section className="hero">
        <Sprig width={140} className="hero-sprig left" />
        <Sprig width={140} className="hero-sprig right" flip />
        <p className="eyebrow">{formatDate(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1>
          {greeting()}
          {me !== 'Me' ? `, ${me}` : ''}
        </h1>
        <Verse reference={step.reference} text={step.text} />
      </section>

      {named === undefined ? null : !named && <Welcome />}

      <div className="today-grid">
        <Link to="/walk" className="card today-card">
          <span className="today-icon">
            <IconWalk />
          </span>
          <div>
            <p className="eyebrow">Today’s step</p>
            <h3>{step.action}</h3>
            <p className="meta">{entry?.status === 'done' ? '✓ Lived out today' : entry?.status === 'skipped' ? 'Skipped. That’s okay.' : 'Tap when you’ve done it'}</p>
          </div>
        </Link>

        <Link to={revisit.length ? '/prayer?tab=lookback' : '/prayer'} className="card today-card">
          <span className="today-icon">
            <IconPrayer />
          </span>
          <div>
            <p className="eyebrow">Answered</p>
            {revisit.length ? (
              <>
                <h3>
                  {revisit.length} {revisit.length === 1 ? 'prayer is' : 'prayers are'} ready to look back on
                </h3>
                <p className="meta">“{revisit[0].title}”: did anything happen?</p>
              </>
            ) : (
              <>
                <h3>{plural(prayers.filter((p) => p.status === 'praying').length, 'prayer', 'No prayers yet')}{prayers.some((p) => p.status === 'praying') ? ' on your heart' : ''}</h3>
                <p className="meta">{answeredCount ? `${plural(answeredCount, 'stone')} of remembrance so far` : 'Write your first prayer'}</p>
              </>
            )}
          </div>
        </Link>

        {followUps.length > 0 && (
          <Link to={`/sermons/${followUps[0].sermon.id}#followUps`} className="card today-card">
            <span className="today-icon">
              <IconSermon />
            </span>
            <div>
              <p className="eyebrow">Sermon follow-through</p>
              <h3>{followUps[0].sermon.title}</h3>
              <p className="meta">{followUps[0].followUp.prompt}</p>
            </div>
          </Link>
        )}

        {(needs.length > 0 || checkInDue) && (
          <Link to={checkInDue && !needs.length ? '/circle?tab=pact' : '/circle'} className="card today-card">
            <span className="today-icon">
              <IconCircle />
            </span>
            <div>
              <p className="eyebrow">Circle</p>
              {needs.length > 0 && (
                <h3>
                  {needs.length} open {needs.length === 1 ? 'need' : 'needs'}
                  {openTasks.length > 0 && ` · ${openTasks.length} ways to help`}
                </h3>
              )}
              {openTasks[0] && (
                <p className="meta">
                  {openTasks[0].t.label} for {openTasks[0].n.author}
                  {openTasks[0].t.when && ` (${openTasks[0].t.when})`}
                </p>
              )}
              {checkInDue && <p className="meta">Weekly check-in with {pact!.partner} is due{new Date().getDay() === pact!.checkInDay ? ' today' : ` (${WEEKDAYS[pact!.checkInDay]}s)`}</p>}
            </div>
          </Link>
        )}
      </div>

      <VineDivider />
      <p className="closing">
        <Leaf size={14} color="var(--leaf)" /> Everything here is stored on your device. You decide what to share.
      </p>
    </div>
  );
}

function Welcome() {
  const [name, setName] = useState('');
  return (
    <form
      className="card welcome"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) db.settings.put({ key: 'name', value: name.trim() });
      }}
    >
      <h2>Welcome to Faith</h2>
      <p className="muted">
        A quiet place to pray, remember, and live out the Word with the people you love. No account needed. Your prayers stay on this phone.
      </p>
      <label>
        What should your circle call you?
        <div className="row-add">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
          <button className="btn primary">Begin</button>
        </div>
      </label>
    </form>
  );
}
