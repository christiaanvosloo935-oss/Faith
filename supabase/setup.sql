-- Faith: run this once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run.

-- ─── Live sync for circles and accountability pacts ───
-- The server only ever stores encrypted blobs. The key for each circle lives
-- in its invite link (after the #), so nobody without the link can read it,
-- including whoever runs this database.

create table if not exists public.circles (
  id uuid primary key,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles on delete cascade,
  user_id uuid not null default auth.uid(),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table if not exists public.items (
  id uuid primary key,
  circle_id uuid not null references public.circles on delete cascade,
  kind text not null,
  iv text not null,
  ct text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);
create index if not exists items_circle_updated on public.items (circle_id, updated_at);

create or replace function public.is_member(c uuid) returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.circle_members m where m.circle_id = c and m.user_id = auth.uid())
$$;

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.items enable row level security;

drop policy if exists "create circles" on public.circles;
create policy "create circles" on public.circles for insert to authenticated with check (created_by = auth.uid());
drop policy if exists "see my circles" on public.circles;
create policy "see my circles" on public.circles for select to authenticated using (created_by = auth.uid() or public.is_member(id));

drop policy if exists "join circles" on public.circle_members;
create policy "join circles" on public.circle_members for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "see fellow members" on public.circle_members;
create policy "see fellow members" on public.circle_members for select to authenticated using (public.is_member(circle_id));
drop policy if exists "leave circles" on public.circle_members;
create policy "leave circles" on public.circle_members for delete to authenticated using (user_id = auth.uid());

drop policy if exists "read circle items" on public.items;
create policy "read circle items" on public.items for select to authenticated using (public.is_member(circle_id));
drop policy if exists "add circle items" on public.items;
create policy "add circle items" on public.items for insert to authenticated with check (public.is_member(circle_id));
drop policy if exists "change circle items" on public.items;
create policy "change circle items" on public.items for update to authenticated using (public.is_member(circle_id)) with check (public.is_member(circle_id));

-- Stamp rows with the server's clock, so a phone with a wrong clock can't hide
-- its updates from the other person's catch-up.
create or replace function public.stamp_item() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end $$;
drop trigger if exists stamp_item on public.items;
create trigger stamp_item before insert or update on public.items for each row execute function public.stamp_item();

do $$ begin
  alter publication supabase_realtime add table public.items;
exception when duplicate_object then null; end $$;

-- ─── Reminders (push notifications) ───
-- Reminder text is deliberately generic ("A prayer is ready to look back on"),
-- so no prayer content is ever stored here.

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  user_id uuid not null default auth.uid(),
  subscription jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminders (
  id text not null,
  user_id uuid not null default auth.uid(),
  fire_at timestamptz not null,
  title text not null,
  body text not null,
  url text,
  repeat_days int,
  sent_at timestamptz,
  primary key (user_id, id)
);
create index if not exists reminders_due on public.reminders (fire_at) where sent_at is null;

alter table public.push_subscriptions enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "own subscriptions" on public.push_subscriptions;
create policy "own subscriptions" on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own reminders" on public.reminders;
create policy "own reminders" on public.reminders for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Check for due reminders every 15 minutes.
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('faith-send-reminders') where exists (select 1 from cron.job where jobname = 'faith-send-reminders');
select cron.schedule(
  'faith-send-reminders',
  '*/15 * * * *',
  $$ select net.http_post(
       url := 'https://sbginzxeuldiflufucuf.supabase.co/functions/v1/smart-handler',
       headers := '{"Content-Type": "application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);
