'use client'
import { useReadContract, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { STMC_ABI, STMC_ADDRESS } from '@/lib/wagmi'

// ── Token-level data (supply, trading status) ────────────────
export function useSTMCToken() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: STMC_ADDRESS, abi: STMC_ABI, functionName: 'totalSupply' },
      { address: STMC_ADDRESS, abi: STMC_ABI, functionName: 'remainingSupply' },
      { address: STMC_ADDRESS, abi: STMC_ABI, functionName: 'tradingEnabled' },
    ],
  })

  const totalSupply     = data?.[0]?.result ? Number(formatUnits(data[0].result as bigint, 18)) : 0
  const remainingSupply = data?.[1]?.result ? Number(formatUnits(data[1].result as bigint, 18)) : 400_000_000
  const tradingEnabled  = data?.[2]?.result as boolean ?? false
  const mintedPercent   = totalSupply > 0 ? ((1_000_000_000 - remainingSupply) / 1_000_000_000) * 100 : 0

  return { totalSupply, remainingSupply, tradingEnabled, mintedPercent, isLoading }
}

// ── Per-wallet STMC data ─────────────────────────────────────
export function useSTMCBalance(address?: `0x${string}`) {
  const enabled = !!address && address !== '0x0000000000000000000000000000000000000000'

  const { data, isLoading, refetch } = useReadContracts({
    contracts: address ? [
      {
        address:      STMC_ADDRESS,
        abi:          STMC_ABI,
        functionName: 'balanceOf',
        args:         [address],
      },
      {
        address:      STMC_ADDRESS,
        abi:          STMC_ABI,
        functionName: 'pendingWithdrawals',
        args:         [address],
      },
    ] : [],
    query: { enabled, refetchInterval: 30_000 },
  })

  const balance = data?.[0]?.result
    ? Number(formatUnits(data[0].result as bigint, 18))
    : 0

  const pending = data?.[1]?.result as [bigint, bigint, string] | undefined
  const pendingAmount      = pending?.[0] ? Number(formatUnits(pending[0], 18)) : 0
  const pendingReleaseTime = pending?.[1] ? Number(pending[1]) * 1000 : 0
  const pendingReady       = pendingReleaseTime > 0 && Date.now() >= pendingReleaseTime

  return {
    balance,
    pendingAmount,
    pendingReleaseTime,
    pendingReady,
    isLoading,
    refetch,
  }
}

// ── Format helpers ────────────────────────────────────────────
export function formatSTMCBalance(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(3)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(3)}K`
  return n.toFixed(4)
}
