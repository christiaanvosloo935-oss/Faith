/**
 * Supabase connection. Both values are public by design: the anon key only
 * allows what the row-level security rules in supabase/setup.sql permit.
 * Leave the key empty to run the app fully offline (link sharing only).
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://sbginzxeuldiflufucuf.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** Public half of the web push key pair. The private half is a Supabase secret. */
export const VAPID_PUBLIC_KEY = 'BNUiC5XadLWQUnVTEIyMqjgg-7jQwNwySN-gs27INvzdX9d1DCP4NjdTlXHrvbpNUlP6_X14zpbGJKTSzfEhD7A';

export const syncConfigured = () => !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
