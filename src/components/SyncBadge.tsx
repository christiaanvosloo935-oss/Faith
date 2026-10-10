import { syncConfigured } from '../config';
import { useSyncStatus } from '../sync/engine';

const LABEL = { off: '', connecting: 'Connecting…', live: 'Live', offline: 'Offline: will sync later', error: 'Sync paused' } as const;

/** Small "Live" pill for synced circles and pacts. */
export function SyncBadge({ synced }: { synced: boolean }) {
  const { status, error } = useSyncStatus();
  if (!synced || !syncConfigured()) return null;
  const s = status === 'off' ? 'connecting' : status;
  return (
    <span className={`sync-badge ${s}`} title={error || 'End-to-end encrypted. Changes appear on everyone’s phone instantly.'}>
      <span className="pulse" /> {LABEL[s]}
    </span>
  );
}
