// Sends due reminders as web push notifications. Called every 15 minutes by
// pg_cron (see supabase/setup.sql). Calling it more often is harmless: it only
// sends reminders whose time has come, once.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const DAY = 24 * 60 * 60 * 1000;

Deno.serve(async () => {
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!publicKey || !privateKey) return new Response('VAPID keys are not set', { status: 500 });
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'https://github.com/christiaanvosloo935-oss/Faith', publicKey, privateKey);

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = Date.now();
  const { data: due, error } = await sb.from('reminders').select('*').is('sent_at', null).lte('fire_at', new Date(now).toISOString()).limit(500);
  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const r of due ?? []) {
    const { data: subs } = await sb.from('push_subscriptions').select('endpoint, subscription').eq('user_id', r.user_id);
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(s.subscription, JSON.stringify({ title: r.title, body: r.body, url: r.url ?? '#/' }));
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
      }
    }
    if (r.repeat_days) {
      let next = new Date(r.fire_at).getTime();
      while (next <= now) next += r.repeat_days * DAY;
      await sb.from('reminders').update({ fire_at: new Date(next).toISOString() }).eq('user_id', r.user_id).eq('id', r.id);
    } else {
      await sb.from('reminders').update({ sent_at: new Date(now).toISOString() }).eq('user_id', r.user_id).eq('id', r.id);
    }
  }
  return new Response(JSON.stringify({ due: due?.length ?? 0, sent }), { headers: { 'Content-Type': 'application/json' } });
});
