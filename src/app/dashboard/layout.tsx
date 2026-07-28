'use client'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
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
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#080b10', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>

      <nav style={{ height:58, display:'flex', alignItems:'center', padding:'0 24px', gap:8, flexShrink:0, position:'sticky', top:0, zIndex:100, background:'rgba(8,11,16,.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>

        <Link href="/" style={{ textDecoration:'none', flexShrink:0, marginRight:8 }}>
          <Logo size="sm" />
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:2, flex:1 }}>
          {nav.map(({ href, label }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} style={{
                padding:'6px 14px', borderRadius:9, fontSize:13, fontWeight: active ? 600 : 400,
                textDecoration:'none', transition:'all .2s',
                background: active ? 'rgba(139,124,248,.15)' : 'transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,.4)',
                border: active ? '1px solid rgba(139,124,248,.25)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            )
          })}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {wallet && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:8, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', fontSize:11, fontFamily:'monospace', color:'rgba(255,255,255,.35)' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#22d3a5', boxShadow:'0 0 6px #22d3a5' }} />
              {wallet.slice(0,6)}…{wallet.slice(-4)}
            </div>
          )}
          <WalletButton />
        </div>
      </nav>

      <div style={{ flex:1, padding:'28px 24px', maxWidth:1280, margin:'0 auto', width:'100%', boxSizing:'border-box' }}>
        {children}
      </div>
    </div>
  )
}