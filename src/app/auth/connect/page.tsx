'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LogoMark } from '@/components/Logo'
import { getYouTubeOAuthUrl } from '@/lib/youtube'

type Step = 'wallet' | 'platform'

export default function ConnectPage() {
  const [step, setStep]               = useState<Step>('wallet')
  const [wallet, setWallet]           = useState('')
  const [walletError, setWalletError] = useState('')
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('stmc_wallet')
    if (stored) setWallet(stored)
  }, [])

  function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault()
    const addr = wallet.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setWalletError('Enter a valid Polygon wallet address (0x...)')
      return
    }
    setWalletError('')
    localStorage.setItem('stmc_wallet', addr)
    setStep('platform')
  }

  function connectYouTube() {
    setLoading(true)
    const url = getYouTubeOAuthUrl(`${window.location.origin}/api/youtube/callback`, wallet.trim())
    window.location.href = url
  }

  const s = {
    page:      { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', background:'#080b10', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' as const, overflow:'hidden' },
    glow1:     { position:'absolute' as const, width:500, height:500, borderRadius:'50%', background:'rgba(139,124,248,.1)', top:'-10%', left:'50%', transform:'translateX(-50%)', filter:'blur(80px)', pointerEvents:'none' as const },
    glow2:     { position:'absolute' as const, width:250, height:250, borderRadius:'50%', background:'rgba(34,211,165,.08)', bottom:'10%', right:'5%', filter:'blur(60px)', pointerEvents:'none' as const },
    wrap:      { width:'100%', maxWidth:420, position:'relative' as const, zIndex:10 },
    logoWrap:  { textAlign:'center' as const, marginBottom:40 },
    title:     { fontSize:26, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', margin:'0 0 8px' },
    sub:       { fontSize:14, color:'rgba(255,255,255,.35)', margin:0 },
    steps:     { display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:32 },
    card:      { background:'rgba(14,19,24,.9)', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:28, backdropFilter:'blur(20px)' },
    label:     { display:'block', fontSize:13, fontWeight:600, color:'rgba(255,255,255,.6)', marginBottom:10, letterSpacing:'.02em', textTransform:'uppercase' as const },
    input:     { width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:12, padding:'14px 16px', fontSize:13, fontFamily:'monospace', color:'#fff', outline:'none', boxSizing:'border-box' as const, transition:'border-color .2s' },
    hint:      { background:'rgba(139,124,248,.06)', border:'1px solid rgba(139,124,248,.15)', borderRadius:10, padding:'12px 14px', fontSize:12, color:'rgba(255,255,255,.35)', lineHeight:1.6 },
    btn:       { width:'100%', padding:'14px', borderRadius:12, fontWeight:700, fontSize:14, color:'#fff', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#8b7cf8,#6d5ce8)', boxShadow:'0 0 30px rgba(139,124,248,.4)', transition:'opacity .2s,transform .2s', letterSpacing:'-0.01em' },
    ytBtn:     { width:'100%', display:'flex', alignItems:'center', gap:16, padding:'16px', borderRadius:14, background:'rgba(255,77,109,.06)', border:'1px solid rgba(255,77,109,.2)', cursor:'pointer', transition:'background .2s', boxSizing:'border-box' as const },
    walletBox: { background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'12px 14px', marginBottom:16 },
    footer:    { textAlign:'center' as const, fontSize:11, color:'rgba(255,255,255,.15)', marginTop:20, lineHeight:1.6 },
  }

  return (
    <div style={s.page}>
      <div style={s.glow1} />
      <div style={s.glow2} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(139,124,248,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,124,248,.04) 1px,transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }} />

      <div style={s.wrap}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <Link href="/" style={{ textDecoration:'none', display:'flex', justifyContent:'center', marginBottom:20 }}>
            <LogoMark size="lg" />
          </Link>
          <h1 style={s.title}>
            {step === 'wallet' ? 'Connect your wallet' : 'Link YouTube channel'}
          </h1>
          <p style={s.sub}>
            {step === 'wallet' ? 'Step 1 of 2 — where your SMINE rewards go' : 'Step 2 of 2 — read-only access only'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={s.steps}>
          {[1,2].map((n, i) => {
            const done   = (n === 1 && step === 'platform')
            const active = (n === 1 && step === 'wallet') || (n === 2 && step === 'platform')
            return (
              <div key={n} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, transition:'all .3s',
                  background: done ? '#22d3a5' : active ? '#8b7cf8' : 'rgba(255,255,255,.06)',
                  color: (done || active) ? '#fff' : 'rgba(255,255,255,.3)',
                  boxShadow: active ? '0 0 16px rgba(139,124,248,.5)' : 'none',
                  border: `1px solid ${done ? '#22d3a5' : active ? '#8b7cf8' : 'rgba(255,255,255,.1)'}`,
                }}>
                  {done ? '✓' : n}
                </div>
                {i === 0 && (
                  <div style={{ width:48, height:1, background: step === 'platform' ? '#8b7cf8' : 'rgba(255,255,255,.08)', transition:'background .4s' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div style={s.card}>
          {step === 'wallet' && (
            <form onSubmit={handleWalletSubmit}>
              <label style={s.label}>Polygon wallet address</label>
              <input
                type="text" value={wallet}
                onChange={e => { setWallet(e.target.value); setWalletError('') }}
                placeholder="0x..."
                style={{ ...s.input, borderColor: walletError ? '#ff4d6d' : 'rgba(255,255,255,.1)', marginBottom: walletError ? 8 : 16 }}
                onFocus={e => { if (!walletError) e.target.style.borderColor = '#8b7cf8' }}
                onBlur={e => { if (!walletError) e.target.style.borderColor = 'rgba(255,255,255,.1)' }}
              />
              {walletError && <p style={{ fontSize:12, color:'#ff4d6d', marginBottom:16 }}>{walletError}</p>}
              <div style={{ ...s.hint, marginBottom:20 }}>
                SMINE rewards are minted directly to this address on Polygon. We never ask for your private key or seed phrase.
              </div>
              <button type="submit" style={s.btn}
                onMouseEnter={e => { e.currentTarget.style.opacity='.9'; e.currentTarget.style.transform='translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.transform='translateY(0)' }}>
                Continue →
              </button>
            </form>
          )}

          {step === 'platform' && (
            <div>
              <div style={s.walletBox}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>Reward wallet</div>
                <div style={{ fontSize:12, fontFamily:'monospace', color:'rgba(255,255,255,.7)', wordBreak:'break-all' }}>{wallet}</div>
              </div>

              <button onClick={connectYouTube} disabled={loading} style={s.ytBtn}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background='rgba(255,77,109,.12)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,77,109,.06)' }}>
                <div style={{ width:48, height:48, borderRadius:14, background:'#ff4d6d', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 0 20px rgba(255,77,109,.4)' }}>
                  <svg viewBox="0 0 24 24" style={{ width:24, height:24, fill:'white' }}>
                    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                  </svg>
                </div>
                <div style={{ flex:1, textAlign:'left' }}>
                  <div style={{ fontWeight:700, fontSize:15, color:'#fff' }}>Connect YouTube</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginTop:2 }}>Read-only · we never post or modify your channel</div>
                </div>
                {loading
                  ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2px solid rgba(255,77,109,.3)', borderTopColor:'#ff4d6d', animation:'spin 1s linear infinite' }} />
                  : <span style={{ color:'rgba(255,255,255,.3)', fontSize:18 }}>→</span>
                }
              </button>

              <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  [true,  'Channel name, avatar and handle'],
                  [true,  'Live stream concurrent viewer count'],
                  [true,  '30-day average viewers for tier'],
                  [false, 'Cannot post, delete or change anything'],
                ].map(([ok, label]) => (
                  <div key={label as string} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'rgba(255,255,255,.3)' }}>
                    <span style={{ color: ok ? '#22d3a5' : 'rgba(255,255,255,.2)', fontWeight:700 }}>{ok ? '✓' : '✕'}</span>
                    {label as string}
                  </div>
                ))}
              </div>

              <button onClick={() => setStep('wallet')} style={{ width:'100%', marginTop:20, padding:'10px', background:'none', border:'none', cursor:'pointer', fontSize:12, color:'rgba(255,255,255,.25)', transition:'color .2s' }}
                onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,.5)'}
                onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,.25)'}>
                ← Change wallet address
              </button>
            </div>
          )}
        </div>

        <p style={s.footer}>
          Read-only YouTube permissions · Polygon (PoS) · No private key required<br/>
          Your data is never sold or shared
        </p>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}