'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Streamer, StreamSession, StreamerStats, ChartPoint } from '@/types'

export function useStreamer(walletAddress?: string) {
  const [streamer, setStreamer]   = useState<Streamer | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('streamers').select('*')
      if (walletAddress) {
        query = query.eq('wallet_address', walletAddress)
      } else {
        query = query.limit(1) // dev: load first streamer
      }
      const { data, error: err } = await query.single()
      if (err) throw err
      setStreamer(data as Streamer)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load streamer')
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => { load() }, [load])

  return { streamer, loading, error, refetch: load }
}

export function useSessions(streamerId?: string) {
  const [sessions, setSessions] = useState<StreamSession[]>([])
  const [loading, setLoading]   = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!streamerId) return
    async function load() {
      const { data } = await supabase
        .from('stream_sessions')
        .select('*')
        .eq('streamer_id', streamerId)
        .order('started_at', { ascending: false })
        .limit(50)
      setSessions((data ?? []) as StreamSession[])
      setLoading(false)
    }
    load()

    // Realtime: update when session changes
    const channel = supabase
      .channel('sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_sessions',
        filter: `streamer_id=eq.${streamerId}`,
      }, (_payload: any) => load())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamerId])

  return { sessions, loading }
}

export function useStreamerStats(streamerId?: string): { stats: StreamerStats | null; loading: boolean } {
  const { sessions, loading } = useSessions(streamerId)

  if (loading || !streamerId) return { stats: null, loading }

  const now      = new Date()
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo  = new Date(today.getTime() - 7  * 86400000)
  const monthAgo = new Date(today.getTime() - 30 * 86400000)

  const earnedToday  = sessions.filter(s => new Date(s.started_at) >= today).reduce((a, s) => a + s.stmc_earned, 0)
  const earnedWeek   = sessions.filter(s => new Date(s.started_at) >= weekAgo).reduce((a, s) => a + s.stmc_earned, 0)
  const earnedMonth  = sessions.filter(s => new Date(s.started_at) >= monthAgo).reduce((a, s) => a + s.stmc_earned, 0)
  const totalEarned  = sessions.reduce((a, s) => a + s.stmc_earned, 0)
  const totalHours   = sessions.reduce((a, s) => a + s.duration_hours, 0)
  const avg30d       = sessions.length
    ? Math.round(sessions.slice(0, 30).reduce((a, s) => a + s.avg_viewers, 0) / Math.min(sessions.length, 30))
    : 0

  const chartData: ChartPoint[] = sessions.slice(0, 14).reverse().map(s => ({
    date:    new Date(s.started_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    stmc:    parseFloat(s.stmc_earned.toFixed(3)),
    viewers: s.avg_viewers,
  }))

  return {
    loading: false,
    stats: {
      total_earned:     totalEarned,
      earned_today:     earnedToday,
      earned_this_week: earnedWeek,
      earned_this_month:earnedMonth,
      total_streams:    sessions.length,
      total_hours:      totalHours,
      avg_viewers_30d:  avg30d,
      current_tier:     avg30d >= 500 ? 'partner' : avg30d >= 100 ? 'affiliate' : 'standard',
      streak_days:      0, // from streamer record
      earnings_chart:   chartData,
      recent_sessions:  sessions.slice(0, 10),
    },
  }
}

export function useLiveSession(streamerId?: string) {
  const [session, setSession] = useState<StreamSession | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!streamerId) return

    async function loadLive() {
      const { data } = await supabase
        .from('stream_sessions')
        .select('*')
        .eq('streamer_id', streamerId)
        .eq('status', 'live')
        .single()
      setSession(data as StreamSession ?? null)
    }
    loadLive()

    const channel = supabase
      .channel('live_session')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stream_sessions',
        filter: `streamer_id=eq.${streamerId}`,
      }, () => loadLive())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [streamerId])

  return session
}
