import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ObedienceEntry } from '../db';
import { DAY, formatDate, isoDate, parseIsoDate } from '../lib/dates';
import { livedOutStreak, stepById, stepForDate } from '../lib/logic';
import { Empty, PageHeader, Verse, VisibilityBadge, useToast } from '../components/ui';
import { Leaf, VineDivider } from '../components/Decor';

export default function Walk() {
  const toast = useToast();
  const today = isoDate();
  const step = stepForDate();
  const entries = useLiveQuery(() => db.obedience.orderBy('date').reverse().toArray(), [], [] as ObedienceEntry[]);
  const entry = entries.find((e) => e.date === today);
  const [reflection, setReflection] = useState<string | null>(null);
  const done = entries.filter((e) => e.status === 'done');
  const streak = livedOutStreak(done.map((e) => e.date));

  const save = async (status: ObedienceEntry['status'], text = entry?.reflection ?? '') => {
    const row: ObedienceEntry = { date: today, stepId: step.id, status, reflection: text, updatedAt: Date.now() };
    if (entry?.id) await db.obedience.update(entry.id, row);
    else await db.obedience.add(row);
  };

  const last28 = Array.from({ length: 28 }, (_, i) => isoDate(Date.now() - (27 - i) * DAY));
  const byDate = new Map(entries.map((e) => [e.date, e]));

  return (
    <div className="page">
      <PageHeader title="Walk" subtitle="Not chapters read, but Scripture lived out." />

      <article className="card hero-step">
        <div className="card-top">
          <p className="eyebrow">Today’s step · {formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <VisibilityBadge value="private" />
        </div>
        <Verse reference={step.reference} text={step.text} />
        <VineDivider />
        <p className="step-action">{step.action}</p>

        {!entry || entry.status === 'pending' ? (
          <div className="actions wrap center">
            <button
              className="btn primary"
              onClick={async () => {
                await save('done');
                setReflection('');
                toast('Well done, good and faithful servant');
              }}
            >
              I did it
            </button>
            <button className="btn" onClick={() => save('pending')} disabled={entry?.status === 'pending'}>
              {entry?.status === 'pending' ? 'Planned for today' : 'I’ll do it today'}
            </button>
            <button className="btn ghost" onClick={() => save('skipped')}>
              Not today
            </button>
          </div>
        ) : (
          <div className="step-status">
            {entry.status === 'done' ? (
              <p className="done-msg">
                <Leaf size={18} color="var(--leaf)" /> Lived out today
              </p>
            ) : (
              <p className="muted">Skipped today. Tomorrow brings new mercies.</p>
            )}
            <button className="btn ghost small" onClick={() => save('pending')}>
              Change
            </button>
          </div>
        )}

        {entry?.status === 'done' && (
          <div className="reflection">
            {reflection === null && entry.reflection ? (
              <>
                <p className="q">What happened</p>
                <p>{entry.reflection}</p>
                <button className="btn ghost small" onClick={() => setReflection(entry.reflection)}>
                  Edit
                </button>
              </>
            ) : (
              <form
                className="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await save('done', reflection ?? '');
                  setReflection(null);
                }}
              >
                <label>
                  What happened when you did it?
                  <textarea rows={3} value={reflection ?? ''} onChange={(e) => setReflection(e.target.value)} placeholder="Who was there? How did it feel? What did God show you?" />
                </label>
                <button className="btn small primary">Save reflection</button>
              </form>
            )}
          </div>
        )}
      </article>

      <section className="stats">
        <div className="stat">
          <strong>{done.length}</strong>
          <span>steps lived out</span>
        </div>
        <div className="stat">
          <strong>{streak}</strong>
          <span>days in a row</span>
        </div>
      </section>

      <section>
        <h2 className="section-title">Last four weeks</h2>
        <div className="garden" aria-label="Last 28 days">
          {last28.map((d) => {
            const e = byDate.get(d);
            const s = e?.status ?? 'none';
            return (
              <span key={d} className={`plot ${s}`} title={`${formatDate(d)}: ${s === 'none' ? 'no entry' : s}`}>
                {s === 'done' && <Leaf size={16} color="var(--leaf)" />}
              </span>
            );
          })}
        </div>
        <p className="muted small">Each leaf is a day you lived out the Word.</p>
      </section>

      <section>
        <h2 className="section-title">Your journey</h2>
        {done.length ? (
          <ol className="timeline">
            {done.map((e) => {
              const s = stepById(e.stepId);
              return (
                <li key={e.id} className="stone">
                  <span className="stone-mark leaf" aria-hidden />
                  <div>
                    <p className="meta">
                      {formatDate(parseIsoDate(e.date).getTime())} · {s?.reference}
                    </p>
                    <h3>{s?.action}</h3>
                    {e.reflection && <p className="answer-note">{e.reflection}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <Empty title="Your first step is above">Every small act of obedience is recorded here.</Empty>
        )}
      </section>
    </div>
  );
}
