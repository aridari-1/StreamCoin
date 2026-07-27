'use client'
import { useAccount } from 'wagmi'
import { useWallet }  from '@/hooks/useWallet'
import { useStreamer, useStreamerStats } from '@/hooks/useStreamer'
import { useSTMCBalance, useSTMCToken, formatSTMCBalance } from '@/hooks/useSTMC'
import { WalletButton } from '@/components/WalletButton'
import { StatCard, Spinner, EmptyState, SectionHeader } from '@/components/ui'
import { formatSTMC, epochMultiplier } from '@/lib/rewards'
import { POLYGON_CHAIN_ID } from '@/lib/wagmi'

function ExplorerLink({ address }: { address: string }) {
  return (
    <a href={`https://polygonscan.com/address/${address}`}
      target="_blank" rel="noreferrer"
      className="text-xs font-mono hover:underline"
      style={{ color: 'var(--c-purple)' }}>
      {address.slice(0,8)}…{address.slice(-6)} ↗
    </a>
  )
}

function OnChainCard({ walletAddress }: { walletAddress: `0x${string}` }) {
  const { balance, pendingAmount, pendingReleaseTime, pendingReady, isLoading, refetch } =
    useSTMCBalance(walletAddress)
  const { tradingEnabled, mintedPercent } = useSTMCToken()
  const releaseDate = pendingReleaseTime ? new Date(pendingReleaseTime).toLocaleString() : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-border)' }}>
        <span className="text-sm font-semibold text-white">On-chain SMINE Balance</span>
        <button onClick={() => refetch()} className="text-xs transition-colors" style={{ color: 'var(--c-muted)' }}>
          ↻ Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <div className="p-5 space-y-5">
          <div className="text-center py-4">
            <div className="text-5xl font-bold ticker text-white">{formatSTMCBalance(balance)}</div>
            <div className="mt-1" style={{ color: 'var(--c-muted)' }}>SMINE</div>
            <div className="mt-2"><ExplorerLink address={walletAddress} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl p-3" style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Trading status</div>
              <div className="text-sm font-medium flex items-center gap-1.5"
                style={{ color: tradingEnabled ? 'var(--c-green)' : 'var(--c-amber)' }}>
                <div className="w-1.5 h-1.5 rounded-full"
                  style={{ background: tradingEnabled ? 'var(--c-green)' : 'var(--c-amber)' }} />
                {tradingEnabled ? 'Tradeable' : 'Locked (pre-launch)'}
              </div>
            </div>
            <div className="rounded-xl p-3" style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--c-muted)' }}>Pool minted</div>
              <div className="text-sm font-medium text-white">{mintedPercent.toFixed(2)}%</div>
            </div>
          </div>

          {pendingAmount > 0 && (
            <div className="rounded-xl p-4" style={{
              background: pendingReady ? '#22d3a512' : '#f5a62312',
              border:     `1px solid ${pendingReady ? '#22d3a530' : '#f5a62330'}`,
            }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium"
                  style={{ color: pendingReady ? 'var(--c-green)' : 'var(--c-amber)' }}>
                  {pendingReady ? '✓ Withdrawal ready' : '⏳ Pending withdrawal'}
                </span>
                <span className="text-lg font-bold"
                  style={{ color: pendingReady ? 'var(--c-green)' : 'var(--c-amber)' }}>
                  {formatSTMCBalance(pendingAmount)} SMINE
                </span>
              </div>
              {releaseDate && !pendingReady && (
                <div className="text-xs" style={{ color: 'var(--c-amber)' }}>Unlocks: {releaseDate}</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid var(--c-border)' }}>
            <span style={{ color: 'var(--c-muted)' }}>SMINE Contract (Polygon)</span>
            <a href={`https://polygonscan.com/address/${process.env.NEXT_PUBLIC_STMC_CONTRACT}`}
              target="_blank" rel="noreferrer"
              className="hover:underline" style={{ color: 'var(--c-purple)' }}>
              View on PolygonScan ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function ConnectPrompt() {
  return (
    <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
      <div className="text-3xl mb-3">⬡</div>
      <div className="font-medium text-white mb-2">Connect your wallet to see on-chain balance</div>
      <div className="text-sm mb-5 max-w-xs mx-auto" style={{ color: 'var(--c-muted)' }}>
        Your SMINE rewards are minted directly to your Polygon wallet.
      </div>
      <WalletButton />
      <div className="text-xs mt-4" style={{ color: 'var(--c-muted)' }}>
        Supports MetaMask · Coinbase Wallet · any injected wallet
      </div>
    </div>
  )
}

export default function EarningsPage() {
  const { wallet }            = useWallet()
  const { streamer, loading } = useStreamer(wallet ?? undefined)
  const { stats }             = useStreamerStats(streamer?.id)
  const { address, isConnected, chain } = useAccount()
  const epoch        = epochMultiplier()
  const isOnPolygon  = chain?.id === POLYGON_CHAIN_ID

  if (loading) return <div className="flex justify-center py-16"><Spinner /></div>
  if (!streamer) return (
    <EmptyState icon="▶" title="No account connected"
      action={{ label: 'Connect YouTube', href: '/auth/connect' }} />
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionHeader title="Earnings" sub="SMINE mining rewards — off-chain tracked + on-chain balance" />
        <WalletButton />
      </div>

      {isConnected && !isOnPolygon && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm"
          style={{ background: '#ff4d6d10', border: '1px solid #ff4d6d30' }}>
          <span style={{ color: 'var(--c-red)' }}>⚠</span>
          <span className="font-medium" style={{ color: 'var(--c-red)' }}>Wrong network —</span>
          <span style={{ color: '#ff4d6d80' }}>Switch to Polygon to see your SMINE balance</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total earned"  value={formatSTMC(stats?.total_earned ?? 0, 4)}        sub="all time" accent />
        <StatCard label="This month"    value={formatSTMC(stats?.earned_this_month ?? 0, 4)}   sub="30 days" />
        <StatCard label="This week"     value={formatSTMC(stats?.earned_this_week ?? 0, 4)}    sub="7 days" />
        <StatCard label="Today"         value={formatSTMC(stats?.earned_today ?? 0, 4)}         sub="24h" />
      </div>

      {isConnected && address && isOnPolygon
        ? <OnChainCard walletAddress={address} />
        : <ConnectPrompt />
      }

      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--c-muted)' }}>
          Mining rate info
        </div>
        <div className="space-y-0">
          {[
            ['Current epoch multiplier', `×${epoch.toFixed(6)}`],
            ['Streamer cap',             '10 SMINE / streaming hour'],
            ['Viewer cap',               '15 SMINE / day'],
            ['Reward pool remaining',    '400,000,000 SMINE'],
            ['Emission decay',           '25% per year (epoch-based)'],
            ['Network',                  'Polygon (PoS) — ~$0.001 per mint tx'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-2.5"
              style={{ borderBottom: '1px solid var(--c-border)' }}>
              <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{k}</span>
              <span className="text-sm font-mono text-white">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)' }}>
        <div className="text-sm font-semibold text-white mb-3">Trading & Liquidity</div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-amber)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--c-amber)' }}>Trading locked</span>
          <span className="text-xs" style={{ color: 'var(--c-muted)' }}>— DAO vote required to unlock</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>
          SMINE is being minted to wallets via the MiningEngine contract, but wallet-to-wallet
          transfers and DEX trading are disabled until the DAO enables trading.
          Your balance accumulates on-chain even while locked.
        </p>
      </div>
    </div>
  )
}