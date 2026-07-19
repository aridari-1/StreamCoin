import { createConfig, http } from 'wagmi'
import { polygon } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [polygon],
  connectors: [
    injected(),   // MetaMask, Coinbase Wallet, any injected wallet
  ],
  transports: {
    [polygon.id]: http(
      process.env.NEXT_PUBLIC_POLYGON_RPC ?? 'https://polygon-rpc.com'
    ),
  },
})

// STMC ERC-20 ABI — only what the Earnings page needs
export const STMC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tradingEnabled',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'remainingSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'viewerDailyRemaining',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'viewer', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'pendingWithdrawals',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [
      { name: 'amount',      type: 'uint256' },
      { name: 'releaseTime', type: 'uint256' },
      { name: 'to',          type: 'address' },
    ],
  },
  {
    name: 'Transfer',
    type: 'event',
    inputs: [
      { name: 'from',  type: 'address', indexed: true },
      { name: 'to',    type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },
] as const

export const STMC_ADDRESS = (
  process.env.NEXT_PUBLIC_STMC_CONTRACT ?? '0x0000000000000000000000000000000000000000'
) as `0x${string}`

export const POLYGON_CHAIN_ID = 137
