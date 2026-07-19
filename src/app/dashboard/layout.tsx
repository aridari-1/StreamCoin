'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { WalletButton } from '@/components/WalletButton'
import { clsx } from 'clsx'

const nav = [
  { href: '/dashboard',          label: 'Overview'  },
  { href: '/dashboard/sessions', label: 'Sessions'  },
  { href: '/dashboard/earnings', label: 'Earnings'  },
  { href: '/dashboard/settings', label: 'Settings'  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { wallet } = useWallet()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center px-6 gap-4 flex-shrink-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-white flex-shrink-0">
          <span className="w-7 h-7 rounded-full bg-[#7F77DD] flex items-center justify-center text-sm">▶</span>
          <span className="hidden sm:inline text-sm">StreamCoin</span>
        </Link>

        {/* Page nav */}
        <div className="flex items-center gap-1 flex-1">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap',
                pathname === href
                  ? 'bg-[#7F77DD]/20 text-[#7F77DD] font-medium'
                  : 'text-gray-400 hover:text-white'
              )}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right side — YouTube wallet indicator + MetaMask */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {wallet && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#0f1117] border border-[#30363d] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs text-gray-400 font-mono">
                {wallet.slice(0, 6)}…{wallet.slice(-4)}
              </span>
              <span className="text-xs text-gray-600">YouTube</span>
            </div>
          )}
          <WalletButton />
        </div>
      </nav>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {children}
      </div>
    </div>
  )
}
