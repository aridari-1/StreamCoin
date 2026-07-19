'use client'
import { useWallet }        from '@/hooks/useWallet'
import { useStreamer, useStreamerStats, useLiveSession } from '@/hooks/useStreamer'
import { LiveMiningCard }   from '@/components/dashboard/LiveMiningCard'
import { StatCard, TierBadge, StatusBadge, Spinner, EmptyState, YouTubeLogo } from '@/components/ui'
import { formatSTMC, formatViewers, epochMultiplier, calcStreamReward, partnerMultiplier } from '@/lib/rewards'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'next/navigation'

export default function DashboardContent() {
  const { wallet }              = useWallet()
  const { streamer, loading }   = useStreamer(wallet ?? undefined)
  const { stats }               = useStreamerStats(streamer?.id)
  const liveSession             = useLiveSession(streamer?.id)
  const searchParams            = useSearchParams()
  const connected               = searchParams.get('connected')
  const channel                 = searchParams.get('channel') ?? ''
  const epoch                   = epochMultiplier()

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>

  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      desc="Connect your YouTube channel to start mining STMC"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  const tier = streamer.tier ?? 'standard'

  return (
    <div className="space-y-6">
      {connected === 'youtube' && channel && (
        <div className="bg-green-900/30 border border-green-700/40 rounded-xl px-5 py-3 flex items-center gap-3">
          <span className="text-green-400 text-lg">✓</span>
          <span className="text-green-300 text-sm font-medium">YouTube connected —</span>
          <span className="text-green-400/80 text-sm">{decodeURIComponent(channel)} is now mining STMC</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-shrink-0">
          {streamer.youtube_avatar
            ? <img src={streamer.youtube_avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-[#7F77DD]" />
            : <div className="w-12 h-12 rounded-full bg-[#7F77DD] flex items-center justify-center text-xl font-bold text-white">{(streamer.youtube_username??'S')[0]}</div>}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF0000] flex items-center justify-center"><YouTubeLogo size={12} /></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white truncate">{streamer.youtube_username ?? 'Streamer'}</h1>
            <TierBadge tier={tier} />
            {liveSession && <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-900/40 border border-red-800/40 rounded-full text-xs text-red-400"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />Live</span>}
          </div>
          <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{streamer.wallet_address}</p>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div><div className="text-xs text-gray-500">Epoch</div><div className="text-sm font-medium text-[#7F77DD]">×{epoch.toFixed(4)}</div></div>
          <div><div className="text-xs text-gray-500">Streak</div><div className="text-sm font-medium text-green-400">{streamer.streak_days??0}d</div></div>
        </div>
      </div>

      {liveSession && <LiveMiningCard session={liveSession} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total STMC"      value={formatSTMC(stats?.total_earned??0)}         sub="all time"           color="text-[#7F77DD]" />
        <StatCard label="This month"      value={formatSTMC(stats?.earned_this_month??0)}     sub={`${stats?.total_streams??0} streams`} />
        <StatCard label="Avg viewers 30d" value={formatViewers(stats?.avg_viewers_30d??0)}    sub={`${tier} · ×${partnerMultiplier(streamer.avg_viewers).toFixed(2)}`} />
        <StatCard label="Stream hours"    value={`${stats?.total_hours??0}h`}                 sub="total streamed" />
      </div>

      {(stats?.earnings_chart?.length??0) > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="text-sm font-medium text-gray-300 mb-4">STMC earned — last 14 streams</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats!.earnings_chart}>
              <defs>
                <linearGradient id="stmcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7F77DD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7F77DD" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false} />
              <YAxis tick={{fill:'#6b7280',fontSize:11}} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{background:'#161b22',border:'1px solid #30363d',borderRadius:8,fontSize:12}} labelStyle={{color:'#9ca3af'}} formatter={(v)=>[`${Number(v).toFixed(4)} STMC`,'Earned']} />
              <Area type="monotone" dataKey="stmc" stroke="#7F77DD" fill="url(#stmcGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Recent Sessions</span>
          <a href="/dashboard/sessions" className="text-xs text-[#7F77DD] hover:text-[#9b95e8] transition-colors">View all →</a>
        </div>
        {(stats?.recent_sessions?.length??0) === 0
          ? <div className="p-8 text-center text-gray-500 text-sm">No sessions yet. Go live on YouTube to start earning!</div>
          : <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
              <thead><tr className="border-b border-[#30363d]">
                {['Date','Title','Duration','Viewers','STMC','Status'].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}</tr></thead>
              <tbody>{stats!.recent_sessions.map(s=>(
                <tr key={s.id} className="border-b border-[#30363d]/50 hover:bg-[#1c2128] transition-colors">
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(s.started_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</td>
                  <td className="px-5 py-3 text-gray-300 max-w-[180px] truncate">{s.title??'—'}</td>
                  <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{s.duration_hours}h {s.duration_minutes%60}m</td>
                  <td className="px-5 py-3 text-gray-400">{formatViewers(s.peak_viewers)}</td>
                  <td className="px-5 py-3 font-medium text-[#7F77DD]">{formatSTMC(s.stmc_earned,4)}</td>
                  <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                </tr>
              ))}</tbody>
            </table></div>
        }
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Your reward formula</div>
        <div className="font-mono text-sm text-gray-300 space-y-1.5">
          <div><span className="text-gray-600 w-28 inline-block">Base rate</span> viewers × 0.00002 STMC/min</div>
          <div><span className="text-gray-600 w-28 inline-block">Epoch mult</span> ×{epoch.toFixed(4)}</div>
          <div><span className="text-gray-600 w-28 inline-block">Tier mult</span> ×{partnerMultiplier(streamer.avg_viewers).toFixed(2)} ({tier})</div>
          <div><span className="text-gray-600 w-28 inline-block">Hard cap</span> 10 STMC per streaming hour</div>
          <div className="pt-2 border-t border-[#30363d] text-[#7F77DD]">
            Preview: 5,000 viewers × 1h → {formatSTMC(calcStreamReward(5000,60,1,streamer.avg_viewers),4)} STMC
          </div>
        </div>
      </div>
    </div>
  )
}
