import Link from 'next/link'

export default function Home() {
  return (
    <>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse-glow { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .hero-glow{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}
        .grid-overlay{background-image:linear-gradient(rgba(139,124,248,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,124,248,.06) 1px,transparent 1px);background-size:60px 60px}
        .stat-card{background:rgba(14,19,24,.8);border:1px solid rgba(139,124,248,.2);backdrop-filter:blur(20px)}
        .feature-card{background:rgba(14,19,24,.6);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(20px);transition:border-color .3s,transform .3s}
        .feature-card:hover{border-color:rgba(139,124,248,.4);transform:translateY(-4px)}
        .glow-btn{background:linear-gradient(135deg,#8b7cf8,#6d5ce8);box-shadow:0 0 40px rgba(139,124,248,.5),0 0 80px rgba(139,124,248,.2);transition:box-shadow .3s,transform .2s}
        .glow-btn:hover{box-shadow:0 0 60px rgba(139,124,248,.7),0 0 120px rgba(139,124,248,.3);transform:translateY(-2px)}
        .ghost-btn{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);backdrop-filter:blur(10px);transition:background .2s,border-color .2s}
        .ghost-btn:hover{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.2)}
        .ticker-wrap{overflow:hidden;mask-image:linear-gradient(90deg,transparent,black 15%,black 85%,transparent)}
        .ticker-inner{display:flex;gap:48px;width:max-content;animation:ticker 30s linear infinite}
        .oracle-badge{background:rgba(34,211,165,.1);border:1px solid rgba(34,211,165,.25)}
        .nav-blur{background:rgba(8,11,16,.7);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.06)}
        .shimmer-text{background:linear-gradient(90deg,#fff 0%,#8b7cf8 40%,#22d3a5 60%,#fff 100%);background-size:400px 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}
        .live-dot{width:8px;height:8px;border-radius:50%;background:#22d3a5;box-shadow:0 0 0 0 rgba(34,211,165,.4);animation:pulse-glow 2s ease-in-out infinite}
        .section-fade{animation:fade-up .8s ease both}
        .delay-1{animation-delay:.15s} .delay-2{animation-delay:.3s} .delay-3{animation-delay:.45s}
        .num-glow{text-shadow:0 0 30px rgba(139,124,248,.6)}
        .border-gradient{border:1px solid transparent;background-clip:padding-box;position:relative}
        .border-gradient::before{content:'';position:absolute;inset:-1px;border-radius:inherit;background:linear-gradient(135deg,rgba(139,124,248,.4),rgba(34,211,165,.2),rgba(139,124,248,.1));z-index:-1}
      `}</style>

      <div style={{ background: '#080b10', minHeight: '100vh', color: '#e2e8f0', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', overflowX: 'hidden' }}>

        {/* Nav */}
        <nav className="nav-blur" style={{ position: 'sticky', top: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', padding: '0 32px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#8b7cf8,#22d3a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', boxShadow: '0 0 20px rgba(139,124,248,.4)' }}>▶</div>
            <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: '#fff' }}>StreamMine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/dashboard" style={{ color: 'rgba(255,255,255,.5)', textDecoration: 'none', fontSize: 14, padding: '6px 14px', borderRadius: 8 }}>Dashboard</Link>
            <Link href="/auth/connect" className="glow-btn" style={{ color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 10 }}>Start Mining</Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 24px 60px', overflow: 'hidden' }}>
          <div className="grid-overlay" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
          <div className="hero-glow" style={{ width: 600, height: 600, background: 'rgba(139,124,248,.15)', top: '10%', left: '50%', transform: 'translateX(-50%)' }} />
          <div className="hero-glow" style={{ width: 300, height: 300, background: 'rgba(34,211,165,.1)', bottom: '20%', right: '10%', animation: 'pulse-glow 4s ease-in-out infinite' }} />
          <div className="hero-glow" style={{ width: 200, height: 200, background: 'rgba(139,124,248,.12)', bottom: '30%', left: '5%', animation: 'pulse-glow 3s ease-in-out infinite' }} />

          <div style={{ position: 'absolute', width: 500, height: 500, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', animation: 'spin-slow 30s linear infinite', opacity: 0.15, pointerEvents: 'none' }}>
            <svg viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="250" cy="250" r="240" stroke="url(#orbitGrad)" strokeWidth="0.5" strokeDasharray="4 8"/>
              <circle cx="250" cy="250" r="160" stroke="url(#orbitGrad)" strokeWidth="0.5" strokeDasharray="2 6"/>
              <defs>
                <linearGradient id="orbitGrad" x1="0" y1="0" x2="500" y2="500">
                  <stop stopColor="#8b7cf8"/>
                  <stop offset="1" stopColor="#22d3a5"/>
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 10, maxWidth: 780 }}>
            <div className="section-fade oracle-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 99, marginBottom: 32, fontSize: 12, fontWeight: 500, color: '#22d3a5' }}>
              <div className="live-dot" />
              Oracle network live · Polygon (PoS) · Ticker: SMINE
            </div>

            <h1 className="section-fade delay-1" style={{ fontSize: 'clamp(48px,8vw,88px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 28, color: '#fff' }}>
              <span className="shimmer-text">Mine SMINE</span>
              <br />
              <span style={{ color: 'rgba(255,255,255,.85)' }}>while you stream</span>
            </h1>

            <p className="section-fade delay-2" style={{ fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,.5)', maxWidth: 560, margin: '0 auto 48px', fontWeight: 400 }}>
              StreamMine rewards YouTube creators with SMINE tokens — verified every 60 seconds by a 3-of-5 oracle network and minted directly to your wallet.
            </p>

            <div className="section-fade delay-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 80 }}>
              <Link href="/auth/connect" className="glow-btn" style={{ color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, padding: '14px 32px', borderRadius: 14, letterSpacing: '-0.01em' }}>
                Start Mining →
              </Link>
              <Link href="/dashboard" className="ghost-btn" style={{ color: 'rgba(255,255,255,.8)', textDecoration: 'none', fontSize: 15, fontWeight: 600, padding: '14px 32px', borderRadius: 14 }}>
                View Dashboard
              </Link>
            </div>

            <div className="section-fade delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, borderRadius: 20, overflow: 'hidden', maxWidth: 520, margin: '0 auto', background: 'rgba(139,124,248,.1)', border: '1px solid rgba(139,124,248,.15)' }}>
              {[
                { val: '10 SMINE', label: 'per stream hour' },
                { val: '15 SMINE', label: 'viewer daily cap' },
                { val: '400M',     label: 'mining pool' },
              ].map(({ val, label }) => (
                <div key={label} style={{ padding: '22px 16px', textAlign: 'center', background: 'rgba(8,11,16,.8)' }}>
                  <div className="num-glow" style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ticker */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)', padding: '14px 0', background: 'rgba(139,124,248,.04)' }}>
          <div className="ticker-wrap">
            <div className="ticker-inner" style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, fontWeight: 500, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              {Array(2).fill([
                '⬡ StreamMine (SMINE)', '·', 'Polygon PoS', '·', 'ERC-20', '·',
                '3-of-5 Oracle Network', '·', 'Trading Locked', '·',
                '60s Poll Interval', '·', 'Bot Detection', '·',
                '400M Mining Pool', '·', 'Epoch Decay 25%/yr', '·',
                'CertiK Audit Pending', '·',
              ]).flat().map((t, i) => <span key={i} style={{ flexShrink: 0 }}>{t}</span>)}
            </div>
          </div>
        </div>

        {/* How it works */}
        <section style={{ padding: '100px 24px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8b7cf8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 16 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Two ways to earn SMINE</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>

            <div className="feature-card border-gradient" style={{ borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(139,124,248,.08)', filter: 'blur(40px)' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,rgba(139,124,248,.3),rgba(139,124,248,.1))', border: '1px solid rgba(139,124,248,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>▶</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Stream to earn</h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.45)', marginBottom: 28 }}>
                Go live on YouTube. Your viewer count is verified every 60 seconds by our oracle network. SMINE lands in your wallet automatically when the stream ends.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['viewers × 0.00002 SMINE/min', 'Base rate'],
                  ['×1.50 partner tier boost',     'Channel bonus'],
                  ['10 SMINE cap per hour',         'Hard limit'],
                ].map(([val, label]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(139,124,248,.08)', border: '1px solid rgba(139,124,248,.12)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#a78bfa', fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card border-gradient" style={{ borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(34,211,165,.06)', filter: 'blur(40px)' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,rgba(34,211,165,.3),rgba(34,211,165,.1))', border: '1px solid rgba(34,211,165,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>👁</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Watch to earn</h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.45)', marginBottom: 28 }}>
                Watch verified streams and earn 0.19 SMINE per minute. Build a daily streak for up to ×1.33 bonus — capped at 15 SMINE per day.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['0.19 SMINE/min',       'Base rate (flat)'],
                  ['×1.33 at 30-day streak','Streak bonus'],
                  ['15 SMINE cap per day', 'Daily limit'],
                ].map(([val, label]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(34,211,165,.06)', border: '1px solid rgba(34,211,165,.12)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399', fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="feature-card border-gradient" style={{ borderRadius: 20, padding: 32, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(245,166,35,.05)', filter: 'blur(40px)' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,rgba(245,166,35,.3),rgba(245,166,35,.1))', border: '1px solid rgba(245,166,35,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>🔒</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12, letterSpacing: '-0.02em' }}>Built conservatively</h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,.45)', marginBottom: 28 }}>
                Rewards decay 25% per year. Trading locked until DAO vote. LP burned at launch. Every reward verified by 3-of-5 oracle signatures before minting.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['×0.75 per year',    'Epoch decay'],
                  ['3-of-5 oracle sigs','Every mint'],
                  ['DAO vote required', 'Trading unlock'],
                ].map(([val, label]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.12)' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fbbf24', fontFamily: 'monospace' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Tokenomics */}
        <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8b7cf8', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 12 }}>Tokenomics</div>
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>1,000,000,000 SMINE total supply</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 16 }}>
              {[
                { pct: '40%', label: 'Mining rewards', color: '#8b7cf8', amount: '400M' },
                { pct: '20%', label: 'Liquidity',      color: '#22d3a5', amount: '200M' },
                { pct: '10%', label: 'Team (vested)',  color: '#f5a623', amount: '100M' },
                { pct: '8%',  label: 'DAO treasury',   color: '#60a5fa', amount: '80M'  },
                { pct: '8%',  label: 'Ecosystem',      color: '#34d399', amount: '80M'  },
                { pct: '7%',  label: 'Airdrop',        color: '#fb923c', amount: '70M'  },
                { pct: '7%',  label: 'Fundraise',      color: '#a78bfa', amount: '70M'  },
              ].map(({ pct, label, color, amount }) => (
                <div key={label} className="stat-card" style={{ borderRadius: 14, padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-0.03em', marginBottom: 4 }}>{pct}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace' }}>{amount} SMINE</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div className="hero-glow" style={{ width: 500, height: 300, background: 'rgba(139,124,248,.12)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <div style={{ position: 'relative', zIndex: 10 }}>
            <h2 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
              Ready to start<br /><span className="shimmer-text">mining SMINE?</span>
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.4)', marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
              Connect your YouTube channel and your Polygon wallet. Rewards flow automatically every stream.
            </p>
            <Link href="/auth/connect" className="glow-btn" style={{ color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 16, display: 'inline-block', letterSpacing: '-0.01em' }}>
              Connect & Start Mining →
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,.05)', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg,#8b7cf8,#22d3a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>▶</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.6)' }}>StreamMine</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.2)' }}>
            © 2026 StreamMine · Built on Polygon · Smart contracts pending CertiK audit · Trading locked
          </div>
        </footer>

      </div>
    </>
  )
}