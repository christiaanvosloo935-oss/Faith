import type { HelpTask, Need } from '../db';

type NeedBody = Omit<Need, 'id' | 'circleId' | 'dirty'>;

/**
 * Combine my local copy of a need with the latest copy on the server before
 * uploading, so two people acting at once don't overwrite each other.
 * My own prayers, claims and completions come from my copy; everyone else's
 * come from the server.
 */
export function mergeNeedForPush(local: NeedBody, remote: NeedBody | null, me: string): NeedBody {
  if (!remote) return local;
  const others = (list: string[]) => list.filter((n) => n !== me);
  const prayedBy = [...new Set([...others(remote.prayedBy), ...others(local.prayedBy), ...(local.prayedBy.includes(me) ? [me] : [])])];

  const remoteTasks = new Map(remote.tasks.map((t) => [t.id, t]));
  const tasks: HelpTask[] = local.tasks.map((lt) => {
    const rt = remoteTasks.get(lt.id);
    remoteTasks.delete(lt.id);
    if (!rt) return lt;
    if (lt.claimedBy === me || rt.claimedBy === me) return lt;
    return rt.claimedBy ? rt : lt;
  });
  // Tasks the author added elsewhere that this copy hasn't seen yet.
  if (local.author !== me) tasks.push(...remoteTasks.values());

  return { ...local, prayedBy, tasks, resolved: local.author === me ? local.resolved : local.resolved || remote.resolved };
}
