// ─────────────────────────────────────────────────────────────
//  /api/tracker/poll
//
//  Called every 60 seconds by Vercel Cron (vercel.json)
//  Also callable manually for testing: GET /api/tracker/poll
//
//  Security: validates CRON_SECRET header so only Vercel
//  (or you) can trigger it — not the public internet.
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { pollAllStreamers } from '@/lib/tracker/session'

// Vercel sets this automatically on cron calls
// Set CRON_SECRET in your Vercel env vars for security
const CRON_SECRET = process.env.CRON_SECRET

export const runtime = 'nodejs'        // needs Node.js for crypto
export const maxDuration = 55          // Vercel max before 60s cron fires again

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  // ── Auth check ────────────────────────────────────────────
  // In production: Vercel sends Authorization: Bearer <CRON_SECRET>
  // In development: allow all requests (no secret set)
  if (CRON_SECRET) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // ── Supabase with service role (bypasses RLS) ─────────────
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,   // service role — full access
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // ── Run the poll ──────────────────────────────────────────
  let results
  try {
    results = await pollAllStreamers(supabase)
  } catch (err) {
    console.error('[Cron] Fatal poll error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  const elapsed   = Date.now() - startTime
  const live      = results.filter(r => r.status === 'live').length
  const ended     = results.filter(r => r.status === 'ended').length
  const errors    = results.filter(r => r.status === 'error').length
  const botSuspect = results.filter(r => r.status === 'bot_suspect').length
  const totalSTMC = results.reduce((s, r) => s + (r.reward ?? 0), 0)

  // ── Log summary to platform_stats ────────────────────────
  const today = new Date().toISOString().split('T')[0]
  try {
    await supabase.from('platform_stats')
      .upsert({ date: today, active_streamers: live }, { onConflict: 'date' })
  } catch { /* non-critical */ }


  console.log(`[Cron] Done in ${elapsed}ms — live:${live} ended:${ended} errors:${errors} bots:${botSuspect} STMC:${totalSTMC.toFixed(4)}`)

  return NextResponse.json({
    ok: true,
    elapsed_ms:   elapsed,
    polled:       results.length,
    live,
    ended,
    errors,
    bot_suspect:  botSuspect,
    total_stmc:   totalSTMC,
    results:      results.map(r => ({
      streamer: r.youtubeId,
      status:   r.status,
      viewers:  r.viewers,
      reward:   r.reward,
      message:  r.message,
    })),
  })
}
