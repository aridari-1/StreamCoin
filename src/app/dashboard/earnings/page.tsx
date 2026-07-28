'use client'
import { useAccount } from 'wagmi'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer, useStreamerStats } from '@/hooks/useStreamer'
import { useSTMCBalance, useSTMCToken, formatSTMCBalance } from '@/hooks/useSTMC'
import { WalletButton } from '@/components/WalletButton'
import { Spinner, EmptyState } from '@/components/ui'
import { formatSTMC, epochMultiplier } from '@/lib/rewards'
import { POLYGON_CHAIN_ID } from '@/lib/wagmi'

const C = {
  card: { background:'rgba(12,16,22,.9)', border:'1px solid rgba(255,255,255,.07)', borderRadius:18, backdropFilter:'blur(20px)' as const },
  muted: 'rgba(255,255,255,.35)',
  purple: '#8b7cf8',
  green: '#22d3a5',
  amber: '#f5a623',
}

function OnChainCard({ walletAddress }: { walletAddress: `0x${string}` }) {
  const { balance, pendingAmount, pendingReleaseTime, pendingReady, isLoading, refetch } = useSTMCBalance(walletAddress)
  const { tradingEnabled, mintedPercent } = useSTMCToken()
  const releaseDate = pendingReleaseTime ? new Date(pendingReleaseTime).toLocaleString() : null

  return (
    <div style={{ ...C.card, overflow:'hidden' }}>
      <div style={{ padding:'16px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize:14, fontWeight:700, color:'#fff' }}>On-chain SMINE Balance</span>
        <button onClick={() => refetch()} style={{ fontSize:12, color:C.muted, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>↻ Refresh</button>
      </div>
      {isLoading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}><Spinner /></div>
      ) : (
        <div style={{ padding:24 }}>
          <div style={{ textAlign:'center', padding:'28px 0', borderBottom:'1px solid rgba(255,255,255,.06)', marginBottom:20 }}>
            <div style={{ fontSize:56, fontWeight:900, letterSpacing:'-0.05em', color:'#fff', fontVariantNumeric:'tabular-nums', textShadow:'0 0 30px rgba(139,124,248,.3)' }}>
              {formatSTMCBalance(balance)}
            </div>
            <div style={{ fontSize:18, fontWeight:600, color:C.muted, marginTop:4, letterSpacing:'.04em' }}>SMINE</div>
            <a href={`https://polygonscan.com/address/${walletAddress}`} target="_blank" rel="noreferrer"
              style={{ fontSize:12, color:C.purple, textDecoration:'none', marginTop:10, display:'inline-block' }}>
              {walletAddress.slice(0,8)}…{walletAddress.slice(-6)} ↗
            </a>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
            <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Trading status</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color: tradingEnabled ? C.green : C.amber }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background: tradingEnabled ? C.green : C.amber, boxShadow:`0 0 6px ${tradingEnabled ? C.green : C.amber}` }} />
                {tradingEnabled ? 'Tradeable' : 'Locked — pre-launch'}
              </div>
            </div>
            <div style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontSize:10, color:C.muted, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8 }}>Pool minted</div>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{mintedPercent.toFixed(2)}%</div>
            </div>
          </div>

          {pendingAmount > 0 && (
            <div style={{ padding:'16px', borderRadius:14, marginBottom:20, background: pendingReady ? 'rgba(34,211,165,.08)' : 'rgba(245,166,35,.08)', border:`1px solid ${pendingReady ? 'rgba(34,211,165,.2)' : 'rgba(245,166,35,.2)'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:13, fontWeight:600, color: pendingReady ? C.green : C.amber }}>{pendingReady ? '✓ Withdrawal ready' : '⏳ Pending withdrawal'}</span>
                <span style={{ fontSize:18, fontWeight:800, color: pendingReady ? C.green : C.amber }}>{formatSTMCBalance(pendingAmount)} SMINE</span>
              </div>
              {releaseDate && !pendingReady && <div style={{ fontSize:12, color:C.amber }}>Unlocks: {releaseDate}</div>}
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, paddingTop:16, borderTop:'1px solid rgba(255,255,255,.06)' }}>
            <span style={{ color:C.muted }}>SMINE Contract (Polygon)</span>
            <a href={`https://polygonscan.com/address/${process.env.NEXT_PUBLIC_STMC_CONTRACT}`} target="_blank" rel="noreferrer" style={{ color:C.purple, textDecoration:'none', fontWeight:600 }}>View on PolygonScan ↗</a>
          </div>
        </div>
      )}
    </div>
  )
}

function ConnectPrompt() {
  return (
    <div style={{ ...C.card, padding:40, textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 20px', background:'rgba(139,124,248,.12)', border:'1px solid rgba(139,124,248,.2)' }}>⬡</div>
      <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:8 }}>Connect your wallet</div>
      <div style={{ fontSize:13, color:C.muted, marginBottom:28, maxWidth:300, margin:'0 auto 28px', lineHeight:1.6 }}>Your SMINE rewards are minted directly to your Polygon wallet.</div>
      <WalletButton />
      <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', marginTop:14 }}>Supports MetaMask · Coinbase · any injected wallet</div>
    </div>
  )
}

export default function EarningsPage() {
  const { wallet }            = useWallet()
  const { streamer, loading } = useStreamer(wallet ?? undefined)
  const { stats }             = useStreamerStats(streamer?.id)
  const { address, isConnected, chain } = useAccount()
  const epoch       = epochMultiplier()
  const isOnPolygon = chain?.id === POLYGON_CHAIN_ID

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:64 }}><Spinner /></div>
  if (!streamer) return <EmptyState icon="▶" title="No account connected" action={{ label:'Connect YouTube', href:'/auth/connect' }} />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:900, color:'#fff', letterSpacing:'-0.035em', margin:0 }}>Earnings</h1>
          <p style={{ fontSize:13, color:C.muted, marginTop:4 }}>SMINE mining rewards — off-chain tracked + on-chain balance</p>
        </div>
        <WalletButton />
      </div>

      {isConnected && !isOnPolygon && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:14, background:'rgba(255,77,109,.08)', border:'1px solid rgba(255,77,109,.2)' }}>
          <span style={{ fontSize:16 }}>⚠</span>
          <span style={{ fontSize:13, fontWeight:600, color:'#ff4d6d' }}>Wrong network —</span>
          <span style={{ fontSize:13, color:'rgba(255,77,109,.6)' }}>Switch to Polygon to see your SMINE balance</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
        {[
          { label:'Total earned', value:formatSTMC(stats?.total_earned ?? 0, 4),       accent:true },
          { label:'This month',   value:formatSTMC(stats?.earned_this_month ?? 0, 4) },
          { label:'This week',    value:formatSTMC(stats?.earned_this_week ?? 0, 4) },
          { label:'Today',        value:formatSTMC(stats?.earned_today ?? 0, 4) },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ ...C.card, padding:'18px 20px', background: accent ? 'linear-gradient(135deg,rgba(139,124,248,.13),rgba(12,16,22,.95))' : C.card.background, border: accent ? '1px solid rgba(139,124,248,.25)' : C.card.border }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>{label}</div>
            <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.035em', color: accent ? '#a78bfa' : '#fff', fontVariantNumeric:'tabular-nums', textShadow: accent ? '0 0 20px rgba(139,124,248,.4)' : 'none' }}>{value}</div>
          </div>
        ))}
      </div>

      {isConnected && address && isOnPolygon ? <OnChainCard walletAddress={address} /> : <ConnectPrompt />}

      <div style={{ ...C.card, padding:22 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:18 }}>Mining Rate Info</div>
        {[
          ['Current epoch multiplier', `×${epoch.toFixed(6)}`],
          ['Streamer cap',             '10 SMINE / streaming hour'],
          ['Viewer cap',               '15 SMINE / day'],
          ['Reward pool remaining',    '400,000,000 SMINE (decreases over time)'],
          ['Emission decay',           '25% per year (epoch-based)'],
          ['Network',                  'Polygon (PoS) — ~$0.001 per mint tx'],
        ].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
            <span style={{ fontSize:13, color:C.muted }}>{k}</span>
            <span style={{ fontSize:13, fontFamily:'monospace', color:'#fff', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ ...C.card, padding:22, background:'rgba(245,166,35,.04)', border:'1px solid rgba(245,166,35,.15)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.amber, boxShadow:`0 0 8px ${C.amber}` }} />
          <span style={{ fontSize:14, fontWeight:700, color:C.amber }}>Trading locked — DAO vote required</span>
        </div>
        <p style={{ fontSize:13, color:C.muted, lineHeight:1.7, margin:0 }}>
          SMINE is being minted to wallets via the MiningEngine contract, but wallet-to-wallet transfers and DEX trading are disabled until the DAO enables trading. Your balance accumulates on-chain even while locked.
        </p>
      </div>
    </div>
  )
}