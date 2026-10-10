import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { syncConfigured } from '../config';
import { joinSpace, parseInvite } from '../sync/engine';
import { PageHeader, useToast } from '../components/ui';
import { IconLock } from '../components/Icons';

export default function Join() {
  const { token = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const invite = parseInvite(token);
  const savedName = useLiveQuery(async () => ((await db.settings.get('name'))?.value as string) ?? '', []);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setName(savedName ?? ''), [savedName]);

  if (!invite || !syncConfigured())
    return (
      <div className="page">
        <PageHeader title="Invite not recognised" subtitle="This link may be incomplete. Ask the person who invited you to send it again." />
      </div>
    );

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await db.settings.put({ key: 'name', value: name.trim() });
      await joinSpace(invite.type, invite.syncId, invite.key);
      toast(invite.type === 'circle' ? 'You’ve joined the circle' : 'Your pact is connected');
      nav(invite.type === 'circle' ? '/circle' : '/circle?tab=pact', { replace: true });
    } catch (err) {
      toast((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title={invite.type === 'circle' ? 'Join a circle' : 'Join a pact'}
        subtitle={invite.type === 'circle' ? 'Pray for each other and help in practical ways.' : 'Walk closely with a friend, with weekly honest check-ins.'}
      />
      <form className="card form" onSubmit={join}>
        <label>
          Your name, as others will see it
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" required autoFocus />
        </label>
        <button className="btn primary block" disabled={busy}>
          {busy ? 'Joining…' : 'Join'}
        </button>
        <p className="muted small privacy-note">
          <IconLock size={13} /> End-to-end encrypted: only people with this invite link can read what’s shared. Your private prayers never leave your phone.
        </p>
      </form>
    </div>
  );
}
