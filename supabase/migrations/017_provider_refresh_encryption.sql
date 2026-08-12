-- ClipIQ Phase 6: separate refresh-token encryption metadata.
-- Run after 016 before enabling provider publishing.

alter table public.provider_secrets
  add column if not exists refresh_encryption_iv text,
  add column if not exists refresh_encryption_tag text;
