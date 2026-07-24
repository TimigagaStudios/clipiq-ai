-- Phase 4: persist the existing mock analysis lifecycle per user.
alter table public.jobs add column if not exists external_job_id text unique;
