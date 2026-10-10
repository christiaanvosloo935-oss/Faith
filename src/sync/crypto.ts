import { fromBase64Url, toBase64Url } from '../lib/share';

/**
 * End-to-end encryption for synced circles. Each circle has its own random
 * AES-256-GCM key, which only travels inside invite links.
 */
export interface Sealed {
  iv: string;
  ct: string;
}

const cache = new Map<string, Promise<CryptoKey>>();

function importKey(key: string) {
  let k = cache.get(key);
  if (!k) {
    k = crypto.subtle.importKey('raw', fromBase64Url(key) as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
    cache.set(key, k);
  }
  return k;
}

export function newKey(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function seal(key: string, value: unknown): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await importKey(key), data));
  return { iv: toBase64Url(iv), ct: toBase64Url(ct) };
}

export async function unseal<T>(key: string, s: Sealed): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(s.iv) as BufferSource }, await importKey(key), fromBase64Url(s.ct) as BufferSource);
  return JSON.parse(new TextDecoder().decode(plain)) as T;
}
