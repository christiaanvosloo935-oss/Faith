import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Sermon } from '../db';
import { formatDate } from '../lib/dates';
import { dueFollowUps } from '../lib/logic';
import { paletteById, themeById } from '../data/sermonThemes';
import { Empty, PageHeader, VisibilityBadge } from '../components/ui';
import { IconPlus } from '../components/Icons';

export default function Sermons() {
  const sermons = useLiveQuery(() => db.sermons.orderBy('date').reverse().toArray(), [], [] as Sermon[]);
  const due = dueFollowUps(sermons);

  return (
    <div className="page">
      <PageHeader
        title="Sermons"
        subtitle="Capture Sunday, then carry it through the week."
        action={
          <Link to="/sermons/new" className="btn primary">
            <IconPlus size={18} /> New notes
          </Link>
        }
      />

      {due.length > 0 && (
        <div className="callout">
          <p className="eyebrow">Follow-through waiting</p>
          {due.map(({ sermon, followUp }) => (
            <Link key={`${sermon.id}-${followUp.key}`} to={`/sermons/${sermon.id}#followUps`} className="due-link">
              <strong>{sermon.title}</strong>: {followUp.prompt}
            </Link>
          ))}
        </div>
      )}

      {sermons.length ? (
        <div className="sermon-grid">
          {sermons.map((s) => {
            const pal = paletteById(s.layout.palette).light;
            const done = s.followUps.filter((f) => f.doneAt).length;
            return (
              <Link key={s.id} to={`/sermons/${s.id}`} className="card sermon-tile" style={{ ['--tile-bg' as string]: pal[0], ['--tile-accent' as string]: pal[3], ['--tile-ink' as string]: pal[2] }}>
                <span className="tile-band" />
                <p className="eyebrow">{themeById(s.theme).label}</p>
                <h3>{s.title}</h3>
                <p className="meta">
                  {formatDate(s.date)}
                  {s.passage && ` · ${s.passage}`}
                </p>
                {s.mainPoint && <p className="tile-point">“{s.mainPoint}”</p>}
                <div className="card-top">
                  <span className="progress-dots" aria-label={`${done} of ${s.followUps.length} follow-ups done`}>
                    {s.followUps.map((f) => (
                      <span key={f.key} className={f.doneAt ? 'on' : ''} />
                    ))}
                  </span>
                  <VisibilityBadge value={s.visibility} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title="No sermon notes yet">
          Take notes on Sunday. On Monday, Wednesday and Friday you’ll get a short follow-up so the message doesn’t fade, and you can share your notes with your group.
        </Empty>
      )}
    </div>
  );
}
