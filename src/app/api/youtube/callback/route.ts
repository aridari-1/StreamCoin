import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeYouTubeCode, getYouTubeChannel, getAvgViewers30d } from '@/lib/youtube'
import { partnerTier } from '@/lib/rewards'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code  = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) return NextResponse.redirect(`${base}/auth/connect?error=youtube_denied`)
  if (!code || !state) return NextResponse.redirect(`${base}/auth/connect?error=missing_params`)

  // Exchange code for tokens
  const redirectUri = `${base}/api/youtube/callback`
  const tokens = await exchangeYouTubeCode(code, redirectUri)
  if (!tokens) return NextResponse.redirect(`${base}/auth/connect?error=token_exchange`)

  // Get channel profile
  const channel = await getYouTubeChannel(tokens.access_token)
  if (!channel) return NextResponse.redirect(`${base}/auth/connect?error=no_channel`)

  const avgViewers = await getAvgViewers30d(channel.id, tokens.access_token)
  const tier       = partnerTier(avgViewers)

  // ── Use service role key to bypass RLS ───────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: dbError } = await supabase
    .from('streamers')
    .upsert({
      wallet_address:        state,
      youtube_id:            channel.id,
      youtube_username:      channel.title,
      youtube_handle:        channel.handle,
      youtube_avatar:        channel.avatar,
      youtube_access_token:  tokens.access_token,
      youtube_refresh_token: tokens.refresh_token,
      avg_viewers:           avgViewers,
      tier,
      updated_at:            new Date().toISOString(),
    }, { onConflict: 'wallet_address' })

  if (dbError) {
    console.error('Supabase upsert error:', dbError.message)
    // Redirect with error so user sees it
    return NextResponse.redirect(`${base}/auth/connect?error=db_${dbError.code}`)
  }

  // ── Set wallet cookie and redirect to dashboard ───────────────
  const response = NextResponse.redirect(
    `${base}/dashboard?connected=youtube&channel=${encodeURIComponent(channel.title)}`
  )

  response.cookies.set('stmc_wallet', state, {
    path:     '/',
    maxAge:   60 * 60 * 24 * 365,
    sameSite: 'lax',
    secure:   base.startsWith('https'),
    httpOnly: false,
  })

  return response
}