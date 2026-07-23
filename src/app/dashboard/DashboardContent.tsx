'use client'
import { useWallet } from '@/hooks/useWallet'
import { useStreamer, useStreamerStats, useLiveSession } from '@/hooks/useStreamer'
import { LiveMiningCard } from '@/components/dashboard/LiveMiningCard'
import { StatCard, TierBadge, StatusBadge, Spinner, EmptyState, YouTubeLogo } from '@/components/ui'
import { formatSTMC, formatViewers, epochMultiplier, calcStreamReward, partnerMultiplier } from '@/lib/rewards'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'next/navigation'

export default function DashboardContent() {
  const { wallet }            = useWallet()
  const { streamer, loading } = useStreamer(wallet ?? undefined)
  const { stats }             = useStreamerStats(streamer?.id)
  const liveSession           = useLiveSession(streamer?.id)
  const searchParams          = useSearchParams()
  const connected             = searchParams.get('connected')
  const channel               = searchParams.get('channel') ?? ''
  const epoch                 = epochMultiplier()

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )

  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      desc="Connect your YouTube channel to start mining STMC"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  const tier = streamer.tier ?? 'standard'

  return (
    <div className="space-y-5">

      {connected === 'youtube' && channel && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm"
          style={{ background: '#22d3a510', border: '1px solid #22d3a530' }}>
          <span style={{ color: 'var(--c-green)' }}>✓</span>
          <span className="font-medium" style={{ color: 'var(--c-green)' }}>YouTube connected —</span>
          <span style={{ color: '#22d3a580' }}>{decodeURIComponent(channel)} is now mining STMC</span>
        </div>
      )}

      <div className="flex items-center gap-4 flex-wrap py-2">
        <div className="relative flex-shrink-0">
          {streamer.youtube_avatar
            ? <img src={streamer.youtube_avatar} alt="avatar" className="w-14 h-14 rounded-2xl object-cover"
                style={{ border: '2px solid var(--c-purple-md)' }} />
            : <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #8b7cf8, #22d3a5)' }}>
                {(streamer.youtube_username ?? 'S')[0]}
              </div>
          }
          <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: '#ff4d6d' }}>
            <YouTubeLogo size={13} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-tight truncate">
              {streamer.youtube_username ?? 'Streamer'}
            </h1>
            <TierBadge tier={tier} />
            {liveSession && (
              <span className="pill" style={{ background: '#ff4d6d12', color: '#ff4d6d', border: '1px solid #ff4d6d30' }}>
                <span className="relative flex w-1.5 h-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#ff4d6d' }} />
                  <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: '#ff4d6d' }} />
                </span>
                Live
              </span>
            )}
          </div>
          <p className="text-xs font-mono mt-1 truncate" style={{ color: 'var(--c-muted)' }}>
            {streamer.wallet_address}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right px-4 py-2 rounded-xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--c-muted)' }}>Epoch</div>
            <div className="text-sm font-bold" style={{ color: 'var(--c-purple)' }}>×{epoch.toFixed(4)}</div>
          </div>
          <div className="text-right px-4 py-2 rounded-xl" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--c-muted)' }}>Streak</div>
            <div className="text-sm font-bold" style={{ color: 'var(--c-green)' }}>{streamer.streak_days ?? 0}d</div>
          </div>
        </div>
      </div>

      {liveSession && <LiveMiningCard session={liveSession} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total STMC"      value={formatSTMC(stats?.total_earned ?? 0)}         sub="all time" accent />
        <StatCard label="This month"      value={formatSTMC(stats?.earned_this_month ?? 0)}     sub={`${stats?.total_streams ?? 0} streams`} />
        <StatCard label="Avg viewers 30d" value={formatViewers(stats?.avg_viewers_30d ?? 0)}    sub={`${tier} · ×${partnerMultiplier(streamer.avg_viewers).toFixed(2)}`} />
        <StatCard label="Stream hours"    value={`${stats?.total_hours ?? 0}h`}                 sub="total streamed" />
      </div>

      {(stats?.earnings_chart?.length ?? 0) > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          <div className="text-sm font-semibold text-white mb-5">STMC earned — last 14 streams</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={stats!.earnings_chart}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b7cf8" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b7cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                contentStyle={{ background: 'var(--c-raised)', border: '1px solid var(--c-border-hi)', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#64748b' }}
                formatter={(v) => [`${Number(v).toFixed(4)} STMC`, 'Earned']}
              />
              <Area type="monotone" dataKey="stmc" stroke="#8b7cf8" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
          <span className="text-sm font-semibold text-white">Recent Sessions</span>
          <a href="/dashboard/sessions" className="text-xs font-medium" style={{ color: 'var(--c-purple)' }}>View all →</a>
        </div>
        {(stats?.recent_sessions?.length ?? 0) === 0 ? (
          <div className="p-10 text-center text-sm" style={{ color: 'var(--c-muted)' }}>
            No sessions yet — go live on YouTube to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-border)' }}>
                  {['Date','Title','Duration','Viewers','STMC','Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--c-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats!.recent_sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--c-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-raised)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>
                      {new Date(s.started_at).toLocaleDateString('en',{month:'short',day:'numeric'})}
                    </td>
                    <td className="px-5 py-3 text-white max-w-[160px] truncate">{s.title ?? '—'}</td>
                    <td className="px-5 py-3 whitespace-nowrap" style={{ color: 'var(--c-muted)' }}>{s.duration_hours}h {s.duration_minutes%60}m</td>
                    <td className="px-5 py-3" style={{ color: 'var(--c-muted)' }}>{formatViewers(s.peak_viewers)}</td>
                    <td className="px-5 py-3 font-semibold ticker" style={{ color: 'var(--c-purple)' }}>{formatSTMC(s.stmc_earned,4)}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--c-muted)' }}>Your reward formula</div>
        <div className="space-y-0">
          {[
            ['Base rate',  `viewers × 0.00002 STMC/min`],
            ['Epoch mult', `×${epoch.toFixed(4)}`],
            ['Tier mult',  `×${partnerMultiplier(streamer.avg_viewers).toFixed(2)} (${tier})`],
            ['Hard cap',   '10 STMC per streaming hour'],
          ].map(([k,v]) => (
            <div key={k} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{k}</span>
              <span className="text-sm font-mono text-white">{v}</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            <span className="text-sm" style={{ color: 'var(--c-muted)' }}>5,000 viewers × 1h preview</span>
            <span className="text-sm font-semibold ticker" style={{ color: 'var(--c-purple)' }}>
              {formatSTMC(calcStreamReward(5000,60,1,streamer.avg_viewers),4)} STMC
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}