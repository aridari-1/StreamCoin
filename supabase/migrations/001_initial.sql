-- ═══════════════════════════════════════════════════════════
--  StreamCoin Platform — Initial Database Schema
--  Run via: supabase db push
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Streamers ───────────────────────────────────────────────
create table public.streamers (
  id                  uuid primary key default uuid_generate_v4(),
  wallet_address      text unique not null,
  twitch_id           text unique,
  twitch_username     text,
  twitch_avatar       text,
  twitch_access_token text,          -- encrypted at rest
  twitch_refresh_token text,         -- encrypted at rest
  youtube_id          text unique,
  youtube_username    text,
  avg_viewers         integer default 0,
  tier                text default 'standard' check (tier in ('standard','affiliate','partner')),
  streak_days         integer default 0,
  last_active_day     date,
  total_stmc_earned   numeric(20,6) default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Stream Sessions ─────────────────────────────────────────
create table public.stream_sessions (
  id                  uuid primary key default uuid_generate_v4(),
  streamer_id         uuid references public.streamers(id) on delete cascade,
  platform            text not null check (platform in ('twitch','youtube','kick')),
  stream_id           text not null,                   -- platform stream ID
  title               text,
  started_at          timestamptz not null,
  ended_at            timestamptz,
  duration_minutes    integer default 0,
  duration_hours      integer default 0,
  peak_viewers        integer default 0,
  avg_viewers         integer default 0,
  verified_viewers    integer default 0,               -- oracle-verified count
  chat_ratio          numeric(8,4) default 0,          -- msgs/min ÷ viewers
  stmc_earned         numeric(20,6) default 0,
  epoch_mult          numeric(10,6) default 1,
  partner_mult        numeric(5,2) default 1,
  duration_mult       numeric(5,2) default 1,
  status              text default 'live' check (status in ('live','ended','pending_reward','rewarded')),
  oracle_packet_id    text unique,
  tx_hash             text,
  created_at          timestamptz default now()
);

-- ─── Viewers ─────────────────────────────────────────────────
create table public.viewers (
  id                  uuid primary key default uuid_generate_v4(),
  wallet_address      text unique not null,
  platform_id         text,
  streak_days         integer default 0,
  last_active_day     date,
  daily_earned        numeric(20,6) default 0,
  daily_reset_at      date default current_date,
  total_earned        numeric(20,6) default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Reward Events ───────────────────────────────────────────
create table public.reward_events (
  id                  uuid primary key default uuid_generate_v4(),
  recipient_id        uuid not null,
  recipient_type      text not null check (recipient_type in ('streamer','viewer')),
  wallet_address      text not null,
  amount              numeric(20,6) not null,
  tx_hash             text,
  block_number        bigint,
  session_id          uuid references public.stream_sessions(id),
  packet_id           text unique,
  status              text default 'pending' check (status in ('pending','minted','failed')),
  error_msg           text,
  created_at          timestamptz default now()
);

-- ─── Oracle Packets ──────────────────────────────────────────
create table public.oracle_packets (
  id                  uuid primary key default uuid_generate_v4(),
  packet_id           text unique not null,
  packet_type         text not null check (packet_type in ('streamer','viewer')),
  payload             jsonb not null,
  signatures          jsonb not null,                  -- array of oracle sigs
  status              text default 'pending' check (status in ('pending','submitted','confirmed','rejected')),
  rejection_reason    text,
  tx_hash             text,
  submitted_at        timestamptz,
  created_at          timestamptz default now()
);

-- ─── Platform Stats (daily snapshots) ────────────────────────
create table public.platform_stats (
  id                  uuid primary key default uuid_generate_v4(),
  date                date unique not null default current_date,
  active_streamers    integer default 0,
  active_viewers      integer default 0,
  total_stmc_minted   numeric(20,6) default 0,
  total_streams       integer default 0,
  avg_viewers         integer default 0,
  created_at          timestamptz default now()
);

-- ─── Indexes ─────────────────────────────────────────────────
create index idx_stream_sessions_streamer  on public.stream_sessions(streamer_id);
create index idx_stream_sessions_status    on public.stream_sessions(status);
create index idx_stream_sessions_started   on public.stream_sessions(started_at desc);
create index idx_reward_events_recipient   on public.reward_events(recipient_id);
create index idx_reward_events_status      on public.reward_events(status);
create index idx_oracle_packets_status     on public.oracle_packets(status);

-- ─── Updated_at trigger ──────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger streamers_updated_at
  before update on public.streamers
  for each row execute function update_updated_at();

create trigger viewers_updated_at
  before update on public.viewers
  for each row execute function update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────
alter table public.streamers      enable row level security;
alter table public.stream_sessions enable row level security;
alter table public.viewers         enable row level security;
alter table public.reward_events   enable row level security;
alter table public.oracle_packets  enable row level security;

-- Streamers can only read/write their own row
create policy "streamer_own_row" on public.streamers
  for all using (wallet_address = current_setting('app.wallet', true));

-- Sessions are readable by the streamer who owns them
create policy "session_owner" on public.stream_sessions
  for all using (
    streamer_id in (
      select id from public.streamers
      where wallet_address = current_setting('app.wallet', true)
    )
  );

-- Reward events readable by recipient
create policy "reward_recipient" on public.reward_events
  for select using (wallet_address = current_setting('app.wallet', true));

-- Platform stats are public read
create policy "stats_public_read" on public.platform_stats
  for select using (true);
