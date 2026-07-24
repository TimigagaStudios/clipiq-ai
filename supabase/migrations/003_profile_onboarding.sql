-- ClipIQ Phase 4: persistent onboarding and creator profile.
-- Run after 001_initial_schema.sql and 002_auth_rls.sql.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists workspace_name text,
  add column if not exists role text,
  add column if not exists primary_platform text,
  add column if not exists onboarding_step smallint not null default 1,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_onboarding_step_check;
alter table public.profiles
  add constraint profiles_onboarding_step_check
  check (onboarding_step between 1 and 3);

-- Existing authenticated users created before the auth trigger was installed
-- also need a profile row. New users continue to be handled by 002's trigger.
insert into public.profiles (id, email, display_name)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'display_name', split_part(coalesce(u.email, ''), '@', 1))
from auth.users u
on conflict (id) do nothing;

-- The browser may create its own missing profile row after a valid sign-in.
-- The row must always belong to the currently authenticated user.
drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
  for insert with check (auth.uid() = id);
