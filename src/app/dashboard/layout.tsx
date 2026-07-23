'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useWallet } from '@/hooks/useWallet'
import { WalletButton } from '@/components/WalletButton'

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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--c-bg)' }}>
      <nav className="h-14 flex items-center px-6 gap-4 flex-shrink-0"
        style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)' }}>
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #8b7cf8, #22d3a5)' }}>▶</div>
          <span className="hidden sm:inline text-sm font-semibold text-white tracking-tight">StreamCoin</span>
        </Link>

        <div className="flex items-center gap-0.5 flex-1">
          {nav.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: active ? 'var(--c-purple-lo)' : 'transparent', color: active ? 'var(--c-purple)' : 'var(--c-muted)' }}>
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {wallet && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono"
              style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border)', color: 'var(--c-muted)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-green)' }} />
              {wallet.slice(0,6)}…{wallet.slice(-4)}
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