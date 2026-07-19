// ─── Streamer ────────────────────────────────────────────────
export interface Streamer {
  id: string
  wallet_address: string
  youtube_id?: string
  youtube_username?: string
  youtube_handle?: string
  youtube_avatar?: string
  avg_viewers: number
  tier: 'standard' | 'affiliate' | 'partner'
  streak_days: number
  total_stmc_earned: number
  created_at: string
  updated_at: string
}

// ─── Stream Session ──────────────────────────────────────────
export interface StreamSession {
  id: string
  streamer_id: string
  platform: 'twitch' | 'youtube' | 'kick'
  stream_id: string
  title: string
  started_at: string
  ended_at?: string
  duration_minutes: number
  duration_hours: number
  peak_viewers: number
  avg_viewers: number
  verified_viewers: number
  chat_ratio: number
  stmc_earned: number
  epoch_mult: number
  partner_mult: number
  duration_mult: number
  status: 'live' | 'ended' | 'pending_reward' | 'rewarded'
  oracle_packet_id?: string
  tx_hash?: string
}

// ─── Viewer ──────────────────────────────────────────────────
export interface Viewer {
  id: string
  wallet_address: string
  platform_id?: string
  streak_days: number
  last_active_day: string
  daily_earned: number
  total_earned: number
  created_at: string
}

// ─── Reward Event ────────────────────────────────────────────
export interface RewardEvent {
  id: string
  recipient_id: string
  recipient_type: 'streamer' | 'viewer'
  amount: number
  tx_hash?: string
  block_number?: number
  session_id?: string
  packet_id?: string
  status: 'pending' | 'minted' | 'failed'
  created_at: string
}

// ─── Dashboard Stats ─────────────────────────────────────────
export interface StreamerStats {
  total_earned: number
  earned_today: number
  earned_this_week: number
  earned_this_month: number
  total_streams: number
  total_hours: number
  avg_viewers_30d: number
  current_tier: 'standard' | 'affiliate' | 'partner'
  streak_days: number
  earnings_chart: ChartPoint[]
  recent_sessions: StreamSession[]
}

export interface ChartPoint {
  date: string
  stmc: number
  viewers: number
}

// ─── Oracle Packet ────────────────────────────────────────────
export interface StreamerPacket {
  packetId: string
  timestamp: number
  streamer: string
  verifiedViewers: number
  streamMinutes: number
  streamHours: number
  avgViewers: number
  chatRatioX1000: number
  platformSource: 0 | 1 | 2  // 0=Twitch 1=YouTube 2=Kick
}

export interface ViewerPacket {
  packetId: string
  timestamp: number
  viewer: string
  verifiedMinutes: number
  streakDays: number
  afkChecksPassed: number
  afkChecksTotal: number
}

// ─── API Responses ────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
  status: 'ok' | 'error'
}

export interface YouTubeLive {
  broadcastId: string
  title: string
  concurrentViewers: number
  startedAt: string
  liveChatId: string
  status: 'live' | 'upcoming' | 'complete'
}

export interface YouTubeChannel {
  id: string
  title: string
  handle: string
  avatar: string
  subscriberCount: number
  avgViewers30d: number
}
