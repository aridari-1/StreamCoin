// ─────────────────────────────────────────────────────────────
//  StreamCoin Live Session Tracker
//
//  Every 60s this module:
//    1. Calls YouTube Live API for each connected streamer
//    2. Verifies viewer count + bot detection via chat ratio
//    3. Writes a snapshot to stream_snapshots (audit trail)
//    4. Updates the active stream_session record
//    5. Detects stream end → closes session → queues oracle packet
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getLiveBroadcast,
  getLiveChatRate,
  refreshYouTubeToken,
  type YTLiveBroadcast,
} from '@/lib/youtube'
import {
  calcStreamReward,
  epochMultiplier,
  partnerMultiplier,
  durationMultiplier,
} from '@/lib/rewards'
import { buildOraclePacket } from '@/lib/tracker/oracle'

// ── Constants ─────────────────────────────────────────────────
const POLL_INTERVAL_MIN  = 1      // 1 minute per poll
const BOT_RATIO_MIN      = 0.005  // msgs/viewer/min — below = bot suspect
const LARGE_STREAM_FLOOR = 50_000 // exempt from chat ratio check
const MAX_SESSION_HOURS  = 24     // auto-close safety limit

// ── Types ─────────────────────────────────────────────────────
export interface ActiveStreamer {
  id:                    string
  wallet_address:        string
  youtube_id:            string
  youtube_username:      string
  youtube_access_token:  string
  youtube_refresh_token: string
  avg_viewers:           number
  tier:                  string
  active_session_id:     string | null
}

export interface PollResult {
  streamerId: string
  youtubeId:  string
  status:     'live' | 'ended' | 'not_live' | 'error' | 'bot_suspect'
  viewers:    number
  sessionId?: string
  reward?:    number
  message?:   string
}

// ─────────────────────────────────────────────────────────────
//  MAIN — poll all streamers
// ─────────────────────────────────────────────────────────────
export async function pollAllStreamers(
  supabase: SupabaseClient
): Promise<PollResult[]> {
  const { data: streamers, error } = await supabase
    .from('streamers')
    .select('id, wallet_address, youtube_id, youtube_username, youtube_access_token, youtube_refresh_token, avg_viewers, tier, active_session_id')
    .not('youtube_id', 'is', null)
    .not('youtube_access_token', 'is', null)

  if (error || !streamers?.length) {
    console.log('[Tracker] No streamers to poll')
    return []
  }

  console.log(`[Tracker] Polling ${streamers.length} streamer(s)`)

  const settled = await Promise.allSettled(
    streamers.map(s => pollOneStreamer(supabase, s as ActiveStreamer))
  )

  return settled.map(r =>
    r.status === 'fulfilled'
      ? r.value
      : { streamerId: '', youtubeId: '', status: 'error' as const, viewers: 0, message: String(r.reason) }
  )
}

// ─────────────────────────────────────────────────────────────
//  POLL ONE STREAMER
// ─────────────────────────────────────────────────────────────
async function pollOneStreamer(
  supabase: SupabaseClient,
  streamer: ActiveStreamer
): Promise<PollResult> {

  // 1. Refresh token if needed
  let token = streamer.youtube_access_token
  const ok  = await probeToken(token)
  if (!ok) {
    const fresh = await refreshYouTubeToken(streamer.youtube_refresh_token)
    if (!fresh) {
      await supabase.from('streamers').update({ youtube_access_token: null }).eq('id', streamer.id)
      return mkResult(streamer, 'error', 0, 'Token expired — reconnect YouTube')
    }
    token = fresh
    await supabase.from('streamers').update({ youtube_access_token: fresh }).eq('id', streamer.id)
  }

  // 2. Get live broadcast from YouTube
  let broadcast: YTLiveBroadcast | null
  try {
    broadcast = await getLiveBroadcast(token)
  } catch (e) {
    return mkResult(streamer, 'error', 0, `YouTube API error: ${e}`)
  }

  // 3. Not live — close any open session
  if (!broadcast || broadcast.status !== 'live') {
    if (streamer.active_session_id) {
      const sess = await fetchSession(supabase, streamer.active_session_id)
      await closeSession(supabase, streamer, sess)
    }
    return mkResult(streamer, 'not_live', 0)
  }

  // 4. Bot detection — check chat activity ratio
  let chatRate = 1
  try { chatRate = await getLiveChatRate(broadcast.liveChatId, token) } catch { /* ignore */ }
  const viewers   = broadcast.concurrentViewers
  const chatRatio = viewers > 0 ? chatRate / viewers : 1
  const isBotted  = viewers < LARGE_STREAM_FLOOR && chatRatio < BOT_RATIO_MIN

  // 5. Write snapshot (always — bot or not)
  const sessId = await upsertSession(supabase, streamer, broadcast, viewers)
  await writeSnapshot(supabase, streamer.id, broadcast.id, viewers, chatRatio,
    isBotted ? 'bot_suspect' : 'ok', sessId)

  if (isBotted) {
    console.warn(`[Tracker] Bot suspect ${streamer.youtube_username}: ratio=${chatRatio.toFixed(5)}`)
    return mkResult(streamer, 'bot_suspect', viewers, `Chat ratio ${chatRatio.toFixed(5)}`, sessId)
  }

  // 6. Calculate reward for this 60-second window
  const sess    = await fetchSession(supabase, sessId)
  const hoursLive = sess
    ? (Date.now() - new Date(sess.started_at).getTime()) / 3600_000
    : 1
  const ep      = epochMultiplier()
  const reward  = calcStreamReward(
    viewers,
    POLL_INTERVAL_MIN,       // minutes this window
    Math.max(1, Math.ceil(hoursLive)),
    streamer.avg_viewers
  )

  // 7. Auto-close if stream exceeds 24h
  if (hoursLive >= MAX_SESSION_HOURS) {
    await closeSession(supabase, streamer, sess)
    return mkResult(streamer, 'ended', viewers, 'Auto-closed: 24h limit', sessId, reward)
  }

  // 8. Update session totals
  const snapCount = (sess?.snapshot_count ?? 0) + 1
  await supabase.from('stream_sessions').update({
    stmc_earned:      Number((sess?.stmc_earned ?? 0)) + reward,
    verified_viewers: viewers,
    avg_viewers:      runningAvg(sess?.avg_viewers ?? viewers, viewers, snapCount),
    peak_viewers:     Math.max(sess?.peak_viewers ?? 0, viewers),
    duration_minutes: Math.round(hoursLive * 60),
    duration_hours:   Math.floor(hoursLive),
    chat_ratio:       chatRatio,
    epoch_mult:       ep,
    partner_mult:     partnerMultiplier(streamer.avg_viewers),
    duration_mult:    durationMultiplier(Math.ceil(hoursLive)),
    snapshot_count:   snapCount,
  }).eq('id', sessId)

  console.log(`[Tracker] ${streamer.youtube_username} — ${viewers} viewers — +${reward.toFixed(4)} STMC`)
  return mkResult(streamer, 'live', viewers, undefined, sessId, reward)
}

// ─────────────────────────────────────────────────────────────
//  SESSION HELPERS
// ─────────────────────────────────────────────────────────────

async function upsertSession(
  supabase: SupabaseClient,
  streamer: ActiveStreamer,
  broadcast: YTLiveBroadcast,
  viewers: number
): Promise<string> {
  // Return existing session if it matches this broadcast
  if (streamer.active_session_id) {
    const { data: ex } = await supabase
      .from('stream_sessions')
      .select('id, stream_id')
      .eq('id', streamer.active_session_id)
      .eq('status', 'live')
      .single()
    if (ex?.stream_id === broadcast.id) return ex.id
  }

  // Create new session
  const { data: ns, error } = await supabase
    .from('stream_sessions')
    .insert({
      streamer_id:      streamer.id,
      platform:         'youtube',
      stream_id:        broadcast.id,
      title:            broadcast.title,
      started_at:       broadcast.startedAt,
      peak_viewers:     viewers,
      avg_viewers:      viewers,
      verified_viewers: viewers,
      status:           'live',
      stmc_earned:      0,
      snapshot_count:   0,
    })
    .select('id')
    .single()

  if (error || !ns) throw new Error(`Session create failed: ${error?.message}`)

  await supabase
    .from('streamers')
    .update({ active_session_id: ns.id })
    .eq('id', streamer.id)

  console.log(`[Tracker] New session ${ns.id} for ${streamer.youtube_username}`)
  return ns.id
}

async function closeSession(
  supabase: SupabaseClient,
  streamer: ActiveStreamer,
  sess: Record<string, any> | null
): Promise<void> {
  const sessId = streamer.active_session_id
  if (!sessId) return

  const endedAt  = new Date().toISOString()
  const startAt  = sess?.started_at ?? endedAt
  const durMin   = Math.floor((Date.now() - new Date(startAt).getTime()) / 60_000)
  const earned   = Number(sess?.stmc_earned ?? 0)

  await supabase.from('stream_sessions').update({
    status:           'pending_reward',
    ended_at:         endedAt,
    duration_minutes: durMin,
    duration_hours:   Math.floor(durMin / 60),
  }).eq('id', sessId)

  await supabase.from('streamers').update({ active_session_id: null }).eq('id', streamer.id)

  // Queue oracle packet if there are rewards to mint
  if (earned > 0 && sess) {
    await buildOraclePacket(supabase, {
      streamerId:      streamer.id,
      walletAddress:   streamer.wallet_address,
      sessionId:       sessId,
      verifiedViewers: sess.verified_viewers ?? 0,
      streamMinutes:   durMin,
      streamHours:     Math.floor(durMin / 60),
      avgViewers:      streamer.avg_viewers,
      chatRatio:       sess.chat_ratio ?? 0,
      totalEarned:     earned,
    })
  }

  console.log(`[Tracker] Session ${sessId} closed — ${durMin}min — ${earned.toFixed(4)} STMC`)
}

async function fetchSession(supabase: SupabaseClient, id: string) {
  const { data } = await supabase
    .from('stream_sessions')
    .select('*')
    .eq('id', id)
    .single()
  return data
}

async function writeSnapshot(
  supabase: SupabaseClient,
  streamerId: string,
  broadcastId: string,
  viewers: number,
  chatRatio: number,
  status: 'ok' | 'bot_suspect',
  sessionId?: string
) {
  await supabase.from('stream_snapshots').insert({
    session_id:   sessionId ?? null,
    streamer_id:  streamerId,
    broadcast_id: broadcastId,
    viewers,
    chat_ratio:   chatRatio,
    status,
    snapshot_at:  new Date().toISOString(),
  })
}

async function probeToken(token: string): Promise<boolean> {
  try {
    const r = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    return r.ok
  } catch { return false }
}

function runningAvg(current: number, next: number, count: number): number {
  return Math.round(((current * (count - 1)) + next) / count)
}

function mkResult(
  s: ActiveStreamer,
  status: PollResult['status'],
  viewers: number,
  message?: string,
  sessionId?: string,
  reward?: number
): PollResult {
  return { streamerId: s.id, youtubeId: s.youtube_id, status, viewers, sessionId, reward, message }
}
