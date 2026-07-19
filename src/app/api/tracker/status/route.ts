// /api/tracker/status
// Returns current live sessions — useful for the dashboard
// and for debugging the tracker without waiting for cron

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: sessions } = await supabase
    .from('stream_sessions')
    .select(`
      id, title, started_at, verified_viewers, avg_viewers,
      peak_viewers, stmc_earned, status, duration_minutes,
      snapshot_count, chat_ratio,
      streamers ( youtube_username, youtube_avatar, wallet_address, tier )
    `)
    .eq('status', 'live')
    .order('started_at', { ascending: false })

  const { data: pendingPackets } = await supabase
    .from('oracle_packets')
    .select('packet_id, status, expected_reward, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({
    live_sessions:   sessions ?? [],
    pending_packets: pendingPackets ?? [],
    timestamp:       new Date().toISOString(),
  })
}
