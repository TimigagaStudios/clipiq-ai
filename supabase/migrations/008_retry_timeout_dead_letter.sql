-- ClipIQ Phase 5: retry limits, timeout rules, and dead-letter state.
-- Run after migrations 001-007.

alter table public.jobs
  add column if not exists max_attempts integer not null default 3,
  add column if not exists timeout_seconds integer not null default 1800,
  add column if not exists timeout_at timestamptz,
  add column if not exists last_error_code text,
  add column if not exists dead_lettered_at timestamptz;

alter table public.jobs
  drop constraint if exists jobs_attempt_limits_check;
alter table public.jobs
  add constraint jobs_attempt_limits_check
  check (max_attempts between 1 and 10 and timeout_seconds between 60 and 86400 and processing_attempts >= 0);

-- Replace the original claim function so every claim receives an explicit timeout.
create or replace function public.claim_next_clipiq_job(p_worker_id text)
returns setof public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.jobs;
begin
  if p_worker_id is null or length(trim(p_worker_id)) = 0 then
    raise exception 'worker id is required';
  end if;

  select * into claimed
  from public.jobs
  where status = 'queued'
    and (locked_at is null or locked_at < now() - interval '30 minutes')
  order by created_at asc
  for update skip locked
  limit 1;

  if claimed.id is null then return; end if;

  update public.jobs
  set status = 'downloading', stage = 'downloading', progress = 10,
      message = 'Worker claimed the job', worker_id = p_worker_id,
      locked_at = now(), timeout_at = now() + make_interval(secs => timeout_seconds),
      processing_attempts = processing_attempts + 1,
      error = null, last_error_code = null
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

-- Requeue retryable stale jobs until max_attempts; then move them to dead letter.
create or replace function public.recover_stale_clipiq_jobs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  recovered integer;
begin
  update public.jobs
  set status = case when processing_attempts >= max_attempts then 'dead_letter' else 'queued' end,
      stage = case when processing_attempts >= max_attempts then 'dead_letter' else 'queued' end,
      progress = case when processing_attempts >= max_attempts then progress else 0 end,
      message = case when processing_attempts >= max_attempts then 'Job moved to dead letter after repeated timeouts' else 'Requeued after an interrupted worker attempt' end,
      dead_lettered_at = case when processing_attempts >= max_attempts then now() else dead_lettered_at end,
      worker_id = null, locked_at = null, timeout_at = null
  where status in ('downloading', 'extracting_audio', 'transcribing', 'analyzing', 'generating_clips')
    and (timeout_at < now() or locked_at < now() - interval '30 minutes');
  get diagnostics recovered = row_count;
  return recovered;
end;
$$;

revoke all on function public.claim_next_clipiq_job(text) from public, anon, authenticated;
grant execute on function public.claim_next_clipiq_job(text) to service_role;
revoke all on function public.recover_stale_clipiq_jobs() from public, anon, authenticated;
grant execute on function public.recover_stale_clipiq_jobs() to service_role;
