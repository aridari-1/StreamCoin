import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  exchangeYouTubeCode,
  getYouTubeChannel,
  getAvgViewers30d,
} from '@/lib/youtube'
import { partnerTier } from '@/lib/rewards'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')   // wallet address
  const error = searchParams.get('error')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // ── Error from Google ─────────────────────────────────────
  if (error) {
    console.error('YouTube OAuth error:', error)
    return NextResponse.redirect(`${base}/auth/connect?error=youtube_denied`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${base}/auth/connect?error=missing_params`)
  }

  // ── Exchange code for tokens ──────────────────────────────
  const redirectUri = `${base}/api/youtube/callback`
  const tokens = await exchangeYouTubeCode(code, redirectUri)
  if (!tokens) {
    return NextResponse.redirect(`${base}/auth/connect?error=token_exchange`)
  }

  // ── Get channel profile ───────────────────────────────────
  const channel = await getYouTubeChannel(tokens.access_token)
  if (!channel) {
    return NextResponse.redirect(`${base}/auth/connect?error=no_channel`)
  }

  // ── Get 30-day average viewers ────────────────────────────
  const avgViewers = await getAvgViewers30d(channel.id, tokens.access_token)
  const tier       = partnerTier(avgViewers)

  // ── Upsert into Supabase ──────────────────────────────────
  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('streamers')
    .upsert(
      {
        wallet_address:          state,
        youtube_id:              channel.id,
        youtube_username:        channel.title,
        youtube_handle:          channel.handle,
        youtube_avatar:          channel.avatar,
        youtube_access_token:    tokens.access_token,
        youtube_refresh_token:   tokens.refresh_token,
        avg_viewers:             avgViewers,
        tier,
        updated_at:              new Date().toISOString(),
      },
      { onConflict: 'wallet_address' }
    )

  if (dbError) {
    console.error('Supabase upsert error:', dbError)
    // Still redirect to dashboard — Supabase not set up yet is OK for local dev
    return NextResponse.redirect(
      `${base}/dashboard?connected=youtube&channel=${encodeURIComponent(channel.title)}&warning=db_not_configured`
    )
  }

  return NextResponse.redirect(
    `${base}/dashboard?connected=youtube&channel=${encodeURIComponent(channel.title)}`
  )
}
