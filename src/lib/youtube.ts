// ─────────────────────────────────────────────────────────────
//  YouTube Live API utilities
//  Scopes used: youtube.readonly, yt-analytics.readonly
//  All read-only — we never post, modify, or delete anything
// ─────────────────────────────────────────────────────────────

const YT_API = 'https://www.googleapis.com/youtube/v3'
const OAUTH  = 'https://oauth2.googleapis.com'

// ── Types ─────────────────────────────────────────────────────
export interface YTChannel {
  id: string
  title: string
  handle: string          // @handle
  avatar: string
  subscriberCount: number
  viewCount: number
}

export interface YTLiveBroadcast {
  id: string
  title: string
  status: 'live' | 'upcoming' | 'complete'
  concurrentViewers: number
  startedAt: string
  liveChatId: string
}

export interface YTTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

// ── OAuth URL ─────────────────────────────────────────────────
export function getYouTubeOAuthUrl(
  redirectUri: string,
  state: string          // wallet address
): string {
  const params = new URLSearchParams({
    client_id:     process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
      'openid',
      'email',
      'profile',
    ].join(' '),
    access_type:   'offline',   // get refresh_token
    prompt:        'consent',   // force consent to always get refresh_token
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ── Exchange code for tokens ──────────────────────────────────
export async function exchangeYouTubeCode(
  code: string,
  redirectUri: string
): Promise<YTTokens | null> {
  const res = await fetch(`${OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) {
    console.error('YouTube token exchange failed:', await res.text())
    return null
  }
  return res.json()
}

// ── Refresh an expired access token ──────────────────────────
export async function refreshYouTubeToken(
  refreshToken: string
): Promise<string | null> {
  const res = await fetch(`${OAUTH}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}

// ── Get channel info ──────────────────────────────────────────
export async function getYouTubeChannel(
  accessToken: string
): Promise<YTChannel | null> {
  const res = await fetch(
    `${YT_API}/channels?part=snippet,statistics&mine=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json()
  const ch   = data.items?.[0]
  if (!ch) return null

  return {
    id:              ch.id,
    title:           ch.snippet.title,
    handle:          ch.snippet.customUrl ?? ch.id,
    avatar:          ch.snippet.thumbnails?.default?.url ?? '',
    subscriberCount: parseInt(ch.statistics.subscriberCount ?? '0'),
    viewCount:       parseInt(ch.statistics.viewCount ?? '0'),
  }
}

// ── Get active live broadcast ─────────────────────────────────
// Returns null if the channel is not currently live
export async function getLiveBroadcast(
  accessToken: string
): Promise<YTLiveBroadcast | null> {
  // Step 1: get active broadcast IDs
  const broadcastRes = await fetch(
    `${YT_API}/liveBroadcasts?part=snippet,status&broadcastStatus=active&broadcastType=all`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!broadcastRes.ok) return null
  const broadcastData = await broadcastRes.json()
  const broadcast     = broadcastData.items?.[0]
  if (!broadcast) return null

  const streamId = broadcast.snippet?.boundStreamId
  if (!streamId) return null

  // Step 2: get concurrent viewers from the bound live stream
  const streamRes = await fetch(
    `${YT_API}/liveStreams?part=status&id=${streamId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!streamRes.ok) return null
  const streamData = await streamRes.json()
  const stream     = streamData.items?.[0]

  return {
    id:               broadcast.id,
    title:            broadcast.snippet.title ?? 'Untitled stream',
    status:           broadcast.status.lifeCycleStatus === 'live' ? 'live' : 'upcoming',
    concurrentViewers: parseInt(stream?.status?.concurrentViewers ?? '0'),
    startedAt:        broadcast.snippet.actualStartTime ?? new Date().toISOString(),
    liveChatId:       broadcast.snippet.liveChatId ?? '',
  }
}

// ── Get live chat message rate (for CAR check) ────────────────
// Returns messages per minute over the last 60 seconds
export async function getLiveChatRate(
  liveChatId: string,
  accessToken: string
): Promise<number> {
  if (!liveChatId) return 1 // assume healthy if no chat ID

  const res = await fetch(
    `${YT_API}/liveChat/messages?liveChatId=${liveChatId}&part=snippet&maxResults=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return 1

  const data     = await res.json()
  const messages = data.items ?? []
  const now      = Date.now()
  const oneMinAgo = now - 60_000

  // Count messages in the last 60 seconds
  const recent = messages.filter((m: any) => {
    const ts = new Date(m.snippet?.publishedAt ?? 0).getTime()
    return ts > oneMinAgo
  })

  return recent.length // msgs per last minute
}

// ── Get 30-day average viewers (from analytics) ───────────────
export async function getAvgViewers30d(
  channelId: string,
  accessToken: string
): Promise<number> {
  const endDate   = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const res = await fetch(
    `https://youtubeanalytics.googleapis.com/v2/reports?` +
    `ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}` +
    `&metrics=averageViewDuration,views&dimensions=day`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) return 0

  const data = await res.json()
  const rows = data.rows ?? []
  if (rows.length === 0) return 0

  // averageViewDuration is in seconds — convert to rough concurrent viewers
  // concurrent ≈ (total views × avg duration) / (total seconds in period)
  const totalViews   = rows.reduce((s: number, r: number[]) => s + (r[1] ?? 0), 0)
  const avgDuration  = rows.reduce((s: number, r: number[]) => s + (r[0] ?? 0), 0) / rows.length
  const periodSecs   = 30 * 86400
  return Math.round((totalViews * avgDuration) / periodSecs)
}
