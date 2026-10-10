import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db, type Prayer, type PrayerStatus, type Visibility } from '../db';
import { DAY, formatDate, relativeDays } from '../lib/dates';
import { prayersToRevisit, REVISIT_OPTIONS } from '../lib/logic';
import { createNeed } from '../lib/actions';
import { cancel, downloadIcs, reminderFor, schedule, toCalEvent } from '../lib/reminders';
import { PRAYER_CATEGORIES } from '../data/scripture';
import { Empty, PageHeader, Segmented, Sheet, Verse, VisibilityBadge, VisibilityPicker, useMyName, useToast } from '../components/ui';
import { IconPlus, IconTrash } from '../components/Icons';
import { VineDivider } from '../components/Decor';

type Tab = 'praying' | 'lookback' | 'stones';

export default function Prayers() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'praying';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const [composing, setComposing] = useState(false);
  const prayers = useLiveQuery(() => db.prayers.orderBy('createdAt').reverse().toArray(), [], [] as Prayer[]);
  const due = prayersToRevisit(prayers);
  const praying = prayers.filter((p) => p.status === 'praying');
  const answered = prayers.filter((p) => p.status !== 'praying').sort((a, b) => (b.answeredAt ?? 0) - (a.answeredAt ?? 0));

  return (
    <div className="page">
      <PageHeader
        title="Answered"
        subtitle="Pray, then look back and remember what God has done."
        action={
          <button className="btn primary" onClick={() => setComposing(true)}>
            <IconPlus size={18} /> New prayer
          </button>
        }
      />

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'praying', label: `Praying (${praying.length})` },
          { value: 'lookback', label: <>Look back {due.length > 0 && <span className="dot-count">{due.length}</span>}</> },
          { value: 'stones', label: `Remembrance (${answered.length})` },
        ]}
      />

      {tab === 'praying' &&
        (praying.length ? (
          <div className="stack">
            {praying.map((p) => (
              <PrayerCard key={p.id} prayer={p} />
            ))}
          </div>
        ) : (
          <Empty title="Nothing on your heart yet?">Write a prayer. It stays on this device unless you choose to share it.</Empty>
        ))}

      {tab === 'lookback' &&
        (due.length ? (
          <div className="stack">
            <p className="muted">These prayers are ready to look back on. Take a moment before you answer.</p>
            {due.map((p) => (
              <LookBackCard key={p.id} prayer={p} />
            ))}
          </div>
        ) : (
          <Empty title="Nothing to look back on yet">When a prayer’s revisit date arrives, it appears here so you can notice how God answered.</Empty>
        ))}

      {tab === 'stones' && <Stones answered={answered} />}

      <Sheet open={composing} title="New prayer" onClose={() => setComposing(false)}>
        <PrayerForm onDone={() => setComposing(false)} />
      </Sheet>
    </div>
  );
}

function PrayerForm({ onDone }: { onDone: () => void }) {
  const me = useMyName();
  const toast = useToast();
  const circles = useLiveQuery(() => db.circles.toArray(), [], []);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Family');
  const [revisit, setRevisit] = useState(30);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [circleId, setCircleId] = useState<number | ''>('');
  const [summary, setSummary] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const now = Date.now();
    const p: Prayer = { title: title.trim(), body: body.trim(), category, createdAt: now, revisitAt: now + revisit * DAY, status: 'praying', visibility };
    if (visibility === 'circle') {
      if (!circleId) return toast('Choose a circle to share with');
      p.circleId = circleId;
      p.sharedSummary = summary.trim() || title.trim();
      await createNeed({ circleId, author: me, title: p.sharedSummary, detail: '', tasks: [] });
    }
    await db.prayers.add(p);
    void schedule(reminderFor.prayer(p.createdAt, p.revisitAt));
    toast(visibility === 'circle' ? 'Prayer saved, and the short version was shared with your circle' : 'Prayer saved on this device');
    onDone();
  };

  return (
    <form className="form" onSubmit={save}>
      <label>
        What are you praying for?
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wisdom about the new job" autoFocus required />
      </label>
      <label>
        Pour out your heart <span className="muted">(optional)</span>
        <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write it as a prayer…" />
      </label>
      <div className="row2">
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {PRAYER_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Look back in
          <select value={revisit} onChange={(e) => setRevisit(Number(e.target.value))}>
            {REVISIT_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <VisibilityPicker value={visibility} onChange={setVisibility} options={['private', 'circle']} />
      {visibility === 'circle' && (
        <div className="callout">
          {circles.length === 0 ? (
            <p>You don’t have a circle yet. Create one in the Circle tab first.</p>
          ) : (
            <>
              <label>
                Share with
                <select value={circleId} onChange={(e) => setCircleId(e.target.value ? Number(e.target.value) : '')} required>
                  <option value="">Choose a circle…</option>
                  {circles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                What your circle will see
                <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={title || 'A short line, e.g. “Pray for my job situation”'} />
              </label>
              <p className="muted small">Your full prayer stays private. Only this one line is shared.</p>
            </>
          )}
        </div>
      )}
      <button className="btn primary block" type="submit">
        Save prayer
      </button>
    </form>
  );
}

function PrayerCard({ prayer: p }: { prayer: Prayer }) {
  const [open, setOpen] = useState(false);
  const [answering, setAnswering] = useState(false);
  return (
    <article className="card prayer-card">
      <button className="card-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div className="card-top">
          <span className="chip">{p.category}</span>
          <VisibilityBadge value={p.visibility} />
        </div>
        <h3>{p.title}</h3>
        <p className="meta">
          Prayed since {formatDate(p.createdAt)} · look back {relativeDays(p.revisitAt)}
        </p>
      </button>
      {open && (
        <div className="card-more">
          {p.body && <p className="prayer-body">{p.body}</p>}
          {p.visibility === 'circle' && p.sharedSummary && <p className="muted small">Your circle sees: “{p.sharedSummary}”</p>}
          <div className="actions">
            <button className="btn primary small" onClick={() => setAnswering(true)}>
              It was answered
            </button>
            <button className="btn ghost small" onClick={() => downloadIcs('prayer-look-back', [toCalEvent(reminderFor.prayer(p.createdAt, p.revisitAt))])}>
              Add look-back to calendar
            </button>
            <button
              className="btn ghost small danger"
              onClick={() => {
                if (!confirm('Delete this prayer? This cannot be undone.')) return;
                void cancel(`prayer-${p.createdAt}`);
                void db.prayers.delete(p.id!);
              }}
              aria-label="Delete prayer"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      )}
      <Sheet open={answering} title="How was it answered?" onClose={() => setAnswering(false)}>
        <AnswerForm prayer={p} onDone={() => setAnswering(false)} />
      </Sheet>
    </article>
  );
}

function AnswerForm({ prayer, onDone, initial = 'answered' }: { prayer: Prayer; onDone: () => void; initial?: PrayerStatus }) {
  const toast = useToast();
  const [status, setStatus] = useState<PrayerStatus>(initial);
  const [note, setNote] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.prayers.update(prayer.id!, { status, answerNote: note.trim(), answeredAt: Date.now() });
    void cancel(`prayer-${prayer.createdAt}`);
    toast('A new stone of remembrance');
    onDone();
  };
  return (
    <form className="form" onSubmit={save}>
      <p className="muted">“{prayer.title}”</p>
      <Segmented
        value={status}
        onChange={setStatus}
        options={[
          { value: 'answered', label: 'Answered' },
          { value: 'differently', label: 'Answered differently' },
        ]}
      />
      <label>
        What happened?
        <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write it down so you remember…" autoFocus />
      </label>
      <button className="btn primary block">Add to remembrance</button>
    </form>
  );
}

function LookBackCard({ prayer: p }: { prayer: Prayer }) {
  const [answering, setAnswering] = useState<PrayerStatus | null>(null);
  const snooze = async (days: number) => {
    const revisitAt = Date.now() + days * DAY;
    await db.prayers.update(p.id!, { revisitAt });
    void schedule(reminderFor.prayer(p.createdAt, revisitAt));
  };
  return (
    <article className="card lookback">
      <p className="eyebrow">You started praying this {relativeDays(p.createdAt)}</p>
      <h3>{p.title}</h3>
      {p.body && <p className="prayer-body">{p.body}</p>}
      <p className="question">Did anything happen?</p>
      <div className="actions wrap">
        <button className="btn primary small" onClick={() => setAnswering('answered')}>
          Yes, it was answered
        </button>
        <button className="btn small" onClick={() => setAnswering('differently')}>
          Answered differently
        </button>
        <select className="btn small" value="" onChange={(e) => e.target.value && snooze(Number(e.target.value))} aria-label="Keep praying">
          <option value="">Keep praying…</option>
          {REVISIT_OPTIONS.map((o) => (
            <option key={o.days} value={o.days}>
              Look again in {o.label}
            </option>
          ))}
        </select>
      </div>
      <Sheet open={!!answering} title="How was it answered?" onClose={() => setAnswering(null)}>
        {answering && <AnswerForm prayer={p} initial={answering} onDone={() => setAnswering(null)} />}
      </Sheet>
    </article>
  );
}

function Stones({ answered }: { answered: Prayer[] }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? answered.filter((p) => `${p.title} ${p.body} ${p.answerNote} ${p.category}`.toLowerCase().includes(s)) : answered;
  }, [answered, q]);
  const byYear = useMemo(() => {
    const m = new Map<number, Prayer[]>();
    for (const p of filtered) {
      const y = new Date(p.answeredAt ?? p.createdAt).getFullYear();
      m.set(y, [...(m.get(y) ?? []), p]);
    }
    return [...m.entries()];
  }, [filtered]);

  if (!answered.length)
    return (
      <Empty title="Your stones of remembrance">
        When a prayer is answered, it becomes a stone here: a record of God’s faithfulness to come back to when you have doubts.
      </Empty>
    );

  return (
    <div className="stones">
      <Verse
        compact
        reference="Joshua 4:6"
        text="That this may be a sign among you, that when your children ask their fathers in time to come, saying, What mean ye by these stones?"
      />
      <p className="stones-count">
        <strong>{answered.length}</strong> {answered.length === 1 ? 'prayer' : 'prayers'} answered
      </p>
      <input className="search" type="search" placeholder="Search your remembrance…" value={q} onChange={(e) => setQ(e.target.value)} />
      {byYear.map(([year, list]) => (
        <section key={year}>
          <VineDivider />
          <h2 className="year">{year}</h2>
          <ol className="timeline">
            {list.map((p) => (
              <li key={p.id} className="stone">
                <span className="stone-mark" aria-hidden />
                <div>
                  <p className="meta">
                    {formatDate(p.answeredAt ?? p.createdAt)} · prayed {Math.max(1, Math.round(((p.answeredAt ?? p.createdAt) - p.createdAt) / DAY))} days
                    {p.status === 'differently' && ' · answered differently'}
                  </p>
                  <h3>{p.title}</h3>
                  {p.answerNote && <p className="answer-note">{p.answerNote}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
