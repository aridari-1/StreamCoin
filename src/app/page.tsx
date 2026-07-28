'use client'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Logo, LogoMark } from '@/components/Logo'

function CoinRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const cv  = canvas

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = document.documentElement.scrollHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COLORS = ['#8b7cf8','#a78bfa','#c4b5fd','#22d3a5','#6ee7b7','#f5a623','#fbbf24']

    type Coin = {
      x: number; y: number; r: number
      vx: number; vy: number
      wobble: number; wobbleSpeed: number
      spin: number; spinSpeed: number
      opacity: number; color: string
      glowPhase: number
    }

    function make(fromTop = false): Coin {
      const r = 3 + Math.random() * 9
      return {
        x:           Math.random() * cv.width,
        y:           fromTop ? -(r * 2 + Math.random() * 200) : Math.random() * cv.height,
        r,
        vx:          (Math.random() - 0.5) * 0.6,
        vy:          0.6 + Math.random() * 1.6,
        wobble:      Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.05,
        spin:        Math.random() * Math.PI * 2,
        spinSpeed:   (Math.random() - 0.5) * 0.04,
        opacity:     0.35 + Math.random() * 0.55,
        color:       COLORS[Math.floor(Math.random() * COLORS.length)],
        glowPhase:   Math.random() * Math.PI * 2,
      }
    }

    const coins: Coin[] = Array.from({ length: 200 }, () => make())
    let frame = 0
    let raf: number
    let scrollY = window.scrollY
    let scrollVel = 0
    let lastScrollY = scrollY

    const onScroll = () => {
      scrollY = window.scrollY
      scrollVel = Math.abs(scrollY - lastScrollY)
      lastScrollY = scrollY
      if (cv.height < document.documentElement.scrollHeight) resize()
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    function drawCoin(c: Coin) {
      ctx.save()
      ctx.translate(c.x, c.y)
      ctx.rotate(c.spin)
      const sx = Math.cos(c.wobble)
      ctx.scale(sx === 0 ? 0.01 : sx, 1)
      ctx.globalAlpha = c.opacity
      const glow = 0.4 + 0.6 * Math.abs(Math.sin(c.glowPhase))

      // Outer glow
      const rg = ctx.createRadialGradient(0,0,0,0,0,c.r*2.8)
      rg.addColorStop(0, c.color + Math.round(glow*60).toString(16).padStart(2,'0'))
      rg.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(0,0,c.r*2.8,0,Math.PI*2)
      ctx.fillStyle = rg; ctx.fill()

      // Body
      const lg = ctx.createLinearGradient(-c.r,-c.r,c.r,c.r)
      lg.addColorStop(0,   c.color+'ff')
      lg.addColorStop(.45, c.color+'ee')
      lg.addColorStop(1,   c.color+'77')
      ctx.beginPath(); ctx.arc(0,0,c.r,0,Math.PI*2)
      ctx.fillStyle = lg; ctx.fill()

      // Shine
      const sh = ctx.createRadialGradient(-c.r*.3,-c.r*.35,0,-c.r*.3,-c.r*.35,c.r*.7)
      sh.addColorStop(0,'rgba(255,255,255,.55)')
      sh.addColorStop(1,'transparent')
      ctx.beginPath(); ctx.arc(0,0,c.r,0,Math.PI*2)
      ctx.fillStyle = sh; ctx.fill()

      // Ring
      if (c.r > 5) {
        ctx.beginPath(); ctx.arc(0,0,c.r*.68,0,Math.PI*2)
        ctx.strokeStyle='rgba(255,255,255,.2)'
        ctx.lineWidth=Math.max(.5,c.r*.1); ctx.stroke()
      }

      // S label
      if (c.r >= 6) {
        ctx.fillStyle=`rgba(255,255,255,${.55+glow*.2})`
        ctx.font=`bold ${Math.round(c.r*.95)}px -apple-system,sans-serif`
        ctx.textAlign='center'; ctx.textBaseline='middle'
        ctx.fillText('S',0,0)
      }
      ctx.restore()
    }

    function tick() {
      const viewTop    = scrollY - 200
      const viewBottom = scrollY + window.innerHeight + 200
      ctx.clearRect(0, viewTop, cv.width, window.innerHeight + 400)
      frame++

      const intensity = Math.min(1, scrollVel / 30)
      scrollVel *= 0.85

      for (const c of coins) {
        const boost = 1 + intensity * 5
        c.x += c.vx
        c.y += c.vy * boost
        c.wobble    += c.wobbleSpeed
        c.spin      += c.spinSpeed
        c.glowPhase += 0.04
        c.vx        += (Math.random() - 0.5) * 0.015
        if (c.vx >  1.2) c.vx =  1.2
        if (c.vx < -1.2) c.vx = -1.2
        if (c.y > cv.height + 100) Object.assign(c, make(true))
        if (c.x < -30)             c.x = cv.width + 30
        if (c.x > cv.width + 30)   c.x = -30
        if (c.y >= viewTop && c.y <= viewBottom) drawCoin(c)
      }
      raf = requestAnimationFrame(tick)
    }

    tick()
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <canvas ref={canvasRef}
      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:1 }} />
  )
}

function ScrollOpacityDriver() { return null }

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse-glow{0%,100%{opacity:.4}50%{opacity:.9}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
        @keyframes float-badge{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes border-glow{0%,100%{border-color:rgba(139,124,248,.2)}50%{border-color:rgba(139,124,248,.5)}}
        .hero-glow{position:absolute;border-radius:50%;filter:blur(90px);pointer-events:none}
        .grid-bg{background-image:linear-gradient(rgba(139,124,248,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,124,248,.05) 1px,transparent 1px);background-size:64px 64px}
        .shimmer-text{background:linear-gradient(90deg,#fff 0%,#a78bfa 35%,#22d3a5 55%,#fff 90%);background-size:600px 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 5s linear infinite}
        .glow-btn{background:linear-gradient(135deg,#8b7cf8,#6d5ce8);box-shadow:0 0 40px rgba(139,124,248,.55),0 0 80px rgba(139,124,248,.2),inset 0 1px 0 rgba(255,255,255,.15);transition:all .25s}
        .glow-btn:hover{box-shadow:0 0 60px rgba(139,124,248,.75),0 0 120px rgba(139,124,248,.35);transform:translateY(-2px) scale(1.02)}
        .ghost-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(12px);transition:all .2s}
        .ghost-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22)}
        .ticker-wrap{overflow:hidden;mask-image:linear-gradient(90deg,transparent,black 12%,black 88%,transparent)}
        .ticker-inner{display:flex;gap:56px;width:max-content;animation:ticker 35s linear infinite}
        .live-badge{animation:float-badge 3s ease-in-out infinite}
        .live-dot{width:8px;height:8px;border-radius:50%;background:#22d3a5;animation:pulse-glow 1.8s ease-in-out infinite;box-shadow:0 0 8px #22d3a5}
        .fade-u{animation:fade-up .9s ease both}
        .d1{animation-delay:.1s}.d2{animation-delay:.25s}.d3{animation-delay:.4s}.d4{animation-delay:.55s}
        .feature-card{background:rgba(12,16,22,.85);border:1px solid rgba(255,255,255,.07);border-radius:22px;padding:32px;backdrop-filter:blur(24px);transition:border-color .35s,transform .35s,box-shadow .35s;position:relative;overflow:hidden}
        .feature-card:hover{border-color:rgba(139,124,248,.35);transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.4),0 0 40px rgba(139,124,248,.08)}
        .feature-card::before{content:'';position:absolute;inset:-1px;border-radius:22px;background:linear-gradient(135deg,rgba(139,124,248,.2),transparent 50%);opacity:0;transition:opacity .35s;pointer-events:none}
        .feature-card:hover::before{opacity:1}
        .stat-tile{background:rgba(12,16,22,.9);border:1px solid rgba(139,124,248,.18);border-radius:14px;padding:22px 18px;text-align:center;animation:border-glow 4s ease-in-out infinite}
        .nav-glass{background:rgba(8,11,16,.75);backdrop-filter:blur(24px);border-bottom:1px solid rgba(255,255,255,.06)}
        .row-item{display:flex;justify-content:space-between;align-items:center;padding:11px 14px;border-radius:10px;transition:background .2s}
        .row-item:hover{background:rgba(255,255,255,.04)}
        .orbit{position:absolute;width:520px;height:520px;top:50%;left:50%;transform:translate(-50%,-50%);animation:spin-slow 32s linear infinite;opacity:.18;pointer-events:none}
        .orbit2{animation-duration:48s;animation-direction:reverse;opacity:.1}
        .section-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(139,124,248,.2),rgba(34,211,165,.15),transparent);margin:0}
      `}</style>

      <CoinRain />
      <ScrollOpacityDriver />

      <div style={{ background:'#080b10', minHeight:'100vh', color:'#e2e8f0', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX:'hidden', position:'relative', zIndex:2 }}>

        {/* NAV */}
       <nav className="nav-glass" style={{ position:'sticky', top:0, zIndex:100, height:62, display:'flex', alignItems:'center', padding:'0 32px', justifyContent:'space-between' }}>
  <Logo size="md" />

        {/* HERO */}
        <section style={{ position:'relative', minHeight:'94vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 24px 64px', overflow:'hidden' }}>
          <div className="grid-bg" style={{ position:'absolute', inset:0, opacity:.7 }} />
          <div className="hero-glow" style={{ width:700, height:500, background:'rgba(139,124,248,.13)', top:'5%', left:'50%', transform:'translateX(-50%)' }} />
          <div className="hero-glow" style={{ width:350, height:350, background:'rgba(34,211,165,.09)', bottom:'15%', right:'8%', animation:'pulse-glow 5s ease-in-out infinite' }} />
          <div className="hero-glow" style={{ width:220, height:220, background:'rgba(139,124,248,.11)', bottom:'25%', left:'6%', animation:'pulse-glow 3.5s ease-in-out infinite' }} />

          <div className="orbit">
            <svg viewBox="0 0 520 520" fill="none">
              <circle cx="260" cy="260" r="250" stroke="url(#og)" strokeWidth=".6" strokeDasharray="5 10"/>
              <circle cx="260" cy="260" r="170" stroke="url(#og)" strokeWidth=".4" strokeDasharray="2 8"/>
              <defs><linearGradient id="og" x1="0" y1="0" x2="520" y2="520"><stop stopColor="#8b7cf8"/><stop offset="1" stopColor="#22d3a5"/></linearGradient></defs>
            </svg>
          </div>
          <div className="orbit orbit2">
            <svg viewBox="0 0 520 520" fill="none">
              <circle cx="260" cy="260" r="220" stroke="url(#og2)" strokeWidth=".4" strokeDasharray="3 12"/>
              <defs><linearGradient id="og2" x1="520" y1="0" x2="0" y2="520"><stop stopColor="#22d3a5"/><stop offset="1" stopColor="#8b7cf8"/></linearGradient></defs>
            </svg>
          </div>

          <div style={{ position:'relative', zIndex:10, maxWidth:820 }}>
            <div className="fade-u live-badge" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'7px 18px', borderRadius:99, marginBottom:36, fontSize:12, fontWeight:600, color:'#22d3a5', background:'rgba(34,211,165,.1)', border:'1px solid rgba(34,211,165,.25)', boxShadow:'0 0 20px rgba(34,211,165,.08)' }}>
              <div className="live-dot" />
              Oracle network live · Polygon (PoS) · SMINE
            </div>

            <h1 className="fade-u d1" style={{ fontSize:'clamp(52px,9vw,96px)', fontWeight:900, lineHeight:1.02, letterSpacing:'-0.05em', marginBottom:24, color:'#fff' }}>
              <span className="shimmer-text">Mine SMINE</span><br />
              <span style={{ color:'rgba(255,255,255,.82)' }}>while you stream</span>
            </h1>

            <p className="fade-u d2" style={{ fontSize:18, lineHeight:1.75, color:'rgba(255,255,255,.45)', maxWidth:580, margin:'0 auto 52px', fontWeight:400 }}>
              StreamMine rewards YouTube creators with SMINE tokens — verified every 60 seconds by a 3-of-5 oracle network and minted directly on Polygon.
            </p>

            <div className="fade-u d3" style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:80 }}>
              <Link href="/auth/connect" className="glow-btn" style={{ color:'#fff', textDecoration:'none', fontSize:16, fontWeight:800, padding:'15px 36px', borderRadius:16, letterSpacing:'-0.01em', display:'inline-block' }}>Start Mining →</Link>
              <Link href="/dashboard" className="ghost-btn" style={{ color:'rgba(255,255,255,.78)', textDecoration:'none', fontSize:15, fontWeight:600, padding:'15px 32px', borderRadius:16, display:'inline-block' }}>View Dashboard</Link>
            </div>

            <div className="fade-u d4" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, borderRadius:22, overflow:'hidden', maxWidth:540, margin:'0 auto', boxShadow:'0 0 0 1px rgba(139,124,248,.18)' }}>
              {[
                { val:'10 SMINE', label:'per stream hour'  },
                { val:'15 SMINE', label:'viewer daily cap' },
                { val:'400M',     label:'mining pool'      },
              ].map(({ val, label }) => (
                <div key={label} style={{ padding:'24px 16px', textAlign:'center', background:'rgba(8,11,16,.92)', backdropFilter:'blur(20px)' }}>
                  <div style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-0.04em', textShadow:'0 0 24px rgba(139,124,248,.5)' }}>{val}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', marginTop:5, textTransform:'uppercase', letterSpacing:'.07em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'rgba(255,255,255,.2)', fontSize:11, letterSpacing:'.1em', textTransform:'uppercase' }}>
            <span>Scroll to explore</span>
            <div style={{ width:1, height:36, background:'linear-gradient(to bottom,rgba(139,124,248,.4),transparent)' }} />
          </div>
        </section>

        {/* TICKER */}
        <div className="section-divider" />
        <div style={{ padding:'14px 0', background:'rgba(139,124,248,.03)' }}>
          <div className="ticker-wrap">
            <div className="ticker-inner" style={{ color:'rgba(255,255,255,.25)', fontSize:12, fontWeight:600, letterSpacing:'.09em', textTransform:'uppercase' }}>
              {Array(2).fill(['⬡ StreamMine (SMINE)','·','Polygon PoS','·','ERC-20','·','3-of-5 Oracle Network','·','Trading Locked','·','60s Verified Polling','·','Bot Detection','·','400M Mining Pool','·','25% Annual Decay','·','CertiK Audit Pending','·','YouTube Live Only','·']).flat().map((t,i) => <span key={i} style={{ flexShrink:0 }}>{t}</span>)}
            </div>
          </div>
        </div>
        <div className="section-divider" />

        {/* HOW IT WORKS */}
        <section style={{ padding:'110px 24px', maxWidth:1140, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:72 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#8b7cf8', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:18 }}>How it works</div>
            <h2 style={{ fontSize:'clamp(34px,5vw,56px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.05, margin:0 }}>Two ways to earn SMINE</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(310px,1fr))', gap:22 }}>
            {[
              { icon:'▶', title:'Stream to earn', desc:'Go live on YouTube. Your viewer count is verified every 60 seconds by our oracle. SMINE lands in your wallet automatically when the stream ends.', rows:[['Base rate','viewers × 0.00002 SMINE/min'],['Partner bonus','×1.50 for 500+ avg viewers'],['Hard cap','10 SMINE per stream hour']], rColor:'#a78bfa', rBg:'rgba(139,124,248,.07)', rBorder:'rgba(139,124,248,.1)', glow:'rgba(139,124,248,.07)', iconBg:'linear-gradient(135deg,rgba(139,124,248,.4),rgba(139,124,248,.1))', iconBorder:'rgba(139,124,248,.3)', iconShadow:'0 0 20px rgba(139,124,248,.2)' },
              { icon:'👁', title:'Watch to earn', desc:'Watch verified streams and earn 0.19 SMINE per minute. Build a 30-day streak for a ×1.33 multiplier — capped at 15 SMINE per day.', rows:[['Base rate','0.19 SMINE/min (flat for all)'],['Streak bonus','×1.33 at 30 consecutive days'],['Daily cap','15 SMINE per day maximum']], rColor:'#34d399', rBg:'rgba(34,211,165,.06)', rBorder:'rgba(34,211,165,.12)', glow:'rgba(34,211,165,.06)', iconBg:'linear-gradient(135deg,rgba(34,211,165,.4),rgba(34,211,165,.1))', iconBorder:'rgba(34,211,165,.3)', iconShadow:'0 0 20px rgba(34,211,165,.15)' },
              { icon:'🔒', title:'Built conservatively', desc:'Rewards decay 25% per year. Trading locked until DAO vote. Liquidity burned at launch. Every mint requires 3-of-5 oracle signatures on-chain.', rows:[['Epoch decay','×0.75 per year'],['Oracle threshold','3-of-5 signatures per mint'],['Trading unlock','DAO governance vote only']], rColor:'#fbbf24', rBg:'rgba(245,166,35,.06)', rBorder:'rgba(245,166,35,.12)', glow:'rgba(245,166,35,.05)', iconBg:'linear-gradient(135deg,rgba(245,166,35,.4),rgba(245,166,35,.1))', iconBorder:'rgba(245,166,35,.3)', iconShadow:'0 0 20px rgba(245,166,35,.12)' },
            ].map(({ icon, title, desc, rows, rColor, rBg, rBorder, glow, iconBg, iconBorder, iconShadow }) => (
              <div key={title} className="feature-card">
                <div style={{ position:'absolute', top:-50, right:-50, width:220, height:220, borderRadius:'50%', background:glow, filter:'blur(50px)' }} />
                <div style={{ width:54, height:54, borderRadius:16, background:iconBg, border:`1px solid ${iconBorder}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, marginBottom:22, boxShadow:iconShadow }}>{icon}</div>
                <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', marginBottom:12, letterSpacing:'-0.025em' }}>{title}</h3>
                <p style={{ fontSize:14, lineHeight:1.75, color:'rgba(255,255,255,.42)', marginBottom:28 }}>{desc}</p>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {rows.map(([label, val]) => (
                    <div key={label} className="row-item" style={{ background:rBg, border:`1px solid ${rBorder}` }}>
                      <span style={{ fontSize:12, color:'rgba(255,255,255,.36)' }}>{label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:rColor, fontFamily:'monospace' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="section-divider" />

        {/* TOKENOMICS */}
        <section style={{ padding:'100px 24px' }}>
          <div style={{ maxWidth:1060, margin:'0 auto' }}>
            <div style={{ textAlign:'center', marginBottom:56 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#8b7cf8', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:16 }}>Tokenomics</div>
              <h2 style={{ fontSize:'clamp(28px,5vw,48px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', margin:0 }}>1,000,000,000 SMINE total supply</h2>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:14 }}>
              {[
                { pct:'40%', label:'Mining rewards', color:'#8b7cf8', amount:'400M', delay:'0s'   },
                { pct:'20%', label:'Liquidity',      color:'#22d3a5', amount:'200M', delay:'.06s' },
                { pct:'10%', label:'Team (vested)',  color:'#f5a623', amount:'100M', delay:'.12s' },
                { pct:'8%',  label:'DAO treasury',   color:'#60a5fa', amount:'80M',  delay:'.18s' },
                { pct:'8%',  label:'Ecosystem',      color:'#34d399', amount:'80M',  delay:'.24s' },
                { pct:'7%',  label:'Airdrop',        color:'#fb923c', amount:'70M',  delay:'.30s' },
                { pct:'7%',  label:'Fundraise',      color:'#a78bfa', amount:'70M',  delay:'.36s' },
              ].map(({ pct, label, color, amount, delay }) => (
                <div key={label} className="stat-tile" style={{ animationDelay:delay }}>
                  <div style={{ fontSize:30, fontWeight:900, color, letterSpacing:'-0.04em', marginBottom:6, textShadow:`0 0 20px ${color}60` }}>{pct}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginBottom:3, lineHeight:1.3 }}>{label}</div>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.2)', fontFamily:'monospace' }}>{amount} SMINE</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="section-divider" />

        {/* COIN RAIN SECTION */}
        <section style={{ padding:'100px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:400, borderRadius:'50%', background:'rgba(139,124,248,.08)', filter:'blur(80px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#22d3a5', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:18 }}>Watch it happen</div>
            <h2 style={{ fontSize:'clamp(30px,5vw,52px)', fontWeight:900, color:'#fff', letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:20 }}>
              SMINE falls into your wallet<br/>every time you stream
            </h2>
            <p style={{ fontSize:16, color:'rgba(255,255,255,.38)', maxWidth:480, margin:'0 auto 48px', lineHeight:1.7 }}>
              The coins falling as you scroll represent SMINE tokens being minted to streamers right now on Polygon. Every stream. Every minute.
            </p>
            <div style={{ display:'flex', justifyContent:'center', gap:32, flexWrap:'wrap', marginBottom:48 }}>
              {[
                { icon:'▶', label:'Go live on YouTube',     color:'#8b7cf8' },
                { icon:'◎', label:'Oracle verifies viewers', color:'#22d3a5' },
                { icon:'⬡', label:'SMINE minted to wallet', color:'#f5a623' },
              ].map(({ icon, label, color }, i) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, background:`${color}18`, border:`1px solid ${color}30`, color, boxShadow:`0 0 16px ${color}20` }}>{icon}</div>
                  <span style={{ fontSize:14, color:'rgba(255,255,255,.55)', fontWeight:500 }}>{label}</span>
                  {i < 2 && <span style={{ color:'rgba(255,255,255,.15)', fontSize:20 }}>→</span>}
                </div>
              ))}
            </div>
            <Link href="/auth/connect" className="glow-btn" style={{ color:'#fff', textDecoration:'none', fontSize:16, fontWeight:800, padding:'16px 44px', borderRadius:16, display:'inline-block', letterSpacing:'-0.01em' }}>
              Connect & Start Mining →
            </Link>
          </div>
        </section>

        <div className="section-divider" />

        {/* FINAL CTA */}
        <section style={{ padding:'120px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:300, borderRadius:'50%', background:'rgba(139,124,248,.1)', filter:'blur(80px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:2 }}>
            <h2 style={{ fontSize:'clamp(38px,7vw,72px)', fontWeight:900, color:'#fff', letterSpacing:'-0.05em', lineHeight:1.02, marginBottom:20 }}>
              Ready to start<br/><span className="shimmer-text">mining SMINE?</span>
            </h2>
            <p style={{ fontSize:17, color:'rgba(255,255,255,.38)', maxWidth:400, margin:'0 auto 44px', lineHeight:1.7 }}>
              Connect your YouTube channel and Polygon wallet. Rewards flow automatically every stream.
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <Link href="/auth/connect" className="glow-btn" style={{ color:'#fff', textDecoration:'none', fontSize:16, fontWeight:800, padding:'16px 44px', borderRadius:16, display:'inline-block', letterSpacing:'-0.01em' }}>Start Mining →</Link>
              <Link href="/dashboard" className="ghost-btn" style={{ color:'rgba(255,255,255,.7)', textDecoration:'none', fontSize:15, fontWeight:600, padding:'16px 32px', borderRadius:16, display:'inline-block' }}>View Dashboard</Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <Logo size="sm" />
          <div style={{ fontSize:11, color:'rgba(255,255,255,.18)', lineHeight:1.6, textAlign:'center' }}>
            © 2026 StreamMine · Polygon (PoS) · ERC-20 · Smart contracts pending CertiK audit · Trading locked until DAO vote
          </div>
        </footer>

      </div>
    </>
  )
}