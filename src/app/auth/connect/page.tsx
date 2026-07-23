'use client'
import { useState, useEffect } from 'react'
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

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--c-bg)' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, #8b7cf808 0%, transparent 100%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b7cf8, #22d3a5)', boxShadow: '0 0 32px #8b7cf840' }}>▶</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connect to StreamCoin</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--c-muted)' }}>Two steps to start mining STMC</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {(['wallet','platform'] as Step[]).map((s,i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: step===s ? 'var(--c-purple)' : (step==='platform'&&s==='wallet') ? 'var(--c-green)' : 'var(--c-raised)',
                  color: (step===s||(step==='platform'&&s==='wallet')) ? 'white' : 'var(--c-muted)',
                  border: `1px solid ${step===s ? 'var(--c-purple)' : 'var(--c-border)'}`,
                }}>
                {step==='platform'&&s==='wallet' ? '✓' : i+1}
              </div>
              {i===0 && <div className="w-12 h-px" style={{ background: step==='platform' ? 'var(--c-purple)' : 'var(--c-border)' }} />}
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
          {step === 'wallet' && (
            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Polygon wallet address</label>
                <input type="text" value={wallet}
                  onChange={e => { setWallet(e.target.value); setWalletError('') }}
                  placeholder="0x..."
                  className="w-full rounded-xl px-4 py-3 text-sm font-mono text-white outline-none transition-all"
                  style={{ background: 'var(--c-bg)', border: `1px solid ${walletError ? 'var(--c-red)' : 'var(--c-border)'}`, color: 'var(--c-text)' }}
                />
                {walletError && <p className="text-xs mt-2" style={{ color: 'var(--c-red)' }}>{walletError}</p>}
              </div>
              <div className="rounded-xl px-4 py-3 text-xs leading-relaxed" style={{ background: 'var(--c-raised)', color: 'var(--c-muted)' }}>
                STMC rewards are minted to this address. We never ask for your private key.
              </div>
              <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #8b7cf8, #6d5ce8)' }}>
                Continue →
              </button>
            </form>
          )}

          {step === 'platform' && (
            <div className="space-y-4">
              <div className="rounded-xl px-4 py-3" style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--c-muted)' }}>Wallet</p>
                <p className="text-xs font-mono text-white truncate">{wallet}</p>
              </div>

              <button onClick={connectYouTube} disabled={loading}
                className="w-full flex items-center gap-4 p-4 rounded-xl transition-all disabled:opacity-50"
                style={{ background: '#ff4d6d0a', border: '1px solid #ff4d6d25' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#ff4d6d' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                  </svg>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white text-sm">Connect YouTube</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>Read-only · we never post or modify your channel</div>
                </div>
                {loading
                  ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid #ff4d6d40', borderTopColor: '#ff4d6d' }} />
                  : <span style={{ color: 'var(--c-muted)' }}>→</span>}
              </button>

              <div className="space-y-1.5">
                {[['✓','Channel name and avatar',true],['✓','Live stream viewer count (verified)',true],['✓','Average viewers for tier calculation',true],['✗','Cannot post or change anything',false]].map(([icon,label,ok]) => (
                  <div key={label as string} className="flex items-center gap-2 text-xs">
                    <span style={{ color: ok ? 'var(--c-green)' : 'var(--c-muted)' }}>{icon as string}</span>
                    <span style={{ color: 'var(--c-muted)' }}>{label as string}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => setStep('wallet')} className="w-full py-2 text-xs" style={{ color: 'var(--c-muted)' }}>
                ← Change wallet address
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--c-faint)' }}>
          Read-only YouTube permissions · Polygon (PoS) · No private key required
        </p>
      </div>
    </main>
  )
}