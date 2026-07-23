'use client'
import { useEffect, useState } from 'react'
import { calcStreamRatePerMinute, formatSTMC, formatViewers } from '@/lib/rewards'
import type { StreamSession } from '@/types'

export function LiveMiningCard({ session }: { session: StreamSession }) {
  const startedAt = new Date(session.started_at).getTime()
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startedAt) / 1000))

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(t)
  }, [startedAt])

  const viewers    = session.verified_viewers ?? session.avg_viewers
  const ratePerMin = calcStreamRatePerMinute(viewers, session.avg_viewers)
  const tickSTMC   = ratePerMin * (elapsed % 60) / 60
  const displayed  = session.stmc_earned + tickSTMC
  const hours      = session.duration_hours || Math.floor(elapsed / 3600) || 1
  const cap        = 10 * hours
  const pct        = Math.min((displayed / cap) * 100, 100)
  const hh = String(Math.floor(elapsed / 3600)).padStart(2,'0')
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2,'0')
  const ss = String(elapsed % 60).padStart(2,'0')

  return (
    <div className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: 'linear-gradient(135deg, #0e1318 0%, #13111f 100%)', border: '1px solid #8b7cf830', boxShadow: '0 0 40px #8b7cf810' }}>

      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, #8b7cf808 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="relative w-2.5 h-2.5">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: '#ff4d6d', opacity: 0.4 }} />
            <div className="relative w-2.5 h-2.5 rounded-full" style={{ background: '#ff4d6d' }} />
          </div>
          <span className="text-sm font-semibold text-white">Live Mining</span>
          <span className="text-xs truncate max-w-[180px]" style={{ color: 'var(--c-muted)' }}>{session.title}</span>
        </div>
        <span className="font-mono text-sm ticker" style={{ color: 'var(--c-muted)' }}>{hh}:{mm}:{ss}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Viewers', value: formatViewers(viewers),             color: 'text-white' },
          { label: 'Rate',    value: `${ratePerMin.toFixed(5)}/min`,     color: '' },
          { label: 'Peak',    value: formatViewers(session.peak_viewers), color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="text-xs mb-1.5 uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>{label}</div>
            <div className={`text-lg font-bold ticker ${color}`} style={!color ? { color: 'var(--c-purple)' } : {}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--c-muted)' }}>
          <span>Session earnings</span>
          <span>{formatSTMC(displayed, 4)} / {cap} STMC cap</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-border)' }}>
          <div className="h-1.5 rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: pct > 80 ? 'var(--c-amber)' : 'linear-gradient(90deg, #8b7cf8, #22d3a5)' }} />
        </div>
      </div>

      <div className="text-center pt-5" style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="text-5xl font-bold ticker gradient-text">{formatSTMC(displayed, 4)}</div>
        <div className="text-lg font-medium text-white mt-1">STMC</div>
        <div className="text-xs mt-2" style={{ color: 'var(--c-muted)' }}>Verified by oracle every 60s</div>
      </div>
    </div>
  )
}