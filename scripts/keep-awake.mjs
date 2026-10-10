// Reads the public Supabase URL and publishable key from src/config.ts and
// makes one harmless request (it returns nothing, because of row-level security).
import { readFileSync } from 'node:fs';

const config = readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8');
const url = config.match(/VITE_SUPABASE_URL \?\? '([^']+)'/)?.[1];
const key = config.match(/VITE_SUPABASE_ANON_KEY \?\? '([^']+)'/)?.[1];
if (!url || !key) {
  console.log('Supabase is not configured; nothing to do.');
  process.exit(0);
}
const res = await fetch(`${url}/rest/v1/circles?select=id&limit=1`, { headers: { apikey: key } });
console.log(`Supabase answered ${res.status}`);
if (res.status >= 500) process.exit(1);
