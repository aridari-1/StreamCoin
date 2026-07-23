import { clsx } from 'clsx'

export function StatCard({ label, value, sub, accent = false, icon }: {
  label: string; value: string; sub?: string
  accent?: boolean; icon?: React.ReactNode
}) {
  return (
    <div className={clsx('rounded-2xl p-5 transition-colors', accent ? 'glow-purple' : '')}
      style={{
        background: accent ? 'linear-gradient(135deg, #8b7cf808, #0e1318)' : 'var(--c-surface)',
        border: `1px solid ${accent ? '#8b7cf830' : 'var(--c-border)'}`,
      }}>
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>{label}</div>
        {icon && <div style={{ color: 'var(--c-muted)' }}>{icon}</div>}
      </div>
      <div className={clsx('text-2xl font-bold ticker', accent ? 'gradient-text' : 'text-white')}>{value}</div>
      {sub && <div className="text-xs mt-1.5" style={{ color: 'var(--c-muted)' }}>{sub}</div>}
    </div>
  )
}

export function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    partner:   { bg: '#8b7cf812', color: '#a78bfa', border: '#8b7cf830' },
    affiliate: { bg: '#3b82f612', color: '#60a5fa', border: '#3b82f630' },
    standard:  { bg: 'var(--c-raised)', color: 'var(--c-muted)', border: 'var(--c-border)' },
  }
  const s = map[tier] ?? map.standard
  return (
    <span className="pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {tier === 'partner' ? '⬡ ' : tier === 'affiliate' ? '◆ ' : ''}{tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; border: string; label: string }> = {
    live:           { bg: '#ff4d6d12', color: '#ff4d6d', border: '#ff4d6d30', label: '● Live'     },
    rewarded:       { bg: '#22d3a512', color: '#22d3a5', border: '#22d3a530', label: '✓ Rewarded' },
    pending_reward: { bg: '#f5a62312', color: '#f5a623', border: '#f5a62330', label: '⏳ Pending' },
    ended:          { bg: 'var(--c-raised)', color: 'var(--c-muted)', border: 'var(--c-border)', label: 'Ended' },
    bot_suspect:    { bg: '#f9731612', color: '#fdba74', border: '#f9731630', label: '⚠ Flagged'  },
  }
  const s = map[status] ?? map.ended
  return (
    <span className="pill" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  )
}

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={clsx(sz, 'rounded-full animate-spin')}
      style={{ border: '2px solid var(--c-border-hi)', borderTopColor: 'var(--c-purple)' }} />
  )
}

export function EmptyState({ icon, title, desc, action }: {
  icon?: string; title: string; desc?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
          style={{ background: 'var(--c-raised)', border: '1px solid var(--c-border-hi)' }}>
          {icon}
        </div>
      )}
      <div className="font-semibold text-white text-lg mb-2">{title}</div>
      {desc && <div className="text-sm max-w-xs leading-relaxed" style={{ color: 'var(--c-muted)' }}>{desc}</div>}
      {action && (
        <a href={action.href}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'var(--c-purple)' }}>
          {action.label}
        </a>
      )}
    </div>
  )
}

export function SectionHeader({ title, sub, action }: {
  title: string; sub?: string
  action?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-white tracking-tight">{title}</h2>
        {sub && <p className="text-sm mt-0.5" style={{ color: 'var(--c-muted)' }}>{sub}</p>}
      </div>
      {action && (
        action.href
          ? <a href={action.href} className="text-sm font-medium" style={{ color: 'var(--c-purple)' }}>{action.label} →</a>
          : <button onClick={action.onClick} className="text-sm font-medium" style={{ color: 'var(--c-purple)' }}>{action.label}</button>
      )}
    </div>
  )
}

export function YouTubeLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff4d6d">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
    </svg>
  )
}

export function Divider() {
  return <div className="h-px w-full" style={{ background: 'var(--c-border)' }} />
}

export function DataRow({ label, value, mono = false }: {
  label: string; value: string; mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: 'var(--c-border)' }}>
      <span className="text-sm" style={{ color: 'var(--c-muted)' }}>{label}</span>
      <span className={clsx('text-sm text-white', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}