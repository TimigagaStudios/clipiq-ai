-- supabase/migrations/002_auth_rls.sql
-- ===========================================================================
-- Phase 3: user ownership + Row Level Security. APPEND-ONLY (never edit 001).
-- Run AFTER 001 on a FRESH Supabase database (no rows yet). If 001 already
-- contains rows with NULL user_id, backfill them before running the
-- `set not null` statements below.
-- Assumes the `auth` schema exists (Supabase provides it).
-- ===========================================================================

-- 1) Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Tighten ownership: user_id NOT NULL + FK to auth.users on tenant tables.
alter table public.profiles add constraint fk_profiles_user
  foreign key (id) references auth.users(id) on delete cascade;

alter table public.projects alter column user_id set not null;
alter table public.projects add constraint fk_projects_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.jobs alter column user_id set not null;
alter table public.jobs add constraint fk_jobs_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.clips alter column user_id set not null;
alter table public.clips add constraint fk_clips_user
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.exports alter column user_id set not null;
alter table public.exports add constraint fk_exports_user
  foreign key (user_id) references auth.users(id) on delete cascade;

-- 3) Row Level Security policies: each user sees / edits only their own rows.
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "projects_self_all" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "jobs_self_all" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "clips_self_all" on public.clips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exports_self_all" on public.exports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);