'use client'
import { useWallet } from '@/hooks/useWallet'
import { useStreamer, useStreamerStats, useLiveSession } from '@/hooks/useStreamer'
import { LiveMiningCard } from '@/components/dashboard/LiveMiningCard'
import { TierBadge, StatusBadge, Spinner, EmptyState, YouTubeLogo } from '@/components/ui'
import { formatSTMC, formatViewers, epochMultiplier, calcStreamReward, partnerMultiplier } from '@/lib/rewards'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'next/navigation'

const C = {
  card: { background:'rgba(12,16,22,.9)', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, backdropFilter:'blur(20px)' as const },
  muted: 'rgba(255,255,255,.35)',
  purple: '#8b7cf8',
  green: '#22d3a5',
}

function MiniStat({ label, value, accent }: { label:string; value:string; accent?:boolean }) {
  return (
    <div style={{ ...C.card, padding:'18px 20px', background: accent ? 'linear-gradient(135deg,rgba(139,124,248,.14),rgba(12,16,22,.95))' : C.card.background, border: accent ? '1px solid rgba(139,124,248,.28)' : C.card.border, boxShadow: accent ? '0 0 30px rgba(139,124,248,.1)' : 'none' }}>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.035em', color: accent ? '#a78bfa' : '#fff', textShadow: accent ? '0 0 20px rgba(139,124,248,.4)' : 'none', fontVariantNumeric:'tabular-nums' }}>{value}</div>
    </div>
  )
}

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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:280 }}>
      <Spinner size="lg" />
    </div>
  )

  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      desc="Connect your YouTube channel to start mining SMINE"
      action={{ label:'Connect YouTube', href:'/auth/connect' }} />
  )

  const tier = streamer.tier ?? 'standard'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}`}</style>

      {connected === 'youtube' && channel && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:14, background:'rgba(34,211,165,.08)', border:'1px solid rgba(34,211,165,.2)' }}>
          <span style={{ color:'#22d3a5', fontSize:16 }}>✓</span>
          <span style={{ fontSize:13, fontWeight:600, color:'#22d3a5' }}>YouTube connected —</span>
          <span style={{ fontSize:13, color:'rgba(34,211,165,.6)' }}>{decodeURIComponent(channel)} is now mining SMINE</span>
        </div>
      )}

      {/* Streamer header */}
      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', padding:'8px 0' }}>
        <div style={{ position:'relative', flexShrink:0 }}>
          {streamer.youtube_avatar
            ? <img src={streamer.youtube_avatar} alt="avatar" style={{ width:56, height:56, borderRadius:16, objectFit:'cover', border:'2px solid rgba(139,124,248,.3)', boxShadow:'0 0 20px rgba(139,124,248,.2)' }} />
            : <div style={{ width:56, height:56, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#8b7cf8,#22d3a5)' }}>
                {(streamer.youtube_username ?? 'S')[0]}
              </div>
          }
          <div style={{ position:'absolute', bottom:-6, right:-6, width:22, height:22, borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', background:'#ff4d6d', boxShadow:'0 0 10px rgba(255,77,109,.4)' }}>
            <YouTubeLogo size={12} />
          </div>
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <h1 style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', margin:0 }}>{streamer.youtube_username ?? 'Streamer'}</h1>
            <TierBadge tier={tier} />
            {liveSession && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:'rgba(255,77,109,.12)', color:'#ff4d6d', border:'1px solid rgba(255,77,109,.3)' }}>
                <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#ff4d6d', boxShadow:'0 0 6px #ff4d6d', animation:'pulse .8s ease-in-out infinite' }} />
                Live
              </span>
            )}
          </div>
          <p style={{ fontSize:11, fontFamily:'monospace', color:C.muted, margin:'4px 0 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{streamer.wallet_address}</p>
        </div>

        <div style={{ display:'flex', gap:10, flexShrink:0 }}>
          {[
            { label:'Epoch',  value:`×${epoch.toFixed(4)}`, color:C.purple },
            { label:'Streak', value:`${streamer.streak_days ?? 0}d`, color:C.green },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding:'8px 14px', borderRadius:12, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', textAlign:'right' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:800, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {liveSession && <LiveMiningCard session={liveSession} />}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        <MiniStat label="Total SMINE"     value={formatSTMC(stats?.total_earned ?? 0)}        accent />
        <MiniStat label="This month"      value={formatSTMC(stats?.earned_this_month ?? 0)} />
        <MiniStat label="Avg viewers 30d" value={formatViewers(stats?.avg_viewers_30d ?? 0)} />
        <MiniStat label="Stream hours"    value={`${stats?.total_hours ?? 0}h`} />
      </div>

      {/* Chart */}
      {(stats?.earnings_chart?.length ?? 0) > 0 && (
        <div style={{ ...C.card, padding:24 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:20 }}>SMINE earned — last 14 streams</div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={stats!.earnings_chart}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#8b7cf8" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#8b7cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill:'rgba(255,255,255,.25)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'rgba(255,255,255,.25)', fontSize:11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ background:'rgba(12,16,22,.98)', border:'1px solid rgba(139,124,248,.2)', borderRadius:10, fontSize:12, color:'#fff' }} formatter={(v) => [`${Number(v).toFixed(4)} SMINE`, 'Earned']} />
              <Area type="monotone" dataKey="stmc" stroke="#8b7cf8" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent sessions */}
      <div style={{ ...C.card, overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
          <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>Recent Sessions</span>
          <a href="/dashboard/sessions" style={{ fontSize:12, fontWeight:600, color:C.purple, textDecoration:'none' }}>View all →</a>
        </div>
        {(stats?.recent_sessions?.length ?? 0) === 0 ? (
          <div style={{ padding:'48px 20px', textAlign:'center', fontSize:13, color:C.muted }}>No sessions yet — go live on YouTube to start earning!</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', minWidth:560, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                  {['Date','Title','Duration','Viewers','SMINE','Status'].map(h => (
                    <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats!.recent_sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom:'1px solid rgba(255,255,255,.04)', transition:'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding:'12px 20px', fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>{new Date(s.started_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</td>
                    <td style={{ padding:'12px 20px', fontSize:13, color:'#fff', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title ?? '—'}</td>
                    <td style={{ padding:'12px 20px', fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>{s.duration_hours}h {s.duration_minutes%60}m</td>
                    <td style={{ padding:'12px 20px', fontSize:12, color:C.muted }}>{formatViewers(s.peak_viewers)}</td>
                    <td style={{ padding:'12px 20px', fontSize:13, fontWeight:700, color:C.purple, fontVariantNumeric:'tabular-nums' }}>{formatSTMC(s.stmc_earned,4)}</td>
                    <td style={{ padding:'12px 20px' }}><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formula */}
      <div style={{ ...C.card, padding:22 }}>
        <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:16 }}>Your reward formula</div>
        {[
          ['Base rate',  `viewers × 0.00002 SMINE/min`],
          ['Epoch mult', `×${epoch.toFixed(4)}`],
          ['Tier mult',  `×${partnerMultiplier(streamer.avg_viewers).toFixed(2)} (${tier})`],
          ['Hard cap',   '10 SMINE per streaming hour'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize:13, color:C.muted }}>{k}</span>
            <span style={{ fontSize:13, fontFamily:'monospace', color:'#fff', fontWeight:500 }}>{v}</span>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:12 }}>
          <span style={{ fontSize:13, color:C.muted }}>5,000 viewers × 1h preview</span>
          <span style={{ fontSize:14, fontWeight:800, color:C.purple, fontVariantNumeric:'tabular-nums' }}>{formatSTMC(calcStreamReward(5000,60,1,streamer.avg_viewers),4)} SMINE</span>
        </div>
      </div>
    </div>
  )
}