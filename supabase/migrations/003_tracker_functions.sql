-- ═══════════════════════════════════════════════════════════
--  StreamCoin — Tracker helper functions
--  Run after 002_youtube.sql
-- ═══════════════════════════════════════════════════════════

-- Atomic STMC increment — prevents race conditions when
-- multiple sessions close at the same time
create or replace function increment_stmc(row_id uuid, amount numeric)
returns numeric
language plpgsql
security definer
as $$
declare
  new_total numeric;
begin
  update public.streamers
  set total_stmc_earned = total_stmc_earned + amount
  where id = row_id
  returning total_stmc_earned into new_total;
  return new_total;
end;
$$;

-- Get streamer live status with session info
create or replace function get_live_streamers()
returns table (
  streamer_id   uuid,
  youtube_id    text,
  wallet        text,
  session_id    uuid,
  started_at    timestamptz,
  viewers       integer,
  earned_so_far numeric
)
language sql
security definer
as $$
  select
    s.id            as streamer_id,
    s.youtube_id,
    s.wallet_address as wallet,
    ss.id           as session_id,
    ss.started_at,
    ss.verified_viewers as viewers,
    ss.stmc_earned  as earned_so_far
  from public.streamers s
  join public.stream_sessions ss
    on ss.streamer_id = s.id
   and ss.status = 'live'
  order by ss.started_at desc;
$$;

-- Platform-wide stats snapshot (called daily by cron)
create or replace function snapshot_platform_stats()
returns void
language plpgsql
security definer
as $$
begin
  insert into public.platform_stats (
    date,
    active_streamers,
    active_viewers,
    total_stmc_minted,
    total_streams,
    avg_viewers
  )
  select
    current_date,
    count(distinct s.id) filter (where ss.status = 'live'),
    coalesce(sum(ss.verified_viewers) filter (where ss.status = 'live'), 0),
    coalesce(sum(s.total_stmc_earned), 0),
    count(ss.id),
    coalesce(avg(ss.avg_viewers)::integer, 0)
  from public.streamers s
  left join public.stream_sessions ss on ss.streamer_id = s.id
  on conflict (date) do update set
    active_streamers  = excluded.active_streamers,
    active_viewers    = excluded.active_viewers,
    total_stmc_minted = excluded.total_stmc_minted,
    total_streams     = excluded.total_streams,
    avg_viewers       = excluded.avg_viewers;
end;
$$;

-- Auto-close sessions that have been "live" for over 24 hours
-- (safety net in case the streamer's token expired mid-stream)
create or replace function cleanup_stale_sessions()
returns integer
language plpgsql
security definer
as $$
declare
  closed_count integer;
begin
  update public.stream_sessions
  set
    status    = 'ended',
    ended_at  = now()
  where
    status     = 'live'
    and started_at < now() - interval '24 hours';

  get diagnostics closed_count = row_count;
  return closed_count;
end;
$$;
