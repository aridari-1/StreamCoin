'use client'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer } from '@/hooks/useStreamer'
import { Spinner, EmptyState, TierBadge, YouTubeLogo } from '@/components/ui'
import { partnerMultiplier, epochMultiplier, formatViewers } from '@/lib/rewards'

const C = {
  card: { background:'rgba(12,16,22,.9)', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, backdropFilter:'blur(20px)' as const, padding:24 },
  muted: 'rgba(255,255,255,.35)',
  purple: '#8b7cf8',
}

export default function SettingsPage() {
  const { wallet, clearWallet } = useWallet()
  const { streamer, loading }   = useStreamer(wallet ?? undefined)
  const epoch                   = epochMultiplier()

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:64 }}><Spinner /></div>
  if (!streamer) return <EmptyState icon="▶" title="No account connected" action={{ label:'Connect YouTube', href:'/auth/connect' }} />

  const tier = streamer.tier ?? 'standard'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:640 }}>
      <div>
        <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.035em', margin:0 }}>Settings</h1>
        <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>Manage your StreamMine account</p>
      </div>

      {/* YouTube */}
      <div style={C.card}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:18 }}>YouTube Connection</div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:16, overflow:'hidden', flexShrink:0, border:'1px solid rgba(255,255,255,.08)' }}>
            {streamer.youtube_avatar
              ? <img src={streamer.youtube_avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:800, color:'#fff', background:'linear-gradient(135deg,#8b7cf8,#22d3a5)' }}>{(streamer.youtube_username ?? 'S')[0]}</div>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <YouTubeLogo size={14} />
              <span style={{ fontSize:15, fontWeight:700, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{streamer.youtube_username}</span>
              <TierBadge tier={tier} />
            </div>
            {streamer.youtube_handle && <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>{streamer.youtube_handle}</div>}
          </div>
          <a href="/auth/connect" style={{ padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:600, color:C.muted, textDecoration:'none', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', flexShrink:0 }}>
            Reconnect
          </a>
        </div>
      </div>

      {/* Wallet */}
      <div style={C.card}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:16 }}>Reward Wallet</div>
        <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', fontFamily:'monospace', fontSize:12, color:'rgba(255,255,255,.7)', wordBreak:'break-all', lineHeight:1.6 }}>
          {streamer.wallet_address}
        </div>
        <p style={{ fontSize:12, color:C.muted, marginTop:10, lineHeight:1.6 }}>
          SMINE rewards are minted to this address on Polygon. To change it, disconnect and reconnect with a different wallet.
        </p>
      </div>

      {/* Mining config */}
      <div style={C.card}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:18 }}>Mining Configuration</div>
        {[
          ['Tier',               `${tier.charAt(0).toUpperCase()+tier.slice(1)} (${formatViewers(streamer.avg_viewers)} avg viewers)`],
          ['Partner multiplier', `×${partnerMultiplier(streamer.avg_viewers).toFixed(2)}`],
          ['Epoch multiplier',   `×${epoch.toFixed(6)}`],
          ['Streamer cap',       '10 SMINE per streaming hour'],
          ['Viewer cap',         '15 SMINE per day'],
          ['Poll interval',      'Every 60 seconds'],
          ['Platform',           'YouTube Live'],
          ['Token',              'SMINE (StreamMine)'],
          ['Network',            'Polygon (PoS)'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize:13, color:C.muted }}>{k}</span>
            <span style={{ fontSize:13, fontFamily:'monospace', color:'#fff', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>

      {/* Oracle status */}
      <div style={{ ...C.card, background:'rgba(139,124,248,.06)', border:'1px solid rgba(139,124,248,.15)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.purple, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:16 }}>Oracle Network</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#22d3a5', boxShadow:'0 0 8px #22d3a5' }} />
          <span style={{ fontSize:13, fontWeight:600, color:'#22d3a5' }}>3-of-5 oracles active</span>
        </div>
        <p style={{ fontSize:12, color:C.muted, lineHeight:1.6, margin:0 }}>
          Your streams are verified by a decentralized oracle network. Each reward requires 3 independent signatures before SMINE is minted to your wallet.
        </p>
      </div>

      {/* Danger zone */}
      <div style={{ ...C.card, background:'rgba(255,77,109,.04)', border:'1px solid rgba(255,77,109,.18)' }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#ff4d6d', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:14 }}>Disconnect Account</div>
        <p style={{ fontSize:13, color:C.muted, marginBottom:18, lineHeight:1.6 }}>
          This removes your YouTube connection from the browser. Your earned SMINE and session history remain in the database. You can reconnect at any time.
        </p>
        <button onClick={() => { clearWallet(); window.location.href = '/' }}
          style={{ padding:'10px 20px', borderRadius:12, fontSize:13, fontWeight:700, color:'#ff4d6d', background:'rgba(255,77,109,.1)', border:'1px solid rgba(255,77,109,.25)', cursor:'pointer', transition:'all .2s', fontFamily:'inherit' }}>
          Disconnect
        </button>
      </div>
    </div>
  )
}