-- supabase/migrations/001_initial_schema.sql
-- ===========================================================================
-- ClipIQ AI - initial schema (Phase 2 scaffold).
--
-- SCOPE: core tables only. This is an INITIAL migration to be extended, NOT a
-- final schema. Phase 3 (Authentication) will:
--   * add the foreign key  user_id -> auth.users(id) on delete cascade,
--   * switch user_id to NOT NULL,
--   * add Row Level Security policies (RLS is enabled below but policy-less,
--     which means all direct client access is denied until policies exist -
--     the safe default; the serverless API uses the service-role key and is
--     therefore unaffected).
-- Real video-processing metadata expands jobs/clips in later phases.
--
-- FIELD NAMES intentionally mirror the mock shapes in server/server.js and
-- api/lib/store.js so the mock -> DB swap is mechanical (clipCount ->
-- clip_count, viralityScore -> virality_score, exportedAt -> exported_at, ...).
--
-- NOTES:
--  * gen_random_uuid() is built into Postgres 13+ (Supabase runs 15), so no
--    pgcrypto extension is required.
--  * Supabase executes each migration file inside a transaction, so do NOT add
--    BEGIN / COMMIT here.
--  * `create trigger` is not idempotent, but Supabase tracks migrations and
--    runs each file exactly once, so plain CREATE TRIGGER is correct.
-- ===========================================================================

-- Keep updated_at columns fresh automatically.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per user (extends auth; the auth.users FK lands in Phase 3).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key,                -- will reference auth.users(id) in Phase 3
  email        text,
  display_name text,
  avatar_url   text,
  plan         text not null default 'free',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- projects: a source video / project the user created clips from.
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                             -- FK to auth.users added in Phase 3
  title       text not null,
  source_url  text,
  thumbnail   text,
  clip_count  integer not null default 0,
  status      text not null default 'pending',  -- pending | processing | completed | failed
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_projects_user_id on public.projects (user_id);
create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
alter table public.projects enable row level security;

-- ---------------------------------------------------------------------------
-- jobs: one analysis run against a source URL.
-- ---------------------------------------------------------------------------
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  project_id   uuid references public.projects(id) on delete set null,
  source_url   text not null,
  category     text not null default 'auto',
  status       text not null default 'queued',  -- queued|downloading|extracting_audio|transcribing|analyzing|generating_clips|completed|failed
  progress     integer not null default 0,
  message      text not null default 'Queued for processing',
  error        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists idx_jobs_user_id on public.jobs (user_id);
create index if not exists idx_jobs_status on public.jobs (status);
create trigger trg_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();
alter table public.jobs enable row level security;

-- ---------------------------------------------------------------------------
-- clips: generated short-form clips belonging to a job.
-- ---------------------------------------------------------------------------
create table if not exists public.clips (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid,
  job_id          uuid not null references public.jobs(id) on delete cascade,
  title           text not null,
  hook            text,
  category        text,
  duration        text,
  virality_score  integer,
  thumbnail       text,
  video_url       text,
  captions        jsonb not null default '[]'::jsonb,
  hashtags        text[] not null default '{}',
  platforms       text[] not null default '{}',
  status          text not null default 'ready',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_clips_job_id on public.clips (job_id);
create index if not exists idx_clips_user_id on public.clips (user_id);
create trigger trg_clips_updated_at
  before update on public.clips
  for each row execute function public.set_updated_at();
alter table public.clips enable row level security;

-- ---------------------------------------------------------------------------
-- exports: export / publish history (the "history" screen).
-- ---------------------------------------------------------------------------
create table if not exists public.exports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid,
  clip_id      uuid references public.clips(id) on delete set null,
  title        text not null,
  thumbnail    text,
  format       text not null default 'MP4',
  resolution   text not null default '1080p',
  platform     text,
  exported_at  timestamptz not null default now()
);
create index if not exists idx_exports_user_id on public.exports (user_id);
create index if not exists idx_exports_clip_id on public.exports (clip_id);
alter table public.exports enable row level security;

-- ===========================================================================
-- Analytics is DERIVED (no dedicated table): compute it from clips + exports
-- in the API, or via a Postgres view added later without a breaking change.
-- ===========================================================================
