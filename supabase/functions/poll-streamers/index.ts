import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const YT_API           = 'https://www.googleapis.com/youtube/v3'
const OAUTH_TOKEN_URL  = 'https://oauth2.googleapis.com/token'
const YT_CLIENT_ID     = Deno.env.get('YOUTUBE_CLIENT_ID')!
const YT_CLIENT_SECRET = Deno.env.get('YOUTUBE_CLIENT_SECRET')!
const BOT_RATIO_MIN    = 0.001
const BOT_VIEWER_MIN   = 10      // skip bot check below this
const LARGE_STREAM     = 50_000
const POLL_MIN         = 1

Deno.serve(async (req) => {
  const startTime = Date.now()
  const supabase  = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const { data: streamers } = await supabase
    .from('streamers')
    .select('id, wallet_address, youtube_id, youtube_username, youtube_access_token, youtube_refresh_token, avg_viewers, tier, active_session_id')
    .not('youtube_id', 'is', null)
    .not('youtube_refresh_token', 'is', null)

  if (!streamers?.length) {
    return new Response(JSON.stringify({ ok: true, polled: 0 }))
  }

  const results = await Promise.allSettled(
    streamers.map((s: any) => pollStreamer(supabase, s))
  )

  const out     = results.map(r => r.status === 'fulfilled' ? r.value : { status: 'error' })
  const live    = out.filter((r: any) => r.status === 'live').length
  const elapsed = Date.now() - startTime

  return new Response(JSON.stringify({ ok: true, elapsed_ms: elapsed, polled: streamers.length, live, results: out }), {
    headers: { 'Content-Type': 'application/json' }
  })
})

async function pollStreamer(supabase: any, streamer: any) {
  let token = streamer.youtube_access_token
  if (!(await probeToken(token))) {
    const fresh = await refreshToken(streamer.youtube_refresh_token)
    if (!fresh) return { status: 'error', message: 'Token expired' }
    token = fresh
    await supabase.from('streamers').update({ youtube_access_token: fresh }).eq('id', streamer.id)
  }

  const broadcast = await getLiveBroadcast(token)
  if (!broadcast) {
    if (streamer.active_session_id) await closeSession(supabase, streamer)
    return { status: 'not_live' }
  }

  let chatRate = 1
  try { chatRate = await getChatRate(broadcast.liveChatId, token) } catch { /* ok */ }
  const viewers   = broadcast.concurrentViewers
  const chatRatio = viewers > 0 ? chatRate / viewers : 1

  // Only flag as bot above BOT_VIEWER_MIN
  const isBot = viewers >= BOT_VIEWER_MIN && viewers < LARGE_STREAM && chatRatio < BOT_RATIO_MIN

  const sessId = await upsertSession(supabase, streamer, broadcast, viewers)

  await supabase.from('stream_snapshots').insert({
    session_id:   sessId,
    streamer_id:  streamer.id,
    broadcast_id: broadcast.id,
    viewers,
    chat_ratio:   chatRatio,
    status:       isBot ? 'bot_suspect' : 'ok',
    snapshot_at:  new Date().toISOString(),
  })

  if (isBot) return { status: 'bot_suspect', viewers, message: `ratio=${chatRatio.toFixed(5)}` }

  const { data: sess } = await supabase.from('stream_sessions').select('*').eq('id', sessId).single()
  const hoursLive = sess ? (Date.now() - new Date(sess.started_at).getTime()) / 3_600_000 : 1
  const reward    = calcReward(viewers, POLL_MIN, Math.max(1, Math.ceil(hoursLive)), streamer.avg_viewers)
  const snapCount = (sess?.snapshot_count ?? 0) + 1

  await supabase.from('stream_sessions').update({
    stmc_earned:      Number(sess?.stmc_earned ?? 0) + reward,
    verified_viewers: viewers,
    avg_viewers:      Math.round(((sess?.avg_viewers ?? viewers) * (snapCount - 1) + viewers) / snapCount),
    peak_viewers:     Math.max(sess?.peak_viewers ?? 0, viewers),
    duration_minutes: Math.round(hoursLive * 60),
    duration_hours:   Math.floor(hoursLive),
    chat_ratio:       chatRatio,
    snapshot_count:   snapCount,
  }).eq('id', sessId)

  return { status: 'live', viewers, reward }
}

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
  const durMin = sess ? Math.floor((Date.now() - new Date(sess.started_at).getTime()) / 60_000) : 0

  await supabase.from('stream_sessions').update({
    status: 'pending_reward', ended_at: new Date().toISOString(),
    duration_minutes: durMin, duration_hours: Math.floor(durMin / 60),
  }).eq('id', streamer.active_session_id)

  await supabase.from('streamers').update({ active_session_id: null }).eq('id', streamer.id)
}

async function probeToken(token: string) {
  try {
    const r = await fetch(`${YT_API}/channels?part=id&mine=true`, { headers: { Authorization: `Bearer ${token}` } })
    return r.ok
  } catch { return false }
}

async function refreshToken(refreshToken: string) {
  try {
    const r = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ refresh_token: refreshToken, client_id: YT_CLIENT_ID, client_secret: YT_CLIENT_SECRET, grant_type: 'refresh_token' }),
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
  const b = d.items?.find((x: any) => x.status?.lifeCycleStatus === 'live' || x.status?.lifeCycleStatus === 'liveStarting')
  if (!b) return null

  let concurrentViewers = 0
  const vr = await fetch(`${YT_API}/videos?part=liveStreamingDetails&id=${b.id}`, { headers: { Authorization: `Bearer ${token}` } })
  if (vr.ok) {
    const vd = await vr.json()
    concurrentViewers = parseInt(vd.items?.[0]?.liveStreamingDetails?.concurrentViewers ?? '0')
  }

  return {
    id: b.id, title: b.snippet?.title ?? 'Live stream', status: 'live' as const,
    concurrentViewers, startedAt: b.snippet?.actualStartTime ?? new Date().toISOString(),
    liveChatId: b.snippet?.liveChatId ?? '',
  }
}

async function getChatRate(liveChatId: string, token: string) {
  if (!liveChatId) return 1
  const r = await fetch(`${YT_API}/liveChat/messages?liveChatId=${liveChatId}&part=snippet&maxResults=200`, { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return 1
  const d   = await r.json()
  const now = Date.now()
  return (d.items ?? []).filter((m: any) => now - new Date(m.snippet?.publishedAt ?? 0).getTime() < 60_000).length
}

function calcReward(viewers: number, minutes: number, hours: number, avgViewers: number) {
  const DEPLOY = new Date('2026-01-01').getTime() / 1000
  const year   = Math.floor((Date.now() / 1000 - DEPLOY) / (365 * 86400)) + 1
  const epoch  = Math.pow(0.75, year - 1)
  const partner = avgViewers >= 500 ? 1.5 : avgViewers >= 100 ? 1.25 : 1.0
  const duration = hours >= 8 ? 1.2 : hours >= 4 ? 1.1 : hours >= 1 ? 1.05 : 1.0
  return Math.min(viewers * 0.00002 * epoch * partner * duration * minutes, 10 * hours)
}