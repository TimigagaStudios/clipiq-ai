-- ClipIQ Phase 5: authenticated user retry control for failed/dead-letter jobs.
-- Run after migrations 006-008.

create or replace function public.retry_clipiq_job(p_job_id uuid)
returns public.jobs
language plpgsql
security invoker
set search_path = public
as $$
declare
  retried public.jobs;
begin
  update public.jobs
  set status = 'queued', stage = 'queued', progress = 0,
      message = 'Queued for retry', error = null, last_error_code = null,
      dead_lettered_at = null, worker_id = null, locked_at = null, timeout_at = null
  where id = p_job_id
    and user_id = auth.uid()
    and status in ('failed', 'dead_letter')
  returning * into retried;

  if retried.id is null then
    raise exception 'Job is not available for retry';
  end if;
  return retried;
end;
$$;

revoke all on function public.retry_clipiq_job(uuid) from public, anon;
grant execute on function public.retry_clipiq_job(uuid) to authenticated;
