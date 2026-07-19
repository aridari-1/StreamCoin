'use client'
import { useWallet } from '@/hooks/useWallet'
import { useStreamer, useSessions } from '@/hooks/useStreamer'
import { StatusBadge, Spinner, EmptyState, SectionHeader } from '@/components/ui'
import { formatSTMC, formatViewers } from '@/lib/rewards'
import { useState } from 'react'
import type { StreamSession } from '@/types'

type Filter = 'all' | 'live' | 'rewarded' | 'pending_reward'

function SessionRow({ s }: { s: StreamSession }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr className="border-b border-[#30363d]/50 hover:bg-[#1c2128] transition-colors cursor-pointer"
        onClick={() => setOpen(o => !o)}>
        <td className="px-5 py-3 text-gray-400 text-sm whitespace-nowrap">
          {new Date(s.started_at).toLocaleDateString('en',{month:'short',day:'numeric'})}
          <div className="text-xs text-gray-600">{new Date(s.started_at).toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit'})}</div>
        </td>
        <td className="px-5 py-3 text-gray-300 max-w-[200px]"><div className="truncate text-sm">{s.title ?? 'Untitled'}</div></td>
        <td className="px-5 py-3 text-gray-400 text-sm whitespace-nowrap">{s.duration_hours}h {s.duration_minutes%60}m</td>
        <td className="px-5 py-3 text-sm">
          <div className="text-white">{formatViewers(s.peak_viewers)}</div>
          <div className="text-xs text-gray-600">avg {formatViewers(s.avg_viewers)}</div>
        </td>
        <td className="px-5 py-3 font-medium text-[#7F77DD] text-sm">{formatSTMC(s.stmc_earned,4)}</td>
        <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
        <td className="px-5 py-3 text-gray-600 text-xs">{open?'▲':'▼'}</td>
      </tr>
      {open && (
        <tr className="border-b border-[#30363d]/50 bg-[#0f1117]">
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
                ['Tx hash',         s.tx_hash ? `${s.tx_hash.slice(0,12)}…` : 'pending'],
              ].map(([k,v]) => (
                <div key={k as string}>
                  <div className="text-gray-600 uppercase tracking-wider mb-1">{k}</div>
                  <div className="text-white font-mono">{v}</div>
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

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return <EmptyState icon="▶" title="No account connected" action={{label:'Connect YouTube',href:'/auth/connect'}} />

  const totalEarned = sessions.reduce((a,s)=>a+s.stmc_earned,0)
  const totalHours  = sessions.reduce((a,s)=>a+s.duration_hours,0)

  return (
    <div className="space-y-6">
      <SectionHeader title="Stream Sessions" sub={`${sessions.length} sessions · ${totalHours}h total`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label:'Total STMC', value:formatSTMC(totalEarned), color:'text-[#7F77DD]'},
          {label:'Sessions',   value:sessions.length.toString(), color:'text-white'},
          {label:'Rewarded',   value:sessions.filter(s=>s.status==='rewarded').length.toString(), color:'text-green-400'},
          {label:'Pending',    value:sessions.filter(s=>s.status==='pending_reward').length.toString(), color:'text-yellow-400'},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all','live','rewarded','pending_reward'] as Filter[]).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter===f?'bg-[#7F77DD] text-white':'bg-[#161b22] border border-[#30363d] text-gray-400 hover:text-white'}`}>
            {f==='all'?'All':f==='pending_reward'?'Pending':f.charAt(0).toUpperCase()+f.slice(1)}
            <span className="ml-1.5 text-xs opacity-60">{f==='all'?sessions.length:sessions.filter(s=>s.status===f).length}</span>
          </button>
        ))}
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
        {filtered.length===0
          ? <div className="p-10 text-center text-gray-500 text-sm">No sessions yet. Go live on YouTube!</div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
              <thead><tr className="border-b border-[#30363d]">
                {['Date','Title','Duration','Viewers','STMC','Status',''].map(h=>(
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>{filtered.map(s=><SessionRow key={s.id} s={s}/>)}</tbody>
            </table></div>
        }
      </div>
    </div>
  )
}
export const dynamic = 'force-dynamic'
