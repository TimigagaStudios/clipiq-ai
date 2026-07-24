-- ClipIQ Phase 5: stale worker recovery and job notifications.
-- Run after 006_phase5_processing_pipeline.sql.

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
  set status = 'queued', stage = 'queued', progress = 0,
      message = 'Requeued after an interrupted worker attempt',
      worker_id = null, locked_at = null
  where status in ('downloading', 'extracting_audio', 'transcribing', 'analyzing', 'generating_clips')
    and locked_at < now() - interval '30 minutes';
  get diagnostics recovered = row_count;
  return recovered;
end;
$$;

revoke all on function public.recover_stale_clipiq_jobs() from public, anon, authenticated;
grant execute on function public.recover_stale_clipiq_jobs() to service_role;

comment on function public.recover_stale_clipiq_jobs() is 'Requeues jobs whose worker lock has expired; callable only by the service role.';
