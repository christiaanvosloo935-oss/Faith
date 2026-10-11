import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CheckIn, type Sermon } from '../db';
import { decodePacket, type SharePacket } from '../lib/share';
import { receiveCheckIn, receiveNeed, receiveSermon, type ReceivedNeed } from '../lib/receive';
import { formatDate } from '../lib/dates';
import { PageHeader, useToast } from '../components/ui';

export default function Receive() {
  const { payload = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const circles = useLiveQuery(() => db.circles.toArray(), [], []);
  const [circleId, setCircleId] = useState<number | ''>('');
  const packet = useMemo(() => {
    try {
      return decodePacket(payload);
    } catch {
      return null;
    }
  }, [payload]);

  if (!packet)
    return (
      <div className="page">
        <PageHeader title="Link not recognised" subtitle="This link may be incomplete. Ask the sender to share it again." />
      </div>
    );

  const save = async () => {
    switch (packet.kind) {
      case 'need': {
        const r = await receiveNeed(packet.data as ReceivedNeed, circleId || undefined);
        toast(r === 'updated' ? 'Need updated with the latest prayers and help' : 'Need added to your circle');
        return nav('/circle');
      }
      case 'checkin': {
        const r = await receiveCheckIn(packet as SharePacket<Omit<CheckIn, 'id' | 'pactId' | 'from'>>);
        if (r === 'no-pact') {
          toast('Set up your pact first, then open this link again');
          return nav('/circle?tab=pact');
        }
        toast(r === 'exists' ? 'You already have this check-in' : `Check-in from ${packet.from} saved`);
        return nav('/circle?tab=pact');
      }
      case 'sermon': {
        const r = await receiveSermon(packet.data as Omit<Sermon, 'id' | 'followUps'>);
        toast(r.existed ? 'You already have these notes' : 'Sermon notes saved');
        return nav(`/sermons/${r.id}`);
      }
      default:
        toast('This kind of link is not supported yet');
    }
  };

  return (
    <div className="page">
      <PageHeader title={`From ${packet.from}`} subtitle="Someone shared this with you. Look it over, then save it to your app." />
      <article className="card">
        <Preview packet={packet} />
      </article>
      {packet.kind === 'need' && circles.length > 0 && (
        <label className="form">
          Save into
          <select value={circleId} onChange={(e) => setCircleId(e.target.value ? Number(e.target.value) : '')}>
            <option value="">“{(packet.data as ReceivedNeed).circleName}” (match by name, or create it)</option>
            {circles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="actions">
        <button className="btn ghost" onClick={() => nav('/')}>
          Not now
        </button>
        <button className="btn primary" onClick={save}>
          Save to my app
        </button>
      </div>
      <p className="muted small">It came straight from the sender’s link. Nothing passed through a server.</p>
    </div>
  );
}

function Preview({ packet }: { packet: SharePacket }) {
  switch (packet.kind) {
    case 'need': {
      const n = packet.data as ReceivedNeed;
      return (
        <>
          <p className="eyebrow">Prayer need · {n.circleName}</p>
          <h2>{n.title}</h2>
          {n.detail && <p>{n.detail}</p>}
          {n.tasks.length > 0 && (
            <ul className="tasks">
              {n.tasks.map((t) => (
                <li key={t.id}>
                  {t.label}
                  {t.when && ` · ${t.when}`} {t.claimedBy ? <span className="claimed">{t.claimedBy}</span> : <span className="muted">open</span>}
                </li>
              ))}
            </ul>
          )}
          {n.prayedBy.length > 0 && <p className="meta">Praying: {n.prayedBy.join(', ')}</p>}
        </>
      );
    }
    case 'checkin': {
      const c = packet.data as CheckIn;
      return (
        <>
          <p className="eyebrow">Weekly check-in · {formatDate(c.createdAt)}</p>
          {c.answers.map((a) => (
            <div key={a.question} className="qa-read">
              <p className="q">{a.question}</p>
              <p>{a.answer}</p>
            </div>
          ))}
          {c.commitment && <p className="meta">Commitment: {c.commitment}</p>}
        </>
      );
    }
    case 'sermon': {
      const s = packet.data as Sermon;
      return (
        <>
          <p className="eyebrow">Sermon notes · {formatDate(s.date)}</p>
          <h2>{s.title}</h2>
          <p className="meta">{[s.preacher, s.church, s.passage].filter(Boolean).join(' · ')}</p>
          {s.mainPoint && <p className="s-main">“{s.mainPoint}”</p>}
        </>
      );
    }
    default:
      return <p>Unknown item.</p>;
  }
}
