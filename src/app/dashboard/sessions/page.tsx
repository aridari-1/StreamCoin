'use client'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer, useSessions } from '@/hooks/useStreamer'
import { StatusBadge, Spinner, EmptyState } from '@/components/ui'
import { formatSTMC, formatViewers } from '@/lib/rewards'
import { useState } from 'react'
import type { StreamSession } from '@/types'

export const dynamic = 'force-dynamic'

type Filter = 'all' | 'live' | 'ended' | 'rewarded' | 'pending_reward'

const C = {
  card: { background:'rgba(12,16,22,.9)', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, backdropFilter:'blur(20px)' as const },
  muted: 'rgba(255,255,255,.35)',
  purple: '#8b7cf8',
}

function SessionRow({ s }: { s: StreamSession }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ borderBottom:'1px solid rgba(255,255,255,.04)', cursor:'pointer', transition:'background .15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = '')}>
        <td style={{ padding:'14px 20px', whiteSpace:'nowrap' }}>
          <div style={{ fontSize:12, color:C.muted }}>{new Date(s.started_at).toLocaleDateString('en',{month:'short',day:'numeric'})}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', marginTop:2 }}>{new Date(s.started_at).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}</div>
        </td>
        <td style={{ padding:'14px 20px', maxWidth:180 }}>
          <div style={{ fontSize:13, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title ?? 'Untitled'}</div>
        </td>
        <td style={{ padding:'14px 20px', fontSize:12, color:C.muted, whiteSpace:'nowrap' }}>{s.duration_hours}h {s.duration_minutes%60}m</td>
        <td style={{ padding:'14px 20px' }}>
          <div style={{ fontSize:13, color:'#fff' }}>{formatViewers(s.peak_viewers)}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.25)', marginTop:2 }}>avg {formatViewers(s.avg_viewers)}</div>
        </td>
        <td style={{ padding:'14px 20px', fontSize:14, fontWeight:800, color:C.purple, fontVariantNumeric:'tabular-nums' }}>{formatSTMC(s.stmc_earned,4)}</td>
        <td style={{ padding:'14px 20px' }}><StatusBadge status={s.status} /></td>
        <td style={{ padding:'14px 20px', fontSize:12, color:'rgba(255,255,255,.2)' }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr style={{ borderBottom:'1px solid rgba(255,255,255,.04)', background:'rgba(139,124,248,.03)' }}>
          <td colSpan={7} style={{ padding:'16px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
              {[
                ['Verified viewers', s.verified_viewers?.toLocaleString() ?? '—'],
                ['Epoch mult',       `×${s.epoch_mult?.toFixed(4) ?? '1.0000'}`],
                ['Partner mult',     `×${s.partner_mult?.toFixed(2) ?? '1.00'}`],
                ['Duration mult',    `×${s.duration_mult?.toFixed(2) ?? '1.00'}`],
                ['Chat ratio',       s.chat_ratio?.toFixed(5) ?? '—'],
                ['Snapshots',        (s as any).snapshot_count ?? '—'],
                ['Oracle packet',    s.oracle_packet_id ? `${s.oracle_packet_id.slice(0,12)}…` : '—'],
                ['Tx hash',          s.tx_hash ? `${s.tx_hash.slice(0,12)}…` : 'pending'],
              ].map(([k,v]) => (
                <div key={k as string} style={{ padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{k as string}</div>
                  <div style={{ fontSize:12, fontFamily:'monospace', color:'#fff' }}>{v as string}</div>
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

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.status === filter)

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:64 }}><Spinner /></div>
  if (!streamer) return <EmptyState icon="▶" title="No account connected" action={{ label:'Connect YouTube', href:'/auth/connect' }} />

  const totalEarned = sessions.reduce((a,s) => a + Number(s.stmc_earned), 0)
  const totalHours  = sessions.reduce((a,s) => a + s.duration_hours, 0)

  const counts: Record<Filter,number> = {
    all:            sessions.length,
    live:           sessions.filter(s => s.status === 'live').length,
    ended:          sessions.filter(s => s.status === 'ended').length,
    rewarded:       sessions.filter(s => s.status === 'rewarded').length,
    pending_reward: sessions.filter(s => s.status === 'pending_reward').length,
  }

  const filterLabels: Record<Filter,string> = {
    all:'All', live:'Live', ended:'Ended', rewarded:'Rewarded', pending_reward:'Pending'
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.035em', margin:0 }}>Stream Sessions</h1>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>{sessions.length} sessions · {totalHours}h total</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {[
          { label:'Total SMINE', value:formatSTMC(totalEarned,4), color:'#a78bfa', accent:true },
          { label:'Sessions',    value:sessions.length.toString(), color:'#fff' },
          { label:'Rewarded',    value:counts.rewarded.toString(),       color:'#22d3a5' },
          { label:'Pending',     value:counts.pending_reward.toString(), color:'#f5a623' },
        ].map(({ label, value, color, accent }) => (
          <div key={label} style={{ ...C.card, padding:'18px 20px', background: accent ? 'linear-gradient(135deg,rgba(139,124,248,.13),rgba(12,16,22,.95))' : C.card.background, border: accent ? '1px solid rgba(139,124,248,.25)' : C.card.border }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:900, color, letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {(Object.keys(filterLabels) as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:'7px 16px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', transition:'all .2s', fontFamily:'inherit',
            background: filter === f ? '#8b7cf8' : 'rgba(255,255,255,.05)',
            color:      filter === f ? '#fff'    : C.muted,
            boxShadow:  filter === f ? '0 0 20px rgba(139,124,248,.35)' : 'none',
          }}>
            {filterLabels[f]}<span style={{ marginLeft:6, fontSize:10, opacity:.6 }}>{counts[f]}</span>
          </button>
        ))}
      </div>

      <div style={{ ...C.card, overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:'56px 20px', textAlign:'center', fontSize:13, color:C.muted }}>
            {filter === 'all' ? 'No sessions yet — go live on YouTube to start earning!' : `No ${filterLabels[filter].toLowerCase()} sessions.`}
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', minWidth:680, borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,.07)' }}>
                  {['Date','Title','Duration','Viewers','SMINE','Status',''].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{filtered.map(s => <SessionRow key={s.id} s={s} />)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}