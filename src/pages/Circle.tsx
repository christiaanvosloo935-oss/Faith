import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import { db, type CheckIn, type CheckInAnswer, type Circle, type HelpTask, type Need, type Pact, type TaskKind } from '../db';
import { createNeed, newTask, shareCheckIn, shareNeed, shareResultMessage } from '../lib/actions';
import { DAY, formatDate, relativeDays, WEEKDAYS } from '../lib/dates';
import { uid } from '../lib/ids';
import { sendLink } from '../lib/share';
import { PACT_QUESTIONS } from '../data/scripture';
import { syncConfigured } from '../config';
import { checkInCreated, enableCircleSync, enablePactSync, inviteLink, leaveSpace, saveNeed } from '../sync/engine';
import { cancel, downloadIcs, reminderFor, schedule, toCalEvent } from '../lib/reminders';
import { SyncBadge } from '../components/SyncBadge';
import { Empty, PageHeader, Segmented, Sheet, Verse, VisibilityBadge, useMyName, useToast } from '../components/ui';
import { IconCheck, IconHand, IconLock, IconPlus, IconShare, IconTrash, IconUsers } from '../components/Icons';

type Tab = 'burdens' | 'pact';

export default function CirclePage() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'burdens';
  return (
    <div className="page">
      <PageHeader title="Circle" subtitle="Carry each other’s burdens, and walk closely with a friend." />
      <Segmented
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        options={[
          { value: 'burdens', label: 'Burdens' },
          { value: 'pact', label: 'Accountability' },
        ]}
      />
      {tab === 'burdens' ? <Burdens /> : <PactView />}
    </div>
  );
}

/* ───────────────────────── Burdens ───────────────────────── */

export const TASK_KINDS: Record<TaskKind, { label: string; emoji: string }> = {
  meal: { label: 'Bring a meal', emoji: '🍲' },
  ride: { label: 'Give a ride', emoji: '🚗' },
  childcare: { label: 'Childcare', emoji: '🧸' },
  visit: { label: 'Visit', emoji: '🏡' },
  errand: { label: 'Run an errand', emoji: '🛒' },
  other: { label: 'Something else', emoji: '🤲' },
};

function Burdens() {
  const circles = useLiveQuery(() => db.circles.toArray(), [], [] as Circle[]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingNeed, setAddingNeed] = useState(false);
  const active = circles.find((c) => c.id === activeId) ?? circles[0];
  const needs = useLiveQuery(() => (active?.id ? db.needs.where('circleId').equals(active.id).reverse().sortBy('createdAt') : []), [active?.id], [] as Need[]);
  const open = needs.filter((n) => !n.resolved);
  const resolved = needs.filter((n) => n.resolved);

  return (
    <div className="stack">
      <Verse compact reference="Galatians 6:2" text="Carry each other’s burdens, and in this way you will fulfill the law of Christ." />

      <div className="circle-switcher">
        {circles.map((c) => (
          <button key={c.id} className={`chip big ${active?.id === c.id ? 'on' : ''}`} onClick={() => setActiveId(c.id!)}>
            <IconUsers size={16} /> {c.name}
          </button>
        ))}
        <button className="chip big dashed" onClick={() => setCreating(true)}>
          <IconPlus size={16} /> New circle
        </button>
      </div>

      {!active ? (
        <Empty title="Start a circle">A circle is your small group, family or close friends: the people you share needs with and help in practical ways.</Empty>
      ) : (
        <>
          <div className="circle-head card flat">
            <div>
              <h2>
                {active.name} <SyncBadge synced={!!active.syncId} />
              </h2>
              <p className="meta">{active.members.length ? active.members.join(', ') : 'Just you so far'}</p>
            </div>
            <div className="actions wrap">
              <button className="btn primary" onClick={() => setAddingNeed(true)}>
                <IconPlus size={18} /> Share a need
              </button>
              {syncConfigured() && <InviteButton circle={active} />}
            </div>
          </div>
          <p className="muted small privacy-note">
            <IconLock size={13} />{' '}
            {active.syncId
              ? 'Live and end-to-end encrypted. Only people with your invite link can read this circle.'
              : 'Needs are stored on your phone. Send them to your circle with a link, or turn on live sync.'}
          </p>
          {open.length ? open.map((n) => <NeedCard key={n.id} need={n} />) : <Empty title="No open needs">When someone shares a need, it appears here so the circle can pray and help.</Empty>}
          {resolved.length > 0 && (
            <details className="resolved">
              <summary>Resolved ({resolved.length})</summary>
              {resolved.map((n) => (
                <NeedCard key={n.id} need={n} />
              ))}
            </details>
          )}
          <button
            className="btn ghost small danger"
            onClick={async () => {
              if (!confirm(`Delete the circle “${active.name}” and its needs from this device?`)) return;
              await leaveSpace('circle', active.id!);
              await db.needs.where('circleId').equals(active.id!).delete();
              await db.circles.delete(active.id!);
              setActiveId(null);
            }}
          >
            <IconTrash size={15} /> Delete circle
          </button>
        </>
      )}

      <Sheet open={creating} title="New circle" onClose={() => setCreating(false)}>
        <CircleForm
          onDone={(id) => {
            setCreating(false);
            if (id) setActiveId(id);
          }}
        />
      </Sheet>
      {active && (
        <Sheet open={addingNeed} title={`Share a need with ${active.name}`} onClose={() => setAddingNeed(false)}>
          <NeedForm circle={active} onDone={() => setAddingNeed(false)} />
        </Sheet>
      )}
    </div>
  );
}

function CircleForm({ onDone }: { onDone: (id?: number) => void }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState('');
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const id = await db.circles.add({
          name: name.trim(),
          members: members.split(',').map((m) => m.trim()).filter(Boolean),
          createdAt: Date.now(),
        });
        onDone(id as number);
      }}
    >
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tuesday small group" autoFocus required />
      </label>
      <label>
        Who’s in it? <span className="muted">(names, separated by commas)</span>
        <input value={members} onChange={(e) => setMembers(e.target.value)} placeholder="Sarah, Thabo, Pieter" />
      </label>
      <button className="btn primary block">Create circle</button>
    </form>
  );
}

function NeedForm({ circle, onDone }: { circle: Circle; onDone: () => void }) {
  const me = useMyName();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [tasks, setTasks] = useState<HelpTask[]>([]);
  const [kind, setKind] = useState<TaskKind>('meal');
  const [when, setWhen] = useState('');

  const addTask = () => {
    setTasks([...tasks, newTask(kind, TASK_KINDS[kind].label, when.trim() || undefined)]);
    setWhen('');
  };

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        const id = await createNeed({ circleId: circle.id!, author: me, title: title.trim(), detail: detail.trim(), tasks });
        const need = await db.needs.get(id);
        onDone();
        if (need && confirm('Send this need to your circle now?')) toast(shareResultMessage(await shareNeed(need, me)));
      }}
    >
      <label>
        What’s going on?
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mom is in hospital this week" autoFocus required />
      </label>
      <label>
        More detail <span className="muted">(optional)</span>
        <textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} />
      </label>
      <fieldset className="task-builder">
        <legend>Practical help that would bless you</legend>
        {tasks.map((t) => (
          <div key={t.id} className="task-row">
            <span>
              {TASK_KINDS[t.kind].emoji} {t.label}
              {t.when && <span className="muted"> · {t.when}</span>}
            </span>
            <button type="button" className="btn ghost small" onClick={() => setTasks(tasks.filter((x) => x.id !== t.id))} aria-label="Remove">
              ✕
            </button>
          </div>
        ))}
        <div className="row-add">
          <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)}>
            {Object.entries(TASK_KINDS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.emoji} {v.label}
              </option>
            ))}
          </select>
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When? e.g. Thu dinner" />
          <button type="button" className="btn small" onClick={addTask}>
            Add
          </button>
        </div>
      </fieldset>
      <button className="btn primary block">Share need</button>
    </form>
  );
}

function NeedCard({ need: n }: { need: Need }) {
  const me = useMyName();
  const toast = useToast();
  const prayed = n.prayedBy.includes(me);
  const update = (patch: Partial<Need>) => saveNeed(n.id!, patch);
  const setTask = (id: string, patch: Partial<HelpTask>) => saveNeed(n.id!, (cur) => ({ tasks: cur.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  return (
    <article className={`card need ${n.resolved ? 'is-resolved' : ''}`}>
      <div className="card-top">
        <span className="meta">
          {n.author === me ? 'You' : n.author} · {relativeDays(n.createdAt)}
        </span>
        <VisibilityBadge value="circle" />
      </div>
      <h3>{n.title}</h3>
      {n.detail && <p>{n.detail}</p>}

      {n.tasks.length > 0 && (
        <ul className="tasks">
          {n.tasks.map((t) => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <span className="task-label">
                {TASK_KINDS[t.kind].emoji} {t.label}
                {t.when && <small> · {t.when}</small>}
              </span>
              {t.claimedBy ? (
                <span className="task-claim">
                  <span className="claimed">{t.claimedBy === me ? 'You' : t.claimedBy}</span>
                  {t.claimedBy === me && !t.done && (
                    <>
                      <button className="btn small" onClick={() => setTask(t.id, { done: true })}>
                        <IconCheck size={14} /> Done
                      </button>
                      <button className="btn ghost small" onClick={() => setTask(t.id, { claimedBy: undefined })}>
                        Release
                      </button>
                    </>
                  )}
                  {t.done && <span className="chip ok">Done</span>}
                </span>
              ) : (
                <button className="btn small primary" onClick={() => setTask(t.id, { claimedBy: me })} disabled={n.resolved}>
                  I’ll do it
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="actions wrap">
        <button className={`btn small ${prayed ? 'prayed' : ''}`} onClick={() => saveNeed(n.id!, (cur) => ({ prayedBy: prayed ? cur.prayedBy.filter((x) => x !== me) : [...new Set([...cur.prayedBy, me])] }))}>
          <IconHand size={16} /> {prayed ? 'Prayed' : 'I prayed'} {n.prayedBy.length > 0 && <span className="count">{n.prayedBy.length}</span>}
        </button>
        <button className="btn small ghost" onClick={async () => toast(shareResultMessage(await shareNeed(n, me)))}>
          <IconShare size={16} /> Send to circle
        </button>
        <button className="btn small ghost" onClick={() => update({ resolved: !n.resolved })}>
          {n.resolved ? 'Reopen' : 'Mark resolved'}
        </button>
      </div>
      {n.prayedBy.length > 0 && <p className="meta small">Praying: {n.prayedBy.map((x) => (x === me ? 'you' : x)).join(', ')}</p>}
    </article>
  );
}

/* ───────────────────────── Accountability pact ───────────────────────── */

function PactView() {
  const pact = useLiveQuery(() => db.pacts.toCollection().first(), [], undefined as Pact | undefined);
  const checkins = useLiveQuery(() => (pact?.id ? db.checkins.where('pactId').equals(pact.id).reverse().sortBy('createdAt') : []), [pact?.id], [] as CheckIn[]);
  const [editing, setEditing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const me = useMyName();
  const toast = useToast();

  if (pact === undefined || editing)
    return (
      <div className="stack">
        <Verse compact reference="Ecclesiastes 4:9–10" text="Two are better than one, because they have a good return for their labor: If either of them falls down, one can help the other up." />
        <div className="card">
          <h2>{pact ? 'Edit your pact' : 'Make a pact with a friend'}</h2>
          <p className="muted">
            A pact between two people, built on grace. Once a week you each answer a few honest questions. You choose, answer by answer, what your partner sees. Nothing is
            tracked or reported.
          </p>
          <PactForm pact={pact} onDone={() => setEditing(false)} />
        </div>
      </div>
    );

  const mine = checkins.filter((c) => c.from === 'me');
  const theirs = checkins.filter((c) => c.from !== 'me');
  const lastMine = mine[0];
  const lastTheirs = theirs[0];
  const today = new Date().getDay();
  const dueMine = !lastMine || Date.now() - lastMine.createdAt > 6 * DAY;
  const quietPartner = lastTheirs ? Date.now() - lastTheirs.createdAt > 10 * DAY : Date.now() - pact.startedAt > 10 * DAY;

  return (
    <div className="stack">
      <div className="card pact-card">
        <div className="pact-pair">
          <span className="avatar">{me.slice(0, 1).toUpperCase()}</span>
          <span className="pact-link" aria-hidden />
          <span className="avatar alt">{pact.partner.slice(0, 1).toUpperCase()}</span>
        </div>
        <h2>
          You & {pact.partner} <SyncBadge synced={!!pact.syncId} />
        </h2>
        <p className="meta">
          Check-in day: {WEEKDAYS[pact.checkInDay]}
          {today === pact.checkInDay && ' (today)'} · since {formatDate(pact.startedAt)}
        </p>
        <div className="actions wrap center">
          <button className="btn primary" onClick={() => setCheckingIn(true)}>
            {dueMine ? 'Start this week’s check-in' : 'Check in again'}
          </button>
          <button className="btn ghost small" onClick={() => setEditing(true)}>
            Edit pact
          </button>
          <button className="btn ghost small" onClick={() => downloadIcs('weekly-check-in', [toCalEvent(reminderFor.pact(pact.checkInDay))])}>
            Add to calendar
          </button>
        </div>
        {syncConfigured() && <PactLive pact={pact} />}
      </div>

      {quietPartner && (
        <div className="callout gentle">
          <p>
            You haven’t heard from {pact.partner} in a while. A short note can mean a lot. <em>No guilt, just grace.</em>
          </p>
          <button
            className="btn small"
            onClick={async () => toast(shareResultMessage(await sendLink('Thinking of you', `Hey ${pact.partner}, I was thinking of you and praying for you this week. How’s your soul?`, location.origin)))}
          >
            Send a gentle nudge
          </button>
        </div>
      )}

      {lastTheirs && (
        <section>
          <h2 className="section-title">From {pact.partner}</h2>
          <CheckInCard c={lastTheirs} title={`${pact.partner}, ${relativeDays(lastTheirs.createdAt)}`} />
        </section>
      )}

      <section>
        <h2 className="section-title">Your check-ins</h2>
        {mine.length ? (
          mine.map((c) => <CheckInCard key={c.id} c={c} title={formatDate(c.createdAt)} mine partner={pact.partner} />)
        ) : (
          <Empty title="No check-ins yet">Your first check-in takes about five minutes.</Empty>
        )}
      </section>

      {theirs.length > 1 && (
        <details className="resolved">
          <summary>Earlier from {pact.partner} ({theirs.length - 1})</summary>
          {theirs.slice(1).map((c) => (
            <CheckInCard key={c.id} c={c} title={formatDate(c.createdAt)} />
          ))}
        </details>
      )}

      <Sheet open={checkingIn} title="Weekly check-in" onClose={() => setCheckingIn(false)}>
        <CheckInForm pact={pact} lastCommitment={lastMine?.commitment} onDone={() => setCheckingIn(false)} />
      </Sheet>
    </div>
  );
}

function PactForm({ pact, onDone }: { pact?: Pact; onDone: () => void }) {
  const [partner, setPartner] = useState(pact?.partner ?? '');
  const [day, setDay] = useState(pact?.checkInDay ?? 0);
  const [questions, setQuestions] = useState<string[]>(pact?.questions ?? PACT_QUESTIONS);
  const [custom, setCustom] = useState('');
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!partner.trim() || !questions.length) return;
        if (pact?.id) await db.pacts.update(pact.id, { partner: partner.trim(), checkInDay: day, questions });
        else await db.pacts.add({ partner: partner.trim(), checkInDay: day, questions, startedAt: Date.now() });
        void schedule(reminderFor.pact(day));
        onDone();
      }}
    >
      <div className="row2">
        <label>
          Partner’s name
          <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="e.g. Johan" required />
        </label>
        <label>
          Check-in day
          <select value={day} onChange={(e) => setDay(Number(e.target.value))}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend>Your questions</legend>
        <p className="muted small">Inspired by John Wesley’s class meetings. Keep the ones that help, and add your own.</p>
        {[...new Set([...PACT_QUESTIONS, ...questions])].map((q) => (
          <label key={q} className="check">
            <input type="checkbox" checked={questions.includes(q)} onChange={(e) => setQuestions(e.target.checked ? [...questions, q] : questions.filter((x) => x !== q))} />
            {q}
          </label>
        ))}
        <div className="row-add">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add your own question" />
          <button
            type="button"
            className="btn small"
            onClick={() => {
              if (custom.trim()) setQuestions([...questions, custom.trim()]);
              setCustom('');
            }}
          >
            Add
          </button>
        </div>
      </fieldset>
      <button className="btn primary block">{pact ? 'Save pact' : 'Begin pact'}</button>
      {pact?.id && (
        <button
          type="button"
          className="btn ghost small danger"
          onClick={async () => {
            if (!confirm('End this pact and delete all check-ins on this device?')) return;
            await leaveSpace('pact', pact.id!);
            void cancel('pact-weekly');
            await db.checkins.where('pactId').equals(pact.id!).delete();
            await db.pacts.delete(pact.id!);
            onDone();
          }}
        >
          End pact
        </button>
      )}
    </form>
  );
}

function CheckInForm({ pact, lastCommitment, onDone }: { pact: Pact; lastCommitment?: string; onDone: () => void }) {
  const me = useMyName();
  const toast = useToast();
  const [answers, setAnswers] = useState<CheckInAnswer[]>(() => pact.questions.map((q) => ({ question: q, answer: '', shared: !/hidden/i.test(q) })));
  const [commitment, setCommitment] = useState('');
  const set = (i: number, patch: Partial<CheckInAnswer>) => setAnswers(answers.map((a, j) => (j === i ? { ...a, ...patch } : a)));

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        const c: CheckIn = { pactId: pact.id!, from: 'me', createdAt: Date.now(), answers, commitment: commitment.trim(), shareId: uid() };
        const id = (await db.checkins.add(c)) as number;
        onDone();
        if (pact.syncId) {
          await checkInCreated(id);
          toast(`Saved. Your shared answers are on their way to ${pact.partner}`);
        } else if (answers.some((a) => a.shared && a.answer.trim()) || c.commitment) {
          if (confirm(`Send the answers you marked as shared to ${pact.partner}?`)) toast(shareResultMessage(await shareCheckIn(c, me)));
        } else toast('Check-in saved privately');
      }}
    >
      {lastCommitment && (
        <div className="callout">
          <p className="small">
            Last week you committed to: <strong>{lastCommitment}</strong>
          </p>
        </div>
      )}
      {answers.map((a, i) => (
        <div key={a.question} className="qa">
          <label>
            {a.question}
            <textarea rows={2} value={a.answer} onChange={(e) => set(i, { answer: e.target.value })} />
          </label>
          <button type="button" className={`share-toggle ${a.shared ? 'on' : ''}`} onClick={() => set(i, { shared: !a.shared })} aria-pressed={a.shared}>
            {a.shared ? (
              <>
                <IconUsers size={14} /> {pact.partner} will see this
              </>
            ) : (
              <>
                <IconLock size={14} /> Only you
              </>
            )}
          </button>
        </div>
      ))}
      <label>
        One commitment for this week <span className="muted">(shared)</span>
        <input value={commitment} onChange={(e) => setCommitment(e.target.value)} placeholder="e.g. Phone out of the bedroom by 10pm" />
      </label>
      <button className="btn primary block">Save check-in</button>
    </form>
  );
}

function CheckInCard({ c, title, mine, partner }: { c: CheckIn; title: string; mine?: boolean; partner?: string }) {
  const me = useMyName();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [c.id]);
  const answered = c.answers.filter((a) => a.answer.trim());
  return (
    <article className="card checkin">
      <button className="card-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <h3>{title}</h3>
        {c.commitment && <p className="meta">Commitment: {c.commitment}</p>}
      </button>
      {open && (
        <div className="card-more">
          {answered.map((a) => (
            <div key={a.question} className="qa-read">
              <p className="q">
                {a.question} {mine && !a.shared && <IconLock size={12} />}
              </p>
              <p>{a.answer}</p>
            </div>
          ))}
          {mine && (
            <div className="actions">
              <button className="btn small" onClick={async () => toast(shareResultMessage(await shareCheckIn(c, me)))}>
                <IconShare size={15} /> Send to {partner}
              </button>
              <button className="btn ghost small danger" onClick={() => confirm('Delete this check-in?') && db.checkins.delete(c.id!)}>
                <IconTrash size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ───────────────────────── Live sync controls ───────────────────────── */

function InviteButton({ circle }: { circle: Circle }) {
  const me = useMyName();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const invite = async () => {
    setBusy(true);
    try {
      const link = circle.syncId ? inviteLink('circle', circle.syncId, circle.key!) : await enableCircleSync(circle);
      toast(shareResultMessage(await sendLink(`Join ${circle.name}`, `${me} invited you to “${circle.name}” on Faith, to pray and help each other. Tap to join:`, link)));
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button className="btn" onClick={invite} disabled={busy}>
      <IconShare size={16} /> {busy ? 'Setting up…' : circle.syncId ? 'Invite people' : 'Go live & invite'}
    </button>
  );
}

function PactLive({ pact }: { pact: Pact }) {
  const me = useMyName();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (pact.syncId)
    return (
      <p className="muted small">
        Connected live with {pact.partner}. Shared answers arrive on their phone automatically.{' '}
        <button className="linkish" onClick={async () => toast(shareResultMessage(await sendLink('Our pact', `Join our accountability pact on Faith:`, inviteLink('pact', pact.syncId!, pact.key!))))}>
          Resend invite
        </button>
      </p>
    );
  return (
    <div className="callout">
      <p className="small">Connect live, so check-ins arrive on {pact.partner}’s phone automatically. End-to-end encrypted.</p>
      <button
        className="btn small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const link = await enablePactSync(pact);
            toast(shareResultMessage(await sendLink('Our pact', `${me} invited you to an accountability pact on Faith. Tap to join:`, link)));
          } catch (e) {
            toast((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Setting up…' : `Invite ${pact.partner} to connect`}
      </button>
    </div>
  );
}
