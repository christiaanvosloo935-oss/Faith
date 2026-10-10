/**
 * Link-based sharing. Shared items are packed into the URL fragment, which
 * browsers never send to a server, so the person shares through their own
 * messaging app and nothing passes through ours.
 */
export type ShareKind = 'need' | 'checkin' | 'sermon' | 'pin' | 'prayer';

export interface SharePacket<T = unknown> {
  v: 1;
  kind: ShareKind;
  from: string;
  data: T;
}

export function toBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodePacket(p: SharePacket): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(p)));
}

export function decodePacket(s: string): SharePacket {
  const p = JSON.parse(new TextDecoder().decode(fromBase64Url(s)));
  if (!p || p.v !== 1 || typeof p.kind !== 'string' || !('data' in p)) throw new Error('This link is not a Faith share link.');
  return p as SharePacket;
}

export function shareUrl(p: SharePacket, origin = location.origin + location.pathname): string {
  return `${origin}#/receive/${encodePacket(p)}`;
}

/** Use the system share sheet when there is one, otherwise copy to clipboard. */
export async function sendLink(title: string, text: string, url: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return 'cancelled';
    }
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return 'copied';
}
