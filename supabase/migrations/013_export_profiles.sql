-- ClipIQ Phase 6: export profiles and caption preferences.
-- Run after migrations 006-012.

alter table public.exports
  add column if not exists aspect_ratio text not null default '16:9',
  add column if not exists caption_style text not null default 'default',
  add column if not exists status text not null default 'saved',
  add column if not exists error text;

alter table public.exports
  drop constraint if exists exports_profile_check;
alter table public.exports
  add constraint exports_profile_check
  check (aspect_ratio in ('16:9', '9:16', '1:1') and caption_style in ('default', 'bold', 'subtitle', 'comic'));
