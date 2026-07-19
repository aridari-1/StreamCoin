// supabase/functions/poll-streamers/index.ts
//
// Supabase Edge Function — runs every 60 seconds via pg_cron
// Replaces the Vercel cron which requires a paid plan
//
// Deploy:  supabase functions deploy poll-streamers
// Schedule: set in Supabase dashboard → Edge Functions → Schedule
//           OR via SQL: select cron.schedule('poll-streamers', '* * * * *', ...)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL           = Deno.env.get('APP_URL')!           // your Vercel URL
const POLL_SECRET       = Deno.env.get('CRON_SECRET') ?? ''

// ── Constants ─────────────────────────────────────────────────
const YT_API            = 'https://www.googleapis.com/youtube/v3'
const OAUTH_TOKEN_URL   = 'https://oauth2.googleapis.com/token'
const YT_CLIENT_ID      = Deno.env.get('YOUTUBE_CLIENT_ID')!
const YT_CLIENT_SECRET  = Deno.env.get('YOUTUBE_CLIENT_SECRET')!
const BOT_RATIO_MIN     = 0.005
const LARGE_STREAM_FLOOR = 50_000
const POLL_INTERVAL_MIN  = 1

// ─────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const startTime = Date.now()

  // Auth check — Supabase calls this with the service key as Authorization
  // We also accept our own CRON_SECRET for manual calls
  const auth = req.headers.get('authorization') ?? ''
  if (
    POLL_SECRET &&
    auth !== `Bearer ${POLL_SECRET}` &&
    auth !== `Bearer ${SERVICE_ROLE_KEY}`
  ) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ── Load all connected streamers ─────────────────────────
  const { data: streamers, error } = await supabase
    .from('streamers')
    .select('id, wallet_address, youtube_id, youtube_username, youtube_access_token, youtube_refresh_token, avg_viewers, tier, active_session_id')
    .not('youtube_id', 'is', null)
    .not('youtube_refresh_token', 'is', null)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  if (!streamers?.length) {
    return new Response(JSON.stringify({ ok: true, polled: 0, message: 'No streamers connected' }))
  }

  console.log(`[Poll] Checking ${streamers.length} streamer(s)`)

  // ── Poll each streamer ────────────────────────────────────
  const results = await Promise.allSettled(
    streamers.map(s => pollStreamer(supabase, s))
  )

  const out = results.map(r =>
    r.status === 'fulfilled' ? r.value : { status: 'error', message: String(r.reason) }
  )

  const live    = out.filter(r => r.status === 'live').length
  const ended   = out.filter(r => r.status === 'ended').length
  const errors  = out.filter(r => r.status === 'error').length
  const elapsed = Date.now() - startTime

  console.log(`[Poll] Done ${elapsed}ms — live:${live} ended:${ended} errors:${errors}`)

  return new Response(JSON.stringify({
    ok: true, elapsed_ms: elapsed, polled: streamers.length,
    live, ended, errors, results: out,
  }), { headers: { 'Content-Type': 'application/json' } })
})

// ─────────────────────────────────────────────────────────────
//  POLL ONE STREAMER
// ─────────────────────────────────────────────────────────────
async function pollStreamer(supabase: any, streamer: any) {
  // 1. Ensure valid token
  let token = streamer.youtube_access_token
  if (!(await probeToken(token))) {
    const fresh = await refreshToken(streamer.youtube_refresh_token)
    if (!fresh) {
      await supabase.from('streamers').update({ youtube_access_token: null }).eq('id', streamer.id)
      return { status: 'error', message: 'Token expired', youtubeId: streamer.youtube_id }
    }
    token = fresh
    await supabase.from('streamers').update({ youtube_access_token: fresh }).eq('id', streamer.id)
  }

  // 2. Check if live
  const broadcast = await getLiveBroadcast(token)
  if (!broadcast) {
    if (streamer.active_session_id) {
      await closeSession(supabase, streamer)
    }
    return { status: 'not_live', youtubeId: streamer.youtube_id }
  }

  // 3. Chat authenticity ratio (bot detection)
  let chatRate = 1
  try { chatRate = await getChatRate(broadcast.liveChatId, token) } catch { /* ok */ }
  const viewers   = broadcast.concurrentViewers
  const chatRatio = viewers > 0 ? chatRate / viewers : 1
  const isBot     = viewers < LARGE_STREAM_FLOOR && chatRatio < BOT_RATIO_MIN

  // 4. Upsert session
  const sessId = await upsertSession(supabase, streamer, broadcast, viewers)

  // 5. Write snapshot
  await supabase.from('stream_snapshots').insert({
    session_id:   sessId,
    streamer_id:  streamer.id,
    broadcast_id: broadcast.id,
    viewers,
    chat_ratio:   chatRatio,
    status:       isBot ? 'bot_suspect' : 'ok',
    snapshot_at:  new Date().toISOString(),
  })

  if (isBot) return { status: 'bot_suspect', viewers, youtubeId: streamer.youtube_id }

  // 6. Calculate reward for this 60-second window
  const { data: sess } = await supabase
    .from('stream_sessions').select('*').eq('id', sessId).single()

  const hoursLive = sess
    ? (Date.now() - new Date(sess.started_at).getTime()) / 3_600_000
    : 1

  const reward = calcStreamReward(viewers, POLL_INTERVAL_MIN, Math.max(1, Math.ceil(hoursLive)), streamer.avg_viewers)
  const snapCount = (sess?.snapshot_count ?? 0) + 1

  await supabase.from('stream_sessions').update({
    stmc_earned:      (Number(sess?.stmc_earned ?? 0)) + reward,
    verified_viewers: viewers,
    avg_viewers:      Math.round(((sess?.avg_viewers ?? viewers) * (snapCount - 1) + viewers) / snapCount),
    peak_viewers:     Math.max(sess?.peak_viewers ?? 0, viewers),
    duration_minutes: Math.round(hoursLive * 60),
    duration_hours:   Math.floor(hoursLive),
    chat_ratio:       chatRatio,
    epoch_mult:       epochMultiplier(),
    partner_mult:     partnerMult(streamer.avg_viewers),
    duration_mult:    durationMult(Math.ceil(hoursLive)),
    snapshot_count:   snapCount,
  }).eq('id', sessId)

  console.log(`[Poll] ${streamer.youtube_username} — ${viewers} viewers — +${reward.toFixed(4)} STMC`)
  return { status: 'live', viewers, reward, sessionId: sessId, youtubeId: streamer.youtube_id }
}

// ─────────────────────────────────────────────────────────────
//  SESSION HELPERS
// ─────────────────────────────────────────────────────────────
async function upsertSession(supabase: any, streamer: any, broadcast: any, viewers: number) {
  if (streamer.active_session_id) {
    const { data: ex } = await supabase
      .from('stream_sessions').select('id, stream_id')
      .eq('id', streamer.active_session_id).eq('status', 'live').single()
    if (ex?.stream_id === broadcast.id) return ex.id
  }

  const { data: ns } = await supabase.from('stream_sessions').insert({
    streamer_id: streamer.id, platform: 'youtube',
    stream_id: broadcast.id, title: broadcast.title,
    started_at: broadcast.startedAt,
    peak_viewers: viewers, avg_viewers: viewers, verified_viewers: viewers,
    status: 'live', stmc_earned: 0, snapshot_count: 0,
  }).select('id').single()

  await supabase.from('streamers').update({ active_session_id: ns.id }).eq('id', streamer.id)
  return ns.id
}

async function closeSession(supabase: any, streamer: any) {
  const { data: sess } = await supabase
    .from('stream_sessions').select('*').eq('id', streamer.active_session_id).single()

  const durMin = sess
    ? Math.floor((Date.now() - new Date(sess.started_at).getTime()) / 60_000)
    : 0

  await supabase.from('stream_sessions').update({
    status: 'pending_reward', ended_at: new Date().toISOString(),
    duration_minutes: durMin, duration_hours: Math.floor(durMin / 60),
  }).eq('id', streamer.active_session_id)

  await supabase.from('streamers').update({ active_session_id: null }).eq('id', streamer.id)

  // Queue oracle packet if earned > 0
  if (sess && Number(sess.stmc_earned) > 0) {
    const packetId = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    await supabase.from('oracle_packets').insert({
      packet_id: packetId, packet_type: 'streamer',
      session_id: sess.id, wallet: streamer.wallet_address,
      payload: {
        packetId, timestamp: Math.floor(Date.now() / 1000),
        streamer: streamer.wallet_address,
        verifiedViewers: sess.verified_viewers ?? 0,
        streamMinutes: durMin,
        streamHours: Math.floor(durMin / 60),
        avgViewers: streamer.avg_viewers,
        chatRatioX1000: Math.round((sess.chat_ratio ?? 0) * 1000),
        platformSource: 0,
      },
      signatures: [], status: 'pending',
      expected_reward: sess.stmc_earned,
    })

    await supabase.from('stream_sessions')
      .update({ oracle_packet_id: packetId }).eq('id', sess.id)
  }
}

// ─────────────────────────────────────────────────────────────
//  YOUTUBE API HELPERS
// ─────────────────────────────────────────────────────────────
async function probeToken(token: string) {
  try {
    const r = await fetch(`${YT_API}/channels?part=id&mine=true`,
      { headers: { Authorization: `Bearer ${token}` } })
    return r.ok
  } catch { return false }
}

async function refreshToken(refreshToken: string) {
  try {
    const r = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     YT_CLIENT_ID,
        client_secret: YT_CLIENT_SECRET,
        grant_type:    'refresh_token',
      }),
    })
    if (!r.ok) return null
    const d = await r.json()
    return d.access_token ?? null
  } catch { return null }
}

async function getLiveBroadcast(token: string) {
  const r = await fetch(
    `${YT_API}/liveBroadcasts?part=snippet,status&broadcastStatus=active&broadcastType=all`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!r.ok) return null
  const d = await r.json()
  const b = d.items?.[0]
  if (!b || b.status?.lifeCycleStatus !== 'live') return null

  const streamId = b.snippet?.boundStreamId
  let concurrentViewers = 0
  if (streamId) {
    const sr = await fetch(`${YT_API}/liveStreams?part=status&id=${streamId}`,
      { headers: { Authorization: `Bearer ${token}` } })
    if (sr.ok) {
      const sd = await sr.json()
      concurrentViewers = parseInt(sd.items?.[0]?.status?.concurrentViewers ?? '0')
    }
  }

  return {
    id:               b.id,
    title:            b.snippet?.title ?? 'Live stream',
    status:           'live' as const,
    concurrentViewers,
    startedAt:        b.snippet?.actualStartTime ?? new Date().toISOString(),
    liveChatId:       b.snippet?.liveChatId ?? '',
  }
}

async function getChatRate(liveChatId: string, token: string) {
  if (!liveChatId) return 1
  const r = await fetch(
    `${YT_API}/liveChat/messages?liveChatId=${liveChatId}&part=snippet&maxResults=200`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (!r.ok) return 1
  const d    = await r.json()
  const msgs = d.items ?? []
  const now  = Date.now()
  return msgs.filter((m: any) =>
    Date.now() - new Date(m.snippet?.publishedAt ?? 0).getTime() < 60_000
  ).length
}

// ─────────────────────────────────────────────────────────────
//  REWARD FORMULA (mirrors StreamCoin.sol v3)
// ─────────────────────────────────────────────────────────────
function epochMultiplier() {
  const DEPLOY = new Date('2026-01-01').getTime() / 1000
  const year   = Math.floor((Date.now() / 1000 - DEPLOY) / (365 * 86400)) + 1
  return Math.pow(0.75, year - 1)
}

function partnerMult(avgViewers: number) {
  return avgViewers >= 500 ? 1.5 : avgViewers >= 100 ? 1.25 : 1.0
}

function durationMult(hours: number) {
  return hours >= 8 ? 1.2 : hours >= 4 ? 1.1 : hours >= 1 ? 1.05 : 1.0
}

function calcStreamReward(viewers: number, minutes: number, hours: number, avgViewers: number) {
  const base   = viewers * 0.00002
  const reward = base * epochMultiplier() * partnerMult(avgViewers) * durationMult(hours) * minutes
  return Math.min(reward, 10 * hours)   // 10 STMC hard cap per hour
}
