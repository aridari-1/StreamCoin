-- ═══════════════════════════════════════════════════════════
--  StreamCoin — YouTube platform columns
--  Run after 001_initial.sql
-- ═══════════════════════════════════════════════════════════

-- Add YouTube-specific columns to streamers table
alter table public.streamers
  add column if not exists youtube_id              text unique,
  add column if not exists youtube_username        text,
  add column if not exists youtube_handle          text,
  add column if not exists youtube_avatar          text,
  add column if not exists youtube_access_token    text,   -- encrypted at rest
  add column if not exists youtube_refresh_token   text;   -- encrypted at rest

-- Drop Twitch columns (YouTube-only platform for now)
alter table public.streamers
  drop column if exists twitch_id,
  drop column if exists twitch_username,
  drop column if exists twitch_avatar,
  drop column if exists twitch_access_token,
  drop column if exists twitch_refresh_token;

-- Update platform check on stream_sessions
alter table public.stream_sessions
  drop constraint if exists stream_sessions_platform_check;

alter table public.stream_sessions
  add constraint stream_sessions_platform_check
  check (platform in ('youtube', 'twitch', 'kick'));

-- Index on youtube_id for fast lookup during OAuth callback
create index if not exists idx_streamers_youtube_id
  on public.streamers(youtube_id);
