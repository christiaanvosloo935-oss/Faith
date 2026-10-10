import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, syncConfigured } from '../config';

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (!syncConfigured()) return null;
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'faith-auth' } });
  return client;
}

/**
 * Each device gets an anonymous account: no email, no password. It only
 * proves "this is the same phone as before" to the database rules.
 */
export async function ensureSession(): Promise<{ sb: SupabaseClient; userId: string }> {
  const sb = getClient();
  if (!sb) throw new Error('Live sync is not set up yet.');
  const { data } = await sb.auth.getSession();
  if (data.session) return { sb, userId: data.session.user.id };
  const { data: signed, error } = await sb.auth.signInAnonymously();
  if (error || !signed.user) throw new Error(error?.message ?? 'Could not connect.');
  return { sb, userId: signed.user.id };
}
