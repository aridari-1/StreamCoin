'use client'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer } from '@/hooks/useStreamer'
import { Spinner, EmptyState, SectionHeader, TierBadge, YouTubeLogo } from '@/components/ui'
import { partnerMultiplier, epochMultiplier, formatViewers } from '@/lib/rewards'

export default function SettingsPage() {
  const { wallet, clearWallet } = useWallet()
  const { streamer, loading }   = useStreamer(wallet ?? undefined)
  const epoch                   = epochMultiplier()

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  const tier = streamer.tier ?? 'standard'

  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader title="Settings" sub="Manage your StreamMine account" />

      {/* YouTube connection */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-sm font-semibold text-white mb-4">YouTube Connection</div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'var(--c-raised)' }}>
            {streamer.youtube_avatar
              ? <img src={streamer.youtube_avatar} alt="avatar" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                  {(streamer.youtube_username ?? 'S')[0]}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <YouTubeLogo size={14} />
              <span className="font-medium text-white truncate">{streamer.youtube_username}</span>
              <TierBadge tier={tier} />
            </div>
            {streamer.youtube_handle && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>{streamer.youtube_handle}</div>
            )}
          </div>
          <a href="/auth/connect"
            className="px-3 py-1.5 text-xs rounded-lg transition-colors flex-shrink-0"
            style={{ border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>
            Reconnect
          </a>
        </div>
      </div>

      {/* Wallet */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-sm font-semibold text-white mb-4">Reward Wallet</div>
        <div className="rounded-xl px-4 py-3 font-mono text-sm text-white break-all"
          style={{ background: 'var(--c-bg)', border: '1px solid var(--c-border)' }}>
          {streamer.wallet_address}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--c-muted)' }}>
          SMINE rewards are minted to this address. To change it, disconnect and reconnect with a different wallet.
        </p>
      </div>

      {/* Mining config */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-sm font-semibold text-white mb-4">Mining Configuration</div>
        <div className="space-y-0">
          {[
            ['Tier',               `${tier.charAt(0).toUpperCase()+tier.slice(1)} (${formatViewers(streamer.avg_viewers)} avg viewers)`],
            ['Partner multiplier', `×${partnerMultiplier(streamer.avg_viewers).toFixed(2)}`],
            ['Epoch multiplier',   `×${epoch.toFixed(6)}`],
            ['Streamer cap',       '10 SMINE per streaming hour'],
            ['Poll interval',      'Every 60 seconds'],
            ['Platform',           'YouTube Live'],
            ['Token',              'SMINE (StreamMine)'],
            ['Network',            'Polygon (PoS)'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2.5"
              style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{k}</span>
              <span className="text-sm font-mono text-white text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid #ff4d6d30' }}>
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--c-red)' }}>Disconnect Account</div>
        <p className="text-xs mb-4" style={{ color: 'var(--c-muted)' }}>
          This removes your YouTube connection from the browser. Your earned SMINE and session history remain in the database. You can reconnect at any time.
        </p>
        <button
          onClick={() => { clearWallet(); window.location.href = '/' }}
          className="px-4 py-2 text-sm rounded-xl transition-colors"
          style={{ background: '#ff4d6d14', border: '1px solid #ff4d6d30', color: 'var(--c-red)' }}>
          Disconnect
        </button>
      </div>
    </div>
  )
}