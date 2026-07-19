'use client'
import { useState } from 'react'
import { getYouTubeOAuthUrl } from '@/lib/youtube'

type Step = 'wallet' | 'platform' | 'done'

export default function ConnectPage() {
  const [step, setStep]               = useState<Step>('wallet')
  const [wallet, setWallet]           = useState('')
  const [walletError, setWalletError] = useState('')
  const [loading, setLoading]         = useState(false)

  function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault()
    const addr = wallet.trim()
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setWalletError('Enter a valid Polygon wallet address (0x...)')
      return
    }
    setWalletError('')
    setStep('platform')
  }

  function connectYouTube() {
    setLoading(true)
    const redirectUri = `${window.location.origin}/api/youtube/callback`
    const url         = getYouTubeOAuthUrl(redirectUri, wallet.trim())
    window.location.href = url
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-[#0f1117]">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-[#7F77DD] flex items-center justify-center text-2xl mx-auto mb-4 text-white font-bold">▶</div>
          <h1 className="text-2xl font-bold text-white">Connect to StreamCoin</h1>
          <p className="text-gray-400 text-sm mt-2">Two steps to start mining STMC</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center mb-8">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                (step === 'wallet'   && n === 1) ||
                (step === 'platform' && n === 2) ||
                (step === 'done'     && n === 3)
                  ? 'bg-[#7F77DD] text-white'
                  : (step === 'platform' && n === 1) || (step === 'done' && n <= 2)
                    ? 'bg-green-600 text-white'
                    : 'bg-[#30363d] text-gray-500'
              }`}>{n}</div>
              {i < 2 && <div className="flex-1 h-px bg-[#30363d] mx-2" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">

          {/* Step 1 — Wallet */}
          {step === 'wallet' && (
            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Polygon Wallet Address
                </label>
                <input
                  type="text"
                  value={wallet}
                  onChange={e => setWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0f1117] border border-[#30363d] rounded-lg px-4 py-3 text-gray-100 text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-[#7F77DD] transition-colors"
                />
                {walletError && (
                  <p className="text-red-400 text-xs mt-2">{walletError}</p>
                )}
              </div>
              <div className="bg-[#0f1117] border border-[#30363d] rounded-lg p-3 text-xs text-gray-500 leading-relaxed">
                Your STMC rewards will be sent here. We never ask for your private key or seed phrase.
              </div>
              <button type="submit"
                className="w-full py-3 bg-[#7F77DD] hover:bg-[#6b63c7] text-white font-semibold rounded-lg transition-colors">
                Continue →
              </button>
            </form>
          )}

          {/* Step 2 — YouTube */}
          {step === 'platform' && (
            <div className="space-y-5">
              <div className="bg-[#0f1117] border border-[#30363d] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Wallet</p>
                <p className="text-xs text-gray-300 font-mono truncate">{wallet}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-300 mb-4">Connect your YouTube channel</p>

                <button
                  onClick={connectYouTube}
                  disabled={loading}
                  className="w-full flex items-center gap-4 p-4 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* YouTube logo */}
                  <div className="w-11 h-11 rounded-xl bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
                    </svg>
                  </div>

                  <div className="text-left flex-1">
                    <div className="font-semibold text-white text-sm">Connect YouTube</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Read-only access · we never post or modify your channel
                    </div>
                  </div>

                  {loading
                    ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <span className="text-gray-500 text-sm">→</span>
                  }
                </button>

                {/* What we access */}
                <div className="mt-4 space-y-2">
                  {[
                    ['✓', 'Channel name and avatar', 'text-green-400'],
                    ['✓', 'Live stream viewer count (verified)', 'text-green-400'],
                    ['✓', 'Average viewers (for tier calculation)', 'text-green-400'],
                    ['✗', 'Cannot post, delete, or change anything', 'text-gray-500'],
                    ['✗', 'Cannot access private videos or billing', 'text-gray-500'],
                  ].map(([icon, label, color]) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className={color}>{icon}</span>
                      <span className="text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep('wallet')}
                className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                ← Change wallet address
              </button>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-600/20 border border-green-600/40 flex items-center justify-center text-3xl mx-auto">
                ✓
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Connected!</p>
                <p className="text-gray-400 text-sm mt-1">Start streaming to earn STMC</p>
              </div>
              <a href="/dashboard"
                className="block w-full py-3 bg-[#7F77DD] hover:bg-[#6b63c7] text-white font-semibold rounded-lg transition-colors">
                Go to Dashboard →
              </a>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          StreamCoin requests read-only YouTube permissions only.<br />
          Your password and private data are never shared with us.
        </p>
      </div>
    </main>
  )
}
