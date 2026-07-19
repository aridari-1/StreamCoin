'use client'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { POLYGON_CHAIN_ID } from '@/lib/wagmi'
import { useState } from 'react'

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function WalletButton({ onConnected }: { onConnected?: (addr: string) => void }) {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [open, setOpen] = useState(false)

  const wrongNetwork = isConnected && chain?.id !== POLYGON_CHAIN_ID

  // ── Already connected ────────────────────────────────────
  if (isConnected && address) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
            wrongNetwork
              ? 'bg-red-900/30 border-red-700/40 text-red-400'
              : 'bg-[#7F77DD]/10 border-[#7F77DD]/30 text-[#7F77DD] hover:bg-[#7F77DD]/20'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${wrongNetwork ? 'bg-red-500' : 'bg-green-500'}`} />
          {wrongNetwork ? 'Wrong network' : shortAddr(address)}
          <span className="text-xs opacity-60">▾</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl z-50 overflow-hidden">
            {wrongNetwork && (
              <button
                onClick={() => { switchChain({ chainId: POLYGON_CHAIN_ID }); setOpen(false) }}
                className="w-full px-4 py-3 text-sm text-left text-yellow-400 hover:bg-[#1c2128] transition-colors border-b border-[#30363d]"
              >
                ⚠ Switch to Polygon
              </button>
            )}
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-[#30363d]">
              <div className="font-mono truncate">{address}</div>
              <div className="mt-0.5">{chain?.name}</div>
            </div>
            <button
              onClick={() => { disconnect(); setOpen(false) }}
              className="w-full px-4 py-3 text-sm text-left text-red-400 hover:bg-[#1c2128] transition-colors"
            >
              Disconnect wallet
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Not connected ─────────────────────────────────────────
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-[#7F77DD] hover:bg-[#6b63c7] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending
          ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting…</>
          : <>⬡ Connect Wallet</>
        }
      </button>

      {open && !isPending && (
        <div className="absolute right-0 mt-1 w-52 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-[#30363d]">Choose wallet</div>
          {connectors.map(c => (
            <button
              key={c.id}
              onClick={() => {
                connect(
                  { connector: c, chainId: POLYGON_CHAIN_ID },
                  { onSuccess: (d) => { onConnected?.(d.accounts[0]); setOpen(false) } }
                )
              }}
              className="w-full px-4 py-3 text-sm text-left text-gray-300 hover:bg-[#1c2128] hover:text-white transition-colors flex items-center gap-3"
            >
              <span className="text-lg">
                {c.name.toLowerCase().includes('metamask') ? '🦊'
                  : c.name.toLowerCase().includes('coinbase') ? '🔵'
                  : '⬡'}
              </span>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
