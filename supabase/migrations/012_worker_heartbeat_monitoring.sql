-- ClipIQ Phase 5: worker heartbeat and operational monitoring.
-- Run after migrations 006-011.

create table if not exists public.worker_heartbeats (
  worker_id text primary key,
  status text not null default 'online',
  queue_health jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.record_clipiq_worker_heartbeat(p_worker_id text, p_queue_health jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.worker_heartbeats (worker_id, status, queue_health, last_seen_at, updated_at)
  values (p_worker_id, 'online', coalesce(p_queue_health, '{}'::jsonb), now(), now())
  on conflict (worker_id) do update set status = 'online', queue_health = excluded.queue_health, last_seen_at = now(), updated_at = now();
$$;
revoke all on function public.record_clipiq_worker_heartbeat(text, jsonb) from public, anon, authenticated;
grant execute on function public.record_clipiq_worker_heartbeat(text, jsonb) to service_role;

create or replace function public.get_clipiq_queue_health()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'queued', (select count(*) from public.jobs where status = 'queued'),
    'active', (select count(*) from public.jobs where status in ('downloading','extracting_audio','transcribing','analyzing','generating_clips')),
    'completed', (select count(*) from public.jobs where status = 'completed'),
    'failed', (select count(*) from public.jobs where status = 'failed'),
    'dead_letter', (select count(*) from public.jobs where status = 'dead_letter'),
    'cancelled', (select count(*) from public.jobs where status = 'cancelled'),
    'oldest_queued_at', (select min(created_at) from public.jobs where status = 'queued'),
    'workers_online', (select count(*) from public.worker_heartbeats where last_seen_at > now() - interval '2 minutes'),
    'workers_stale', (select count(*) from public.worker_heartbeats where last_seen_at <= now() - interval '2 minutes'),
    'checked_at', now()
  );
$$;
revoke all on function public.get_clipiq_queue_health() from public, anon, authenticated;
grant execute on function public.get_clipiq_queue_health() to service_role;
