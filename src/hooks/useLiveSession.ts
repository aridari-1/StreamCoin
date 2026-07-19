'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { StreamSession } from '@/types'

interface LiveSessionState {
  session:         StreamSession | null
  isLive:          boolean
  viewers:         number
  earnedSoFar:     number
  elapsedSeconds:  number
  ratePerMinute:   number
  loading:         boolean
  error:           string | null
}

const INITIAL_STATE: LiveSessionState = {
  session:        null,
  isLive:         false,
  viewers:        0,
  earnedSoFar:    0,
  elapsedSeconds: 0,
  ratePerMinute:  0,
  loading:        true,
  error:          null,
}

// ── useLiveSession ─────────────────────────────────────────────
// Subscribes to real-time DB changes for a streamer's live session.
// Also runs a local timer to show smooth elapsed time between DB updates.

export function useLiveSession(streamerId: string | null) {
  const [state, setState]     = useState<LiveSessionState>(INITIAL_STATE)
  const timerRef              = useRef<NodeJS.Timeout | null>(null)
  const sessionStartRef       = useRef<Date | null>(null)
  const supabase              = createClient()

  // ── Tick the elapsed timer locally (smooth UX) ─────────────
  const startTimer = useCallback((startedAt: string) => {
    if (timerRef.current) clearInterval(timerRef.current)
    sessionStartRef.current = new Date(startedAt)

    timerRef.current = setInterval(() => {
      if (!sessionStartRef.current) return
      const elapsed = Math.floor(
        (Date.now() - sessionStartRef.current.getTime()) / 1000
      )
      setState(s => ({ ...s, elapsedSeconds: elapsed }))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    sessionStartRef.current = null
  }, [])

  // ── Load current session state ──────────────────────────────
  const loadSession = useCallback(async () => {
    if (!streamerId) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    const { data, error } = await supabase
      .from('stream_sessions')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('status', 'live')
      .single()

    if (error || !data) {
      setState(s => ({ ...s, isLive: false, session: null, loading: false }))
      stopTimer()
      return
    }

    const session   = data as StreamSession
    const elapsed   = Math.floor(
      (Date.now() - new Date(session.started_at).getTime()) / 1000
    )
    const ratePerMin = session.stmc_earned > 0 && elapsed > 0
      ? (session.stmc_earned / elapsed) * 60
      : 0

    setState({
      session,
      isLive:         true,
      viewers:        session.verified_viewers,
      earnedSoFar:    session.stmc_earned,
      elapsedSeconds: elapsed,
      ratePerMinute:  ratePerMin,
      loading:        false,
      error:          null,
    })

    startTimer(session.started_at)
  }, [streamerId, startTimer, stopTimer])

  // ── Subscribe to real-time DB updates ──────────────────────
  useEffect(() => {
    if (!streamerId) return

    loadSession()

    // Supabase realtime — listen for changes to this streamer's sessions
    const channel = supabase
      .channel(`session:${streamerId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'stream_sessions',
          filter: `streamer_id=eq.${streamerId}`,
        },
        (payload: any) => {
          const updated = payload.new as StreamSession

          if (!updated) return

          if (updated.status === 'live') {
            // Session updated by tracker tick
            setState(s => ({
              ...s,
              session:       updated,
              isLive:        true,
              viewers:       updated.verified_viewers,
              earnedSoFar:   updated.stmc_earned,
              ratePerMinute: updated.stmc_earned > 0
                ? (updated.stmc_earned / Math.max(1, s.elapsedSeconds / 60))
                : 0,
            }))

            if (!sessionStartRef.current) {
              startTimer(updated.started_at)
            }
          } else if (
            updated.status === 'ended' ||
            updated.status === 'pending_reward' ||
            updated.status === 'rewarded'
          ) {
            // Stream ended
            setState(s => ({
              ...s,
              session:    updated,
              isLive:     false,
              earnedSoFar: updated.stmc_earned,
            }))
            stopTimer()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      stopTimer()
    }
  }, [streamerId, loadSession, startTimer, stopTimer])

  return state
}

// ── useTrackerStatus ───────────────────────────────────────────
// Polls the tracker API status in development
// (In production Vercel Cron runs automatically)

export function useTrackerStatus() {
  const [lastTick, setLastTick]   = useState<string | null>(null)
  const [ticking, setTicking]     = useState(false)
  const [liveSessions, setLive]   = useState(0)

  const tick = useCallback(async () => {
    setTicking(true)
    try {
      const res  = await fetch('/api/session/start', { method: 'POST' })
      const data = await res.json()
      setLastTick(new Date().toLocaleTimeString())
      setLive(data.summary?.live ?? 0)
    } catch (err) {
      console.error('Tracker tick failed:', err)
    } finally {
      setTicking(false)
    }
  }, [])

  // Auto-poll every 60s in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const t = setInterval(tick, 60_000)
    return () => clearInterval(t)
  }, [tick])

  return { lastTick, ticking, liveSessions, tick }
}
