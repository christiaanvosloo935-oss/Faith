import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db, type Sermon, type Visibility } from '../db';
import { isoDate } from '../lib/dates';
import { uid } from '../lib/ids';
import { buildFollowUps, rebuildFollowUps } from '../lib/logic';
import { cloneLayout, paletteById, SERMON_THEMES, themeById } from '../data/sermonThemes';
import { PageHeader, VisibilityPicker } from '../components/ui';
import { MotifPattern } from '../components/Decor';

const blank = (): Omit<Sermon, 'layout' | 'followUps'> => ({
  title: '',
  preacher: '',
  church: '',
  date: isoDate(new Date().getDay() === 0 ? new Date() : Date.now() - new Date().getDay() * 864e5),
  passage: '',
  mainPoint: '',
  notes: '',
  questions: [],
  application: '',
  theme: 'shepherd',
  visibility: 'community',
  createdAt: Date.now(),
  shareId: uid(),
});

export default function SermonEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [s, setS] = useState<Sermon | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!id) {
      const b = blank();
      setS({ ...b, layout: cloneLayout(themeById(b.theme).layout), followUps: [] });
    } else db.sermons.get(Number(id)).then((x) => setS(x ?? null));
  }, [id]);

  if (!s) return <div className="page" />;
  const set = (patch: Partial<Sermon>) => setS({ ...s, ...patch });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s.title.trim()) return;
    const questions = q.trim() ? [...s.questions, q.trim()] : s.questions;
    const next = { ...s, questions };
    next.followUps = id ? rebuildFollowUps(next) : buildFollowUps(next);
    const newId = id ? (await db.sermons.put(next), Number(id)) : await db.sermons.add(next);
    nav(`/sermons/${newId}`, { replace: true });
  };

  return (
    <div className="page">
      <PageHeader title={id ? 'Edit notes' : 'Sermon notes'} subtitle="Write what you hear. You’ll come back to it during the week." />
      <form className="form card" onSubmit={save}>
        <label>
          Sermon title
          <input value={s.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. The Good Shepherd" required autoFocus={!id} />
        </label>
        <div className="row3">
          <label>
            Preacher
            <input value={s.preacher} onChange={(e) => set({ preacher: e.target.value })} />
          </label>
          <label>
            Church
            <input value={s.church} onChange={(e) => set({ church: e.target.value })} />
          </label>
          <label>
            Date
            <input type="date" value={s.date} onChange={(e) => set({ date: e.target.value })} required />
          </label>
        </div>
        <label>
          Passage
          <input value={s.passage} onChange={(e) => set({ passage: e.target.value })} placeholder="e.g. John 10:1–18" />
        </label>
        <label>
          The main point, in one sentence
          <input value={s.mainPoint} onChange={(e) => set({ mainPoint: e.target.value })} placeholder="What’s the one thing to remember?" />
        </label>
        <label>
          Notes
          <textarea rows={8} value={s.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Points, quotes, illustrations, what stood out…" />
        </label>
        <fieldset>
          <legend>Discussion questions for your group</legend>
          {s.questions.map((x, i) => (
            <div key={i} className="task-row">
              <span>{x}</span>
              <button type="button" className="btn ghost small" onClick={() => set({ questions: s.questions.filter((_, j) => j !== i) })} aria-label="Remove question">
                ✕
              </button>
            </div>
          ))}
          <div className="row-add">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Add a question"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (q.trim()) set({ questions: [...s.questions, q.trim()] });
                  setQ('');
                }
              }}
            />
            <button
              type="button"
              className="btn small"
              onClick={() => {
                if (q.trim()) set({ questions: [...s.questions, q.trim()] });
                setQ('');
              }}
            >
              Add
            </button>
          </div>
        </fieldset>
        <label>
          Your step this week
          <input value={s.application} onChange={(e) => set({ application: e.target.value })} placeholder="e.g. Call my brother and apologise" />
        </label>

        <fieldset>
          <legend>Theme</legend>
          <p className="muted small">Each theme sets its own page layout, colours and decoration. You can fine-tune everything after saving.</p>
          <div className="theme-grid">
            {SERMON_THEMES.map((t) => {
              const pal = paletteById(t.layout.palette).light;
              return (
                <button
                  type="button"
                  key={t.id}
                  className={`theme-card ${s.theme === t.id ? 'on' : ''}`}
                  style={{ background: pal[0], color: pal[2], borderColor: s.theme === t.id ? pal[3] : 'transparent' }}
                  onClick={() => set({ theme: t.id, layout: cloneLayout(t.layout) })}
                >
                  <span className="theme-motif">
                    <MotifPattern motif={t.layout.motif} color={pal[3]} />
                  </span>
                  <strong>{t.label}</strong>
                  <small>{t.description}</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <VisibilityPicker value={s.visibility} onChange={(v: Visibility) => set({ visibility: v })} options={['private', 'community']} />

        <div className="actions">
          <button type="button" className="btn ghost" onClick={() => nav(-1)}>
            Cancel
          </button>
          <button className="btn primary">Save notes</button>
        </div>
      </form>
    </div>
  );
}
