-- ClipIQ Phase 6: provider-neutral publishing requests.
-- Run after migrations 006-013.

create table if not exists public.publish_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  clip_id uuid not null references public.clips(id) on delete cascade,
  platform text not null,
  title text,
  description text,
  hashtags text[] not null default '{}',
  status text not null default 'queued',
  provider_post_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists idx_publish_requests_user_created on public.publish_requests (user_id, created_at desc);
create index if not exists idx_publish_requests_queue on public.publish_requests (status, created_at);
alter table public.publish_requests enable row level security;
create policy "publish_requests_self_all" on public.publish_requests for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_publish_requests_updated_at before update on public.publish_requests for each row execute function public.set_updated_at();

alter table public.publish_requests drop constraint if exists publish_platform_check;
alter table public.publish_requests add constraint publish_platform_check check (platform in ('TikTok','Instagram','YouTube'));
