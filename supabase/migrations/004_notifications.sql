-- Phase 4: per-user notification read state.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  detail text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user_created on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "notifications_self_all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
