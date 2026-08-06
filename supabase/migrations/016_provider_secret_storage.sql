-- ClipIQ Phase 6: encrypted provider secret storage boundary.
-- Run after 015. Ciphertext is written only by server-side OAuth callbacks.

create table if not exists public.provider_secrets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  encrypted_access_token text,
  encrypted_refresh_token text,
  encryption_iv text not null,
  encryption_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);
create index if not exists idx_provider_secrets_user on public.provider_secrets (user_id);
alter table public.provider_secrets enable row level security;
-- No authenticated select/insert/update/delete policies are intentional.
-- Only a server-side service-role callback may access this table.
create trigger trg_provider_secrets_updated_at before update on public.provider_secrets for each row execute function public.set_updated_at();
revoke all on table public.provider_secrets from anon, authenticated;
