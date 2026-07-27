import Link from 'next/link'

const stats = [
  { value: '10 SMINE', label: 'max per stream hour' },
  { value: '15 SMINE', label: 'max viewer daily'    },
  { value: '400M',     label: 'token mining pool'   },
]

const features = [
  {
    icon: '▶',
    title: 'Stream to earn',
    desc: 'Go live on YouTube. Your viewer count is verified every 60 seconds by our oracle network. SMINE lands in your wallet automatically.',
  },
  {
    icon: '👁',
    title: 'Watch to earn',
    desc: 'Viewers earn 0.19 SMINE per minute of verified watch time. Build a streak for up to ×1.33 bonus — maxing at 15 SMINE per day.',
  },
  {
    icon: '🔒',
    title: 'Conservative by design',
    desc: 'No inflation surprises. Rewards decay 25% per year. Trading locked until DAO vote. LP burned at launch. Fully on-chain.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: 'var(--c-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b7cf8, #22d3a5)' }}>▶</div>
          <span className="font-semibold text-white tracking-tight">StreamMine</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-lg font-medium"
            style={{ color: 'var(--c-muted)' }}>
            Dashboard
          </Link>
          <Link href="/auth/connect"
            className="text-sm px-4 py-2 rounded-lg font-medium text-white"
            style={{ background: 'var(--c-purple)', boxShadow: '0 0 20px #8b7cf840' }}>
            Connect
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #8b7cf812 0%, transparent 70%)' }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--c-purple-lo)', border: '1px solid var(--c-purple-md)', color: 'var(--c-purple)' }}>
            <span className="relative inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-green)' }} />
            Polygon (PoS) · ERC-20 · Ticker: SMINE · Trading locked until DAO vote
          </div>

          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-none mb-6">
            <span className="gradient-text">Mine SMINE</span>
            <br />
            <span className="text-white">while you stream</span>
          </h1>

          <p className="text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--c-muted)' }}>
            StreamMine rewards YouTube creators and their audiences with SMINE tokens —
            verified every 60 seconds by a 3-of-5 oracle network, minted on-chain automatically.
          </p>

          <div className="flex gap-3 justify-center flex-wrap mb-16">
            <Link href="/auth/connect"
              className="px-8 py-3.5 rounded-xl font-semibold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #8b7cf8, #6d5ce8)', boxShadow: '0 0 32px #8b7cf840' }}>
              Start Mining →
            </Link>
            <Link href="/dashboard"
              className="px-8 py-3.5 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border-hi)', color: 'var(--c-text)' }}>
              View Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden max-w-lg mx-auto"
            style={{ background: 'var(--c-border)', border: '1px solid var(--c-border)' }}>
            {stats.map(({ value, label }) => (
              <div key={label} className="py-5 px-4" style={{ background: 'var(--c-surface)' }}>
                <div className="text-2xl font-bold text-white ticker">{value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--c-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid md:grid-cols-3 gap-4">
          {features.map(({ icon, title, desc }) => (
            <div key={title} className="card p-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: 'var(--c-raised)' }}>
                {icon}
              </div>
              <div className="font-semibold text-white mb-2">{title}</div>
              <div className="text-sm leading-relaxed" style={{ color: 'var(--c-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-8 flex items-center justify-between text-xs"
        style={{ borderColor: 'var(--c-border)', color: 'var(--c-muted)' }}>
        <span>© 2026 StreamMine</span>
        <span>Built on Polygon · Smart contracts pending CertiK audit</span>
      </footer>

    </main>
  )
}