-- ClipIQ Phase 5: authenticated queued-job cancellation and control metadata.
-- Run after migrations 006-009.

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
  where id = p_job_id
    and user_id = auth.uid()
    and status = 'queued'
  returning * into cancelled;

  if cancelled.id is null then
    raise exception 'Only queued jobs can be cancelled';
  end if;
  return cancelled;
end;
$$;

revoke all on function public.cancel_clipiq_job(uuid) from public, anon;
grant execute on function public.cancel_clipiq_job(uuid) to authenticated;
