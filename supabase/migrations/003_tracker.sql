-- ═══════════════════════════════════════════════════════════
--  StreamCoin — Tracker tables
--  Run after 002_youtube.sql
-- ═══════════════════════════════════════════════════════════

-- ─── Stream Snapshots (one row per 60-second poll) ───────────
create table if not exists public.stream_snapshots (
  id           uuid primary key default uuid_generate_v4(),
  session_id   uuid references public.stream_sessions(id) on delete cascade,
  streamer_id  uuid references public.streamers(id) on delete cascade,
  broadcast_id text not null,
  viewers      integer not null default 0,
  chat_ratio   numeric(10,6) default 0,
  status       text default 'ok' check (status in ('ok','bot_suspect')),
  snapshot_at  timestamptz not null default now()
);

create index idx_snapshots_session  on public.stream_snapshots(session_id);
create index idx_snapshots_streamer on public.stream_snapshots(streamer_id);
create index idx_snapshots_at       on public.stream_snapshots(snapshot_at desc);

-- ─── Add missing columns to existing tables ──────────────────

-- streamers: active session pointer
alter table public.streamers
  add column if not exists active_session_id uuid references public.stream_sessions(id);

-- stream_sessions: tracker fields
alter table public.stream_sessions
  add column if not exists snapshot_count  integer default 0,
  add column if not exists tx_hash         text;

-- oracle_packets: add session and wallet refs
alter table public.oracle_packets
  add column if not exists session_id      uuid references public.stream_sessions(id),
  add column if not exists wallet          text,
  add column if not exists expected_reward numeric(20,6) default 0;

-- ─── RLS for snapshots ───────────────────────────────────────
alter table public.stream_snapshots enable row level security;

create policy "snapshot_owner" on public.stream_snapshots
  for select using (
    streamer_id in (
      select id from public.streamers
      where wallet_address = current_setting('app.wallet', true)
    )
  );

-- ─── Helper function: increment poll count ───────────────────
create or replace function increment_poll_count()
returns integer language plpgsql as $$
begin
  return 1; -- placeholder, used in upsert
end;
$$;

-- ─── Platform stats: add poll_count column ───────────────────
alter table public.platform_stats
  add column if not exists poll_count integer default 0;
