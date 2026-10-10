import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type FollowUp, type SectionKey, type Sermon, type SermonLayout } from '../db';
import { formatDate, relativeDays } from '../lib/dates';
import { shareResultMessage, shareSermon } from '../lib/actions';
import { cancel, downloadIcs, reminderFor, toCalEvent } from '../lib/reminders';
import { cloneLayout, LAYOUT_STYLES, MOTIFS, PALETTES, paletteById, SECTION_LABELS, SERMON_THEMES, themeById } from '../data/sermonThemes';
import { Segmented, Sheet, VisibilityBadge, useMyName, useToast } from '../components/ui';
import { MotifPattern, VineDivider } from '../components/Decor';
import { IconBack, IconDown, IconEye, IconEyeOff, IconPalette, IconShare, IconTrash, IconUp } from '../components/Icons';

function useIsDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const check = () => {
      const forced = document.documentElement.getAttribute('data-theme');
      setDark(forced ? forced === 'dark' : mq.matches);
    };
    check();
    mq.addEventListener('change', check);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', check);
      obs.disconnect();
    };
  }, []);
  return dark;
}

export default function SermonView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { hash } = useLocation();
  const me = useMyName();
  const toast = useToast();
  const dark = useIsDark();
  const sermon = useLiveQuery(() => db.sermons.get(Number(id)), [id]);
  const [customizing, setCustomizing] = useState(false);

  useEffect(() => {
    if (sermon && hash === '#followUps') document.getElementById('followUps')?.scrollIntoView({ behavior: 'smooth' });
  }, [sermon, hash]);

  if (!sermon) return <div className="page" />;
  const { layout } = sermon;
  const [bg, surface, ink, accent] = paletteById(layout.palette)[dark ? 'dark' : 'light'];
  const style = { '--s-bg': bg, '--s-surface': surface, '--s-ink': ink, '--s-accent': accent } as CSSProperties;

  const sections = layout.sections.filter((x) => x.visible && hasContent(sermon, x.key));

  return (
    <div className="page sermon-page-wrap">
      <div className="sermon-toolbar">
        <Link to="/sermons" className="btn ghost small">
          <IconBack size={16} /> Sermons
        </Link>
        <div className="actions">
          <button className="btn small" onClick={() => setCustomizing(true)}>
            <IconPalette size={16} /> Customise
          </button>
          <Link to={`/sermons/${sermon.id}/edit`} className="btn small">
            Edit
          </Link>
          {sermon.visibility !== 'private' && (
            <button className="btn small" onClick={async () => toast(shareResultMessage(await shareSermon(sermon, me)))}>
              <IconShare size={16} /> Share
            </button>
          )}
        </div>
      </div>

      <article className={`sermon-page style-${layout.style} ${layout.serifBody ? 'serif' : ''}`} style={style}>
        <MotifPattern motif={layout.motif} color={accent} />
        <header className="sermon-head">
          <p className="eyebrow">{themeById(sermon.theme).label}</p>
          <h1>{sermon.title}</h1>
          <p className="meta">
            {[sermon.preacher, sermon.church, formatDate(sermon.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })].filter(Boolean).join(' · ')}
          </p>
          <VisibilityBadge value={sermon.visibility} />
        </header>
        <div className="sermon-body">
          {sections.map(({ key }, i) => (
            <SermonSection key={key} id={key} title={SECTION_LABELS[key]} index={i}>
              {renderSection(sermon, key)}
            </SermonSection>
          ))}
        </div>
      </article>

      <Sheet open={customizing} title="Customise this page" onClose={() => setCustomizing(false)}>
        <Customiser sermon={sermon} />
      </Sheet>

      <button
        className="btn ghost small danger"
        onClick={async () => {
          if (!confirm('Delete these sermon notes?')) return;
          await db.sermons.delete(sermon.id!);
          nav('/sermons');
        }}
      >
        <IconTrash size={15} /> Delete notes
      </button>
    </div>
  );
}

function hasContent(s: Sermon, key: SectionKey) {
  switch (key) {
    case 'passage':
      return !!s.passage;
    case 'mainPoint':
      return !!s.mainPoint;
    case 'notes':
      return !!s.notes;
    case 'questions':
      return s.questions.length > 0;
    case 'application':
      return !!s.application;
    case 'followUps':
      return s.followUps.length > 0;
  }
}

function SermonSection({ id, title, index, children }: { id: string; title: string; index: number; children: ReactNode }) {
  return (
    <section id={id} className={`s-section s-${id}`}>
      {index > 0 && <VineDivider />}
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function renderSection(s: Sermon, key: SectionKey) {
  switch (key) {
    case 'passage':
      return <p className="s-passage">{s.passage}</p>;
    case 'mainPoint':
      return <p className="s-main">{s.mainPoint}</p>;
    case 'notes':
      return (
        <div className="s-notes">
          {s.notes.split(/\n{2,}/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      );
    case 'questions':
      return (
        <ol className="s-questions">
          {s.questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      );
    case 'application':
      return <p className="s-step">{s.application}</p>;
    case 'followUps':
      return <FollowUps sermon={s} />;
  }
}

const FOLLOW_LABEL: Record<FollowUp['key'], string> = { recall: 'Recall', apply: 'Apply', prepare: 'Prepare' };

function FollowUps({ sermon }: { sermon: Sermon }) {
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const now = Date.now();

  const save = async (key: FollowUp['key']) => {
    const text = (drafts[key] ?? '').trim();
    if (!text) return;
    await db.sermons.update(sermon.id!, { followUps: sermon.followUps.map((f) => (f.key === key ? { ...f, response: text, doneAt: Date.now() } : f)) });
    void cancel(`sermon-${sermon.shareId}-${key}`);
    toast('Follow-through saved');
  };

  const upcoming = sermon.followUps.filter((f) => !f.doneAt && f.dueAt > now);
  return (
    <>
    {upcoming.length > 0 && (
      <button className="btn small" onClick={() => downloadIcs('sermon-follow-ups', upcoming.map((f) => toCalEvent(reminderFor.sermon(sermon.shareId, f.key, f.dueAt))))}>
        Add follow-ups to my calendar
      </button>
    )}
    <ol className="followups">
      {sermon.followUps.map((f) => {
        const open = f.dueAt <= now;
        return (
          <li key={f.key} className={f.doneAt ? 'done' : open ? 'open' : 'later'}>
            <p className="f-head">
              <strong>{FOLLOW_LABEL[f.key]}</strong>
              <span className="meta">{f.doneAt ? `Done ${relativeDays(f.doneAt)}` : open ? 'Ready now' : `Opens ${relativeDays(f.dueAt)}`}</span>
            </p>
            <p>{f.prompt}</p>
            {f.doneAt ? (
              <p className="answer-note">{f.response}</p>
            ) : (
              <div className="form">
                <textarea
                  rows={2}
                  value={drafts[f.key] ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [f.key]: e.target.value })}
                  placeholder={open ? 'Your answer…' : 'You can answer early if you like'}
                />
                <button className="btn small primary" onClick={() => save(f.key)} disabled={!(drafts[f.key] ?? '').trim()}>
                  Save
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ol>
    </>
  );
}

function Customiser({ sermon }: { sermon: Sermon }) {
  const layout = sermon.layout;
  const update = (patch: Partial<SermonLayout>) => db.sermons.update(sermon.id!, { layout: { ...layout, ...patch } });
  const move = (i: number, d: -1 | 1) => {
    const next = [...layout.sections];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    update({ sections: next });
  };

  return (
    <div className="form customiser">
      <p className="muted small">Changes show on the page straight away.</p>

      <fieldset>
        <legend>Start from a theme</legend>
        <div className="chip-row">
          {SERMON_THEMES.map((t) => (
            <button key={t.id} className={`chip ${sermon.theme === t.id ? 'on' : ''}`} onClick={() => db.sermons.update(sermon.id!, { theme: t.id, layout: cloneLayout(t.layout) })}>
              {t.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Layout</legend>
        <Segmented value={layout.style} onChange={(style) => update({ style })} options={LAYOUT_STYLES.map((l) => ({ value: l.id, label: l.label }))} />
        <p className="muted small">{LAYOUT_STYLES.find((l) => l.id === layout.style)?.hint}</p>
      </fieldset>

      <fieldset>
        <legend>Colours</legend>
        <div className="palette-row">
          {PALETTES.map((p) => (
            <button key={p.id} className={`palette ${layout.palette === p.id ? 'on' : ''}`} onClick={() => update({ palette: p.id })} title={p.label} aria-label={p.label}>
              <span style={{ background: p.light[0] }} />
              <span style={{ background: p.light[3] }} />
              <span style={{ background: p.light[2] }} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Decoration</legend>
        <div className="chip-row">
          {MOTIFS.map((m) => (
            <button key={m.id} className={`chip ${layout.motif === m.id ? 'on' : ''}`} onClick={() => update({ motif: m.id })}>
              {m.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="check">
        <input type="checkbox" checked={layout.serifBody} onChange={(e) => update({ serifBody: e.target.checked })} />
        Classic serif text
      </label>

      <fieldset>
        <legend>Sections: order and visibility</legend>
        <ul className="section-order">
          {layout.sections.map((s, i) => (
            <li key={s.key} className={s.visible ? '' : 'hidden'}>
              <span>{SECTION_LABELS[s.key]}</span>
              <span className="actions">
                <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <IconUp size={18} />
                </button>
                <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === layout.sections.length - 1} aria-label="Move down">
                  <IconDown size={18} />
                </button>
                <button
                  className="icon-btn"
                  onClick={() => update({ sections: layout.sections.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)) })}
                  aria-label={s.visible ? 'Hide section' : 'Show section'}
                >
                  {s.visible ? <IconEye size={18} /> : <IconEyeOff size={18} />}
                </button>
              </span>
            </li>
          ))}
        </ul>
      </fieldset>

      <button className="btn ghost small" onClick={() => update(cloneLayout(themeById(sermon.theme).layout))}>
        Reset to “{themeById(sermon.theme).label}” defaults
      </button>
    </div>
  );
}
