'use client'
import { useEffect, useState } from 'react'
import { calcStreamRatePerMinute, formatSTMC, formatViewers } from '@/lib/rewards'
import type { StreamSession } from '@/types'

export function LiveMiningCard({ session }: { session: StreamSession }) {
  const startedAt  = new Date(session.started_at).getTime()
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000))

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  const viewers    = session.verified_viewers ?? session.avg_viewers
  const avgViewers = session.avg_viewers
  const ratePerMin = calcStreamRatePerMinute(viewers, avgViewers)
  // Add per-second tick to already-saved stmc_earned
  const tickSTMC   = ratePerMin * (elapsed % 60) / 60
  const displayed  = session.stmc_earned + tickSTMC
  const capPerHour = 10
  const hours      = session.duration_hours || Math.floor(elapsed / 3600) || 1
  const cap        = capPerHour * hours
  const pct        = Math.min((displayed / cap) * 100, 100)

  const hh = Math.floor(elapsed / 3600)
  const mm = Math.floor((elapsed % 3600) / 60)
  const ss = elapsed % 60

  return (
    <div className="bg-[#161b22] border border-[#7F77DD]/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-white">Live Now</span>
          <span className="text-xs text-gray-500 ml-1 truncate max-w-[200px]">{session.title}</span>
        </div>
        <span className="text-xs font-mono text-gray-400 tabular-nums">
          {String(hh).padStart(2,'0')}:{String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div>
          <div className="text-xs text-gray-500 mb-1">Viewers</div>
          <div className="text-xl font-bold text-white">{formatViewers(viewers)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Rate</div>
          <div className="text-xl font-bold text-[#7F77DD]">
            {ratePerMin.toFixed(5)}<span className="text-sm font-normal text-gray-500">/min</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Peak</div>
          <div className="text-xl font-bold text-gray-300">{formatViewers(session.peak_viewers)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>This stream</span>
          <span>{formatSTMC(displayed, 4)} / {cap} STMC cap</span>
        </div>
        <div className="h-2 bg-[#0f1117] rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: pct > 80 ? '#f59e0b' : '#7F77DD',
            }}
          />
        </div>
      </div>

      {/* Big number */}
      <div className="text-center mt-5 pt-4 border-t border-[#30363d]">
        <span className="text-4xl font-bold text-white tabular-nums">
          {formatSTMC(displayed, 4)}
        </span>
        <span className="text-gray-400 ml-2">STMC</span>
        <div className="text-xs text-gray-600 mt-1">
          Polls every 60s · verified by oracle
        </div>
      </div>
    </div>
  )
}
