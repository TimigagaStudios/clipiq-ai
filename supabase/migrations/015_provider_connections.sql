-- ClipIQ Phase 6: provider connection metadata.
-- Run after migrations 006-014.
-- Access/refresh tokens are intentionally not stored by the browser schema.

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  provider_account_name text,
  scopes text[] not null default '{}',
  token_expires_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
create index if not exists idx_provider_connections_user on public.provider_connections (user_id);
alter table public.provider_connections enable row level security;
create policy "provider_connections_self_all" on public.provider_connections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger trg_provider_connections_updated_at before update on public.provider_connections for each row execute function public.set_updated_at();

alter table public.provider_connections drop constraint if exists provider_connection_provider_check;
alter table public.provider_connections add constraint provider_connection_provider_check check (provider in ('youtube','instagram','tiktok'));
alter table public.provider_connections drop constraint if exists provider_connection_status_check;
alter table public.provider_connections add constraint provider_connection_status_check check (status in ('connected','expired','error','disconnected'));
