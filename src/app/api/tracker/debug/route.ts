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

  // Step 1: load streamers
  const { data: streamers, error: dbError } = await supabase
    .from('streamers')
    .select('id, youtube_id, youtube_username, youtube_access_token, youtube_refresh_token, active_session_id')
    .not('youtube_id', 'is', null)

  if (dbError) return NextResponse.json({ step: 'db_load', error: dbError.message })
  if (!streamers?.length) return NextResponse.json({ step: 'db_load', error: 'No streamers found in DB' })

  const streamer = streamers[0]
  const log: any = {
    streamer_found: true,
    youtube_id: streamer.youtube_id,
    youtube_username: streamer.youtube_username,
    has_access_token: !!streamer.youtube_access_token,
    has_refresh_token: !!streamer.youtube_refresh_token,
    active_session_id: streamer.active_session_id,
  }

  // Step 2: test access token
  let token = streamer.youtube_access_token
  try {
    const testRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    )
    log.token_valid = testRes.ok
    log.token_status = testRes.status

    if (!testRes.ok) {
      log.trying_refresh = true
      const fresh = await refreshYouTubeToken(streamer.youtube_refresh_token)
      log.refresh_success = !!fresh
      if (fresh) {
        token = fresh
        await supabase.from('streamers').update({ youtube_access_token: fresh }).eq('id', streamer.id)
        log.token_refreshed = true
      } else {
        return NextResponse.json({ ...log, error: 'Token expired and refresh failed — reconnect YouTube' })
      }
    }
  } catch (e) {
    return NextResponse.json({ ...log, error: `Token test threw: ${e}` })
  }

  // Step 3: check live broadcast
  try {
    const broadcast = await getLiveBroadcast(token)
    log.is_live = !!broadcast
    if (broadcast) {
      log.broadcast_id      = broadcast.id
      log.broadcast_title   = broadcast.title
      log.broadcast_status  = broadcast.status
      log.concurrent_viewers = broadcast.concurrentViewers
      log.live_chat_id      = broadcast.liveChatId

      // Step 4: chat rate
      try {
        const chatRate = await getLiveChatRate(broadcast.liveChatId, token)
        const chatRatio = broadcast.concurrentViewers > 0
          ? chatRate / broadcast.concurrentViewers
          : 1
        log.chat_msgs_per_min = chatRate
        log.chat_ratio        = chatRatio
        log.bot_suspect       = chatRatio < 0.005 && broadcast.concurrentViewers < 50000
        log.bot_threshold     = 0.005
      } catch (e) {
        log.chat_error = String(e)
      }
    } else {
      log.not_live_reason = 'getLiveBroadcast returned null — either not live or API returned no active broadcast'
    }
  } catch (e) {
    log.broadcast_error = String(e)
  }

  return NextResponse.json(log, { headers: { 'Content-Type': 'application/json' } })
}