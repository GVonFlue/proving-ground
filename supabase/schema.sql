-- PROVING GROUND schema. Safe to run more than once.
-- Run in Supabase: SQL Editor > New query > paste > Run.

-- 1. Invite code (no client access; only join_crew reads it)
create table if not exists public.crew_settings (
  id int primary key default 1 check (id = 1),
  invite_code text not null
);
insert into public.crew_settings (id, invite_code) values (1, 'HOLDTHELINE')
  on conflict (id) do nothing;
alter table public.crew_settings enable row level security;

-- 2. Members
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  business text check (char_length(business) <= 60),
  avatar_url text,
  start_date date not null,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 3. Daily check-ins
create table if not exists public.daily_logs (
  user_id uuid not null references public.profiles on delete cascade,
  log_date date not null,
  workout_1 boolean not null default false,
  workout_2_outdoor boolean not null default false,
  diet boolean not null default false,
  water boolean not null default false,
  reading boolean not null default false,
  photo boolean not null default false,
  note text check (char_length(note) <= 280),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);
alter table public.daily_logs enable row level security;

-- 4. Crew chat
create table if not exists public.chat_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  kind text not null default 'user' check (kind in ('user', 'system')),
  ref_date date,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);
alter table public.chat_messages enable row level security;

-- Helpers
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.chicago_today() returns date
language sql stable as $$
  select (now() at time zone 'America/Chicago')::date;
$$;

-- Policies
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_member());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "logs read" on public.daily_logs;
create policy "logs read" on public.daily_logs for select to authenticated
  using (public.is_member());
drop policy if exists "logs insert own" on public.daily_logs;
create policy "logs insert own" on public.daily_logs for insert to authenticated
  with check (user_id = auth.uid() and log_date between public.chicago_today() - 1 and public.chicago_today());
drop policy if exists "logs update own" on public.daily_logs;
create policy "logs update own" on public.daily_logs for update to authenticated
  using (user_id = auth.uid() and log_date between public.chicago_today() - 1 and public.chicago_today())
  with check (user_id = auth.uid() and log_date between public.chicago_today() - 1 and public.chicago_today());

drop policy if exists "chat read" on public.chat_messages;
create policy "chat read" on public.chat_messages for select to authenticated
  using (public.is_member());
drop policy if exists "chat send" on public.chat_messages;
create policy "chat send" on public.chat_messages for insert to authenticated
  with check (user_id = auth.uid() and kind = 'user' and public.is_member());
drop policy if exists "chat delete own" on public.chat_messages;
create policy "chat delete own" on public.chat_messages for delete to authenticated
  using (user_id = auth.uid() and kind = 'user');

-- Join with invite code
create or replace function public.join_crew(
  code text, p_display_name text, p_business text, p_avatar_url text, p_start_date date
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first';
  end if;
  if not exists (
    select 1 from public.crew_settings where upper(trim(invite_code)) = upper(trim(code))
  ) then
    raise exception 'That invite code is not valid';
  end if;
  insert into public.profiles (id, display_name, business, avatar_url, start_date)
  values (auth.uid(), trim(p_display_name), nullif(trim(p_business), ''), nullif(trim(p_avatar_url), ''), p_start_date)
  on conflict (id) do nothing;
  insert into public.chat_messages (user_id, body, kind)
  values (auth.uid(), trim(p_display_name) || ' joined the crew.', 'system');
end;
$$;
revoke all on function public.join_crew(text, text, text, text, date) from public;
grant execute on function public.join_crew(text, text, text, text, date) to authenticated;

-- Keep updated_at fresh and post "cleared" to chat once per day
create or replace function public.on_log_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  done boolean := new.workout_1 and new.workout_2_outdoor and new.diet and new.water and new.reading and new.photo;
  who text;
begin
  if done and not exists (
    select 1 from public.chat_messages
    where user_id = new.user_id and kind = 'system' and ref_date = new.log_date
  ) then
    select display_name into who from public.profiles where id = new.user_id;
    insert into public.chat_messages (user_id, body, kind, ref_date)
    values (new.user_id, who || ' cleared all 6 for ' ||
      case when new.log_date = public.chicago_today() then 'today.' else 'yesterday.' end,
      'system', new.log_date);
  end if;
  return new;
end;
$$;

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists daily_logs_touch on public.daily_logs;
create trigger daily_logs_touch before update on public.daily_logs
  for each row execute function public.touch_updated_at();
drop trigger if exists daily_logs_cleared on public.daily_logs;
create trigger daily_logs_cleared after insert or update on public.daily_logs
  for each row execute function public.on_log_change();

-- Realtime
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'daily_logs') then
    alter publication supabase_realtime add table public.daily_logs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;
