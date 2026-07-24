-- ClipIQ Phase 5: durable processing-worker contract.
-- Run after migrations 001-005. This migration does not expose service secrets.

alter table public.jobs
  add column if not exists stage text not null default 'queued',
  add column if not exists worker_id text,
  add column if not exists locked_at timestamptz,
  add column if not exists processing_attempts integer not null default 0,
  add column if not exists input_path text,
  add column if not exists transcript_path text;

create index if not exists idx_jobs_worker_queue
  on public.jobs (status, created_at)
  where status in ('queued', 'downloading', 'extracting_audio', 'transcribing', 'analyzing', 'generating_clips');

-- A small, service-role-only claim function prevents two workers from taking
-- the same queued job. The worker calls this through Supabase RPC.
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

  if claimed.id is null then
    return;
  end if;

  update public.jobs
  set status = 'downloading', stage = 'downloading', progress = 10,
      message = 'Worker claimed the job', worker_id = p_worker_id,
      locked_at = now(), processing_attempts = processing_attempts + 1,
      error = null
  where id = claimed.id
  returning * into claimed;

  return next claimed;
end;
$$;

revoke all on function public.claim_next_clipiq_job(text) from public, anon, authenticated;
grant execute on function public.claim_next_clipiq_job(text) to service_role;

-- Storage bucket for rendered clips. The worker uses the service role for
-- uploads; browser access remains protected by signed URLs in a later batch.
insert into storage.buckets (id, name, public)
values ('clipiq-media', 'clipiq-media', false)
on conflict (id) do nothing;

comment on column public.jobs.stage is 'Worker pipeline stage, separate from the public job status.';
comment on column public.jobs.worker_id is 'Opaque worker identifier; never a credential.';
