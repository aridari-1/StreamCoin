import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getLiveBroadcast, getLiveChatRate, refreshYouTubeToken } from '@/lib/youtube'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 1: load streamer
  const { data: streamers, error: dbError } = await supabase
    .from('streamers')
    .select('id, youtube_id, youtube_username, youtube_access_token, youtube_refresh_token, active_session_id')
    .not('youtube_id', 'is', null)

  if (dbError) return NextResponse.json({ step: 'db_load', error: dbError.message })
  if (!streamers?.length) return NextResponse.json({ step: 'db_load', error: 'No streamers found' })

  const streamer = streamers[0]
  const log: Record<string, any> = {
    streamer_found:    true,
    youtube_id:        streamer.youtube_id,
    youtube_username:  streamer.youtube_username,
    has_access_token:  !!streamer.youtube_access_token,
    has_refresh_token: !!streamer.youtube_refresh_token,
    active_session_id: streamer.active_session_id,
  }

  // Step 2: validate token
  let token = streamer.youtube_access_token
  const testRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  log.token_valid  = testRes.ok
  log.token_status = testRes.status

  if (!testRes.ok) {
    const fresh = await refreshYouTubeToken(streamer.youtube_refresh_token)
    log.refresh_success = !!fresh
    if (!fresh) {
      return NextResponse.json({ ...log, error: 'Token expired and refresh failed — reconnect YouTube' })
    }
    token = fresh
    await supabase.from('streamers').update({ youtube_access_token: fresh }).eq('id', streamer.id)
    log.token_refreshed = true
  }

  // Step 3: raw YouTube API call — see exactly what it returns
  const rawRes = await fetch(
    'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&broadcastStatus=active&broadcastType=all',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const rawData = await rawRes.json()
  log.youtube_api_status = rawRes.status
  log.youtube_item_count = rawData.items?.length ?? 0
  log.youtube_items      = (rawData.items ?? []).map((b: any) => ({
    id:              b.id,
    title:           b.snippet?.title,
    lifeCycleStatus: b.status?.lifeCycleStatus,
    privacyStatus:   b.status?.privacyStatus,
    actualStartTime: b.snippet?.actualStartTime,
    liveChatId:      b.snippet?.liveChatId,
  }))

  // Step 4: also check 'all' broadcasts in case status is wrong
  const allRes  = await fetch(
    'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&broadcastStatus=all&broadcastType=all&maxResults=5',
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const allData = await allRes.json()
  log.all_broadcasts = (allData.items ?? []).map((b: any) => ({
    id:              b.id,
    title:           b.snippet?.title,
    lifeCycleStatus: b.status?.lifeCycleStatus,
    actualStartTime: b.snippet?.actualStartTime,
  }))

  // Step 5: try getLiveBroadcast
  const broadcast = await getLiveBroadcast(token)
  log.is_live = !!broadcast

  if (broadcast) {
    log.broadcast_id       = broadcast.id
    log.broadcast_title    = broadcast.title
    log.concurrent_viewers = broadcast.concurrentViewers
    log.live_chat_id       = broadcast.liveChatId

    const chatRate  = await getLiveChatRate(broadcast.liveChatId, token).catch(() => 1)
    const chatRatio = broadcast.concurrentViewers > 0 ? chatRate / broadcast.concurrentViewers : 1
    log.chat_msgs_per_min = chatRate
    log.chat_ratio        = chatRatio
    log.bot_suspect       = chatRatio < 0.005 && broadcast.concurrentViewers < 50000
  }

  return NextResponse.json(log, { headers: { 'Content-Type': 'application/json' } })
}