-- ═══════════════════════════════════════════════════════════
--  StreamCoin — Schedule poll-streamers edge function
--  Run this in Supabase SQL Editor after deploying the function
-- ═══════════════════════════════════════════════════════════

-- Enable pg_cron extension (may already be enabled)
create extension if not exists pg_cron;

-- Schedule the edge function every 60 seconds
-- Supabase edge functions are called via HTTP from pg_cron
select cron.schedule(
  'poll-streamers',          -- job name
  '* * * * *',               -- every minute (Supabase supports this unlike Vercel Hobby)
  $$
  select net.http_post(
    url     := (select value from vault.secrets where name = 'APP_URL') || '/api/tracker/poll',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select value from vault.secrets where name = 'CRON_SECRET'),
      'Content-Type',  'application/json'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Alternative: call the Supabase Edge Function directly ────
-- This is more reliable than calling your Vercel URL
-- because it stays within Supabase's own network

-- First store secrets in vault (run these separately):
-- select vault.create_secret('your-vercel-url', 'APP_URL');
-- select vault.create_secret('your-cron-secret', 'CRON_SECRET');

-- ─── View scheduled jobs ──────────────────────────────────────
-- select * from cron.job;

-- ─── View recent job runs ─────────────────────────────────────
-- select * from cron.job_run_details order by start_time desc limit 20;

-- ─── Unschedule if needed ─────────────────────────────────────
-- select cron.unschedule('poll-streamers');
