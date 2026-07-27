'use client'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer, useSessions } from '@/hooks/useStreamer'
import { StatusBadge, Spinner, EmptyState, SectionHeader } from '@/components/ui'
import { formatSTMC, formatViewers } from '@/lib/rewards'
import { useState } from 'react'
import type { StreamSession } from '@/types'

export const dynamic = 'force-dynamic'

type Filter = 'all' | 'live' | 'ended' | 'rewarded' | 'pending_reward'

function SessionRow({ s }: { s: StreamSession }) {
  const [open, setOpen] = useState(false)
  const durMins = s.duration_minutes % 60

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid var(--c-border)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-raised)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}
      >
        <td className="px-5 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>
          {new Date(s.started_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
          <div className="text-xs mt-0.5" style={{ color: 'var(--c-faint)' }}>
            {new Date(s.started_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </td>
        <td className="px-5 py-3 max-w-[180px]">
          <div className="truncate text-sm text-white">{s.title ?? 'Untitled'}</div>
        </td>
        <td className="px-5 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>
          {s.duration_hours}h {durMins}m
        </td>
        <td className="px-5 py-3 text-sm">
          <div className="text-white">{formatViewers(s.peak_viewers)}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>avg {formatViewers(s.avg_viewers)}</div>
        </td>
        <td className="px-5 py-3 text-sm font-semibold ticker" style={{ color: 'var(--c-purple)' }}>
          {formatSTMC(s.stmc_earned, 4)}
        </td>
        <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
        <td className="px-5 py-3 text-xs" style={{ color: 'var(--c-muted)' }}>{open ? '▲' : '▼'}</td>
      </tr>

      {open && (
        <tr style={{ borderBottom: '1px solid var(--c-border)', background: 'var(--c-bg)' }}>
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {[
                ['Verified viewers', s.verified_viewers?.toLocaleString() ?? '—'],
                ['Epoch mult',       `×${s.epoch_mult?.toFixed(4) ?? '1.0000'}`],
                ['Partner mult',     `×${s.partner_mult?.toFixed(2) ?? '1.00'}`],
                ['Duration mult',    `×${s.duration_mult?.toFixed(2) ?? '1.00'}`],
                ['Chat ratio',       s.chat_ratio?.toFixed(5) ?? '—'],
                ['Snapshots',        (s as any).snapshot_count ?? '—'],
                ['Oracle packet',    s.oracle_packet_id ? `${s.oracle_packet_id.slice(0,12)}…` : '—'],
                ['Tx hash',          s.tx_hash ? `${s.tx_hash.slice(0,12)}…` : 'pending'],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div className="uppercase tracking-wider mb-1" style={{ color: 'var(--c-muted)' }}>{k}</div>
                  <div className="font-mono text-white">{v as string}</div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function SessionsPage() {
  const { wallet }            = useWallet()
  const { streamer, loading } = useStreamer(wallet ?? undefined)
  const { sessions }          = useSessions(streamer?.id)
  const [filter, setFilter]   = useState<Filter>('all')

  const filtered = filter === 'all'
    ? sessions
    : sessions.filter(s => s.status === filter)

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  const totalEarned = sessions.reduce((a, s) => a + Number(s.stmc_earned), 0)
  const totalHours  = sessions.reduce((a, s) => a + s.duration_hours, 0)

  const counts: Record<Filter, number> = {
    all:            sessions.length,
    live:           sessions.filter(s => s.status === 'live').length,
    ended:          sessions.filter(s => s.status === 'ended').length,
    rewarded:       sessions.filter(s => s.status === 'rewarded').length,
    pending_reward: sessions.filter(s => s.status === 'pending_reward').length,
  }

  const filterLabels: Record<Filter, string> = {
    all:            'All',
    live:           'Live',
    ended:          'Ended',
    rewarded:       'Rewarded',
    pending_reward: 'Pending',
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Stream Sessions"
        sub={`${sessions.length} sessions · ${totalHours}h total`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total STMC', value: formatSTMC(totalEarned, 4), accent: true },
          { label: 'Sessions',   value: sessions.length.toString() },
          { label: 'Rewarded',   value: counts.rewarded.toString(),      color: 'var(--c-green)' },
          { label: 'Pending',    value: counts.pending_reward.toString(), color: 'var(--c-amber)' },
        ].map(({ label, value, accent, color }) => (
          <div key={label} className="rounded-2xl p-4"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--c-muted)' }}>{label}</div>
            <div className="text-xl font-bold ticker"
              style={{ color: accent ? 'var(--c-purple)' : color ?? 'white' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(Object.keys(filterLabels) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
            style={{
              background: filter === f ? 'var(--c-purple)' : 'var(--c-surface)',
              border:     `1px solid ${filter === f ? 'var(--c-purple)' : 'var(--c-border)'}`,
              color:      filter === f ? 'white' : 'var(--c-muted)',
            }}>
            {filterLabels[f]}
            <span className="ml-1.5 text-xs opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
            {filter === 'all'
              ? 'No sessions yet — go live on YouTube to start earning!'
              : `No ${filterLabels[filter].toLowerCase()} sessions.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {['Date', 'Title', 'Duration', 'Viewers', 'STMC', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: 'var(--c-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => <SessionRow key={s.id} s={s} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}