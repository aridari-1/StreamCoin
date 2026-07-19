'use client'
import { useAccount } from 'wagmi'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer, useStreamerStats } from '@/hooks/useStreamer'
import { useSTMCBalance, useSTMCToken, formatSTMCBalance } from '@/hooks/useSTMC'
import { WalletButton } from '@/components/WalletButton'
import { Spinner, EmptyState, SectionHeader } from '@/components/ui'
import { formatSTMC, epochMultiplier } from '@/lib/rewards'
import { POLYGON_CHAIN_ID } from '@/lib/wagmi'

// ── Polygon explorer link ─────────────────────────────────────
function ExplorerLink({ address }: { address: string }) {
  return (
    <a
      href={`https://polygonscan.com/address/${address}`}
      target="_blank" rel="noreferrer"
      className="text-xs text-[#7F77DD] hover:underline font-mono"
    >
      {address.slice(0,8)}…{address.slice(-6)} ↗
    </a>
  )
}

// ── On-chain balance card ─────────────────────────────────────
function OnChainCard({ walletAddress }: { walletAddress: `0x${string}` }) {
  const { balance, pendingAmount, pendingReleaseTime, pendingReady, isLoading, refetch } =
    useSTMCBalance(walletAddress)
  const { tradingEnabled, mintedPercent } = useSTMCToken()

  const releaseDate = pendingReleaseTime
    ? new Date(pendingReleaseTime).toLocaleString()
    : null

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">On-chain STMC Balance</span>
        <button onClick={() => refetch()} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">↻ Refresh</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <div className="p-5 space-y-5">
          {/* Main balance */}
          <div className="text-center py-4">
            <div className="text-5xl font-bold text-white tabular-nums">
              {formatSTMCBalance(balance)}
            </div>
            <div className="text-gray-400 mt-1">STMC</div>
            <div className="mt-2">
              <ExplorerLink address={walletAddress} />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0f1117] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Trading status</div>
              <div className={`text-sm font-medium flex items-center gap-1.5 ${tradingEnabled ? 'text-green-400' : 'text-yellow-400'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${tradingEnabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
                {tradingEnabled ? 'Tradeable' : 'Locked (pre-launch)'}
              </div>
            </div>
            <div className="bg-[#0f1117] rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Pool minted</div>
              <div className="text-sm font-medium text-white">{mintedPercent.toFixed(2)}%</div>
            </div>
          </div>

          {/* Pending withdrawal */}
          {pendingAmount > 0 && (
            <div className={`border rounded-lg p-4 ${
              pendingReady
                ? 'bg-green-900/20 border-green-700/40'
                : 'bg-yellow-900/20 border-yellow-700/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${pendingReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {pendingReady ? '✓ Withdrawal ready' : '⏳ Pending withdrawal'}
                </span>
                <span className={`text-lg font-bold ${pendingReady ? 'text-green-300' : 'text-yellow-300'}`}>
                  {formatSTMCBalance(pendingAmount)} STMC
                </span>
              </div>
              {releaseDate && !pendingReady && (
                <div className="text-xs text-yellow-500/80">
                  Unlocks: {releaseDate}
                  <div className="mt-1 text-yellow-600">24h delay protects against unauthorized transfers</div>
                </div>
              )}
              {pendingReady && (
                <div className="text-xs text-green-500/80">
                  Ready to execute — call executeWithdrawal() on the contract
                </div>
              )}
            </div>
          )}

          {/* Contract link */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#30363d]">
            <span className="text-gray-600">STMC Contract (Polygon)</span>
            <a
              href={`https://polygonscan.com/address/${process.env.NEXT_PUBLIC_STMC_CONTRACT}`}
              target="_blank" rel="noreferrer"
              className="text-[#7F77DD] hover:underline"
            >
              View on PolygonScan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Not connected state ───────────────────────────────────────
function ConnectPrompt() {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
      <div className="text-3xl mb-3">⬡</div>
      <div className="text-white font-medium mb-2">Connect your wallet to see on-chain balance</div>
      <div className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">
        Your STMC rewards are minted directly to your Polygon wallet.
        Connect to see your real-time on-chain balance.
      </div>
      <WalletButton />
      <div className="mt-4 text-xs text-gray-600">
        Supports MetaMask · Coinbase Wallet · any injected wallet
      </div>
    </div>
  )
}

// ── Wrong network banner ──────────────────────────────────────
function WrongNetworkBanner() {
  const { chain } = useAccount()
  if (chain?.id === POLYGON_CHAIN_ID) return null
  return (
    <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-5 py-3 flex items-center gap-3">
      <span className="text-red-400">⚠</span>
      <div>
        <span className="text-red-300 font-medium text-sm">Wrong network — </span>
        <span className="text-red-400/80 text-sm">
          You are on {chain?.name ?? 'unknown'}. Switch to Polygon to see your STMC balance.
        </span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function EarningsPage() {
  const { wallet }            = useWallet()
  const { streamer, loading } = useStreamer(wallet ?? undefined)
  const { stats }             = useStreamerStats(streamer?.id)
  const { address, isConnected, chain } = useAccount()
  const epoch = epochMultiplier()

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  const isOnPolygon = chain?.id === POLYGON_CHAIN_ID

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Earnings" sub="STMC mining rewards — off-chain tracked + on-chain balance" />
        <WalletButton />
      </div>

      {isConnected && !isOnPolygon && <WrongNetworkBanner />}

      {/* Platform earnings summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total earned',  value: formatSTMC(stats?.total_earned       ?? 0, 4), color: 'text-[#7F77DD]', sub: 'all time (DB)' },
          { label: 'This month',    value: formatSTMC(stats?.earned_this_month  ?? 0, 4), color: 'text-white',     sub: '30 days' },
          { label: 'This week',     value: formatSTMC(stats?.earned_this_week   ?? 0, 4), color: 'text-white',     sub: '7 days' },
          { label: 'Today',         value: formatSTMC(stats?.earned_today       ?? 0, 4), color: 'text-green-400', sub: '24h' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-600 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* On-chain balance */}
      {isConnected && address && isOnPolygon
        ? <OnChainCard walletAddress={address} />
        : <ConnectPrompt />
      }

      {/* Epoch info */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
          Mining rate info
        </div>
        <div className="space-y-2.5 text-sm">
          {[
            ['Current epoch multiplier', `×${epoch.toFixed(6)}`],
            ['Streamer cap',             '10 STMC / streaming hour'],
            ['Viewer cap',               '15 STMC / day'],
            ['Reward pool remaining',    '400,000,000 STMC (decreases over time)'],
            ['Emission decay',           '25% per year (epoch-based)'],
            ['Network',                  'Polygon (PoS) — ~$0.001 per mint tx'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center border-b border-[#30363d]/50 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-300 font-mono text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading status */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <div className="text-sm font-medium text-gray-300 mb-3">Trading & Liquidity</div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-yellow-400 font-medium">Trading locked</span>
            <span className="text-gray-500 text-xs">— DAO vote required to unlock</span>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            STMC is being minted to wallets via the MiningEngine contract, but wallet-to-wallet
            transfers and DEX trading are disabled until the DAO enables trading.
            Your balance accumulates on-chain even while locked.
          </p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-gray-500 text-xs">QuickSwap pool (when trading opens)</span>
            <a href="https://quickswap.exchange" target="_blank" rel="noreferrer"
              className="text-xs text-[#7F77DD] hover:underline">quickswap.exchange ↗</a>
          </div>
        </div>
      </div>
    </div>
  )
}
