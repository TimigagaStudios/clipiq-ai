-- ClipIQ Phase 5: job audit events and queue health.
-- Run after migrations 006-010.

create table if not exists public.job_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  stage text,
  message text not null,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_job_events_job_created on public.job_events (job_id, created_at desc);
create index if not exists idx_job_events_user_created on public.job_events (user_id, created_at desc);
alter table public.job_events enable row level security;
drop policy if exists "job_events_self_select" on public.job_events;
create policy "job_events_self_select" on public.job_events for select using (auth.uid() = user_id);

-- Replace the prior cancellation function so cancellation is audited.
create or replace function public.cancel_clipiq_job(p_job_id uuid)
returns public.jobs
language plpgsql
security invoker
set search_path = public
as $$
declare
  cancelled public.jobs;
begin
  update public.jobs
  set status = 'cancelled', stage = 'cancelled', message = 'Cancelled by the user',
      locked_at = null, timeout_at = null
  where id = p_job_id and user_id = auth.uid() and status = 'queued'
  returning * into cancelled;
  if cancelled.id is null then raise exception 'Only queued jobs can be cancelled'; end if;
  insert into public.job_events (job_id, user_id, event_type, stage, message)
  values (cancelled.id, cancelled.user_id, 'cancelled', 'cancelled', 'Cancelled by the user');
  return cancelled;
end;
$$;
revoke all on function public.cancel_clipiq_job(uuid) from public, anon;
grant execute on function public.cancel_clipiq_job(uuid) to authenticated;

create or replace function public.get_clipiq_queue_health()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'queued', count(*) filter (where status = 'queued'),
    'active', count(*) filter (where status in ('downloading','extracting_audio','transcribing','analyzing','generating_clips')),
    'completed', count(*) filter (where status = 'completed'),
    'failed', count(*) filter (where status = 'failed'),
    'dead_letter', count(*) filter (where status = 'dead_letter'),
    'cancelled', count(*) filter (where status = 'cancelled'),
    'oldest_queued_at', min(created_at) filter (where status = 'queued'),
    'checked_at', now()
  ) from public.jobs;
$$;
revoke all on function public.get_clipiq_queue_health() from public, anon, authenticated;
grant execute on function public.get_clipiq_queue_health() to service_role;

revoke all on table public.job_events from anon;
grant select on table public.job_events to authenticated;
