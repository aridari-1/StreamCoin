'use client'
import { useWallet }      from '@/hooks/useWallet'
import { useStreamer }     from '@/hooks/useStreamer'
import { Spinner, EmptyState, SectionHeader, TierBadge, YouTubeLogo } from '@/components/ui'
import { partnerMultiplier, epochMultiplier, formatViewers } from '@/lib/rewards'

export default function SettingsPage() {
  const { wallet, clearWallet } = useWallet()
  const { streamer, loading }   = useStreamer(wallet ?? undefined)
  const epoch                   = epochMultiplier()

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return <EmptyState icon="▶" title="No account connected" action={{label:'Connect YouTube',href:'/auth/connect'}} />

  const tier = streamer.tier ?? 'standard'

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader title="Settings" sub="Manage your StreamCoin account" />

      {/* YouTube connection */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-sm font-medium text-gray-300 mb-4">YouTube Connection</div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#30363d] flex-shrink-0">
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
              <div className="text-xs text-gray-500 mt-0.5">{streamer.youtube_handle}</div>
            )}
          </div>
          <a href="/auth/connect"
            className="px-3 py-1.5 text-xs border border-[#30363d] rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors flex-shrink-0">
            Reconnect
          </a>
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-sm font-medium text-gray-300 mb-4">Reward Wallet</div>
        <div className="bg-[#0f1117] border border-[#30363d] rounded-lg p-3 font-mono text-sm text-gray-300 break-all">
          {streamer.wallet_address}
        </div>
        <p className="text-xs text-gray-600 mt-2">STMC rewards are minted to this address. To change it, disconnect and reconnect with a different wallet.</p>
      </div>

      {/* Mining info */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-sm font-medium text-gray-300 mb-4">Mining Configuration</div>
        <div className="space-y-3">
          {[
            ['Tier',              `${tier.charAt(0).toUpperCase()+tier.slice(1)} (${formatViewers(streamer.avg_viewers)} avg viewers)`],
            ['Partner multiplier',`×${partnerMultiplier(streamer.avg_viewers).toFixed(2)}`],
            ['Epoch multiplier',  `×${epoch.toFixed(6)}`],
            ['Streamer cap',      '10 STMC per streaming hour'],
            ['Poll interval',     'Every 60 seconds'],
            ['Platform',         'YouTube Live'],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between text-sm border-b border-[#30363d]/50 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-300 font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-[#161b22] border border-red-900/30 rounded-xl p-5">
        <div className="text-sm font-medium text-red-400 mb-4">Disconnect Account</div>
        <p className="text-xs text-gray-500 mb-4">
          This removes your YouTube connection from the browser. Your earned STMC and session history remain in the database. You can reconnect at any time.
        </p>
        <button
          onClick={() => { clearWallet(); window.location.href = '/' }}
          className="px-4 py-2 bg-red-900/30 border border-red-800/40 text-red-400 text-sm rounded-lg hover:bg-red-900/50 transition-colors"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}
