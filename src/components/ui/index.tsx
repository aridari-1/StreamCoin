import { clsx } from 'clsx'

// ── Stat card ─────────────────────────────────────────────────
export function StatCard({
  label, value, sub, color = 'text-white', icon,
}: {
  label: string; value: string; sub?: string
  color?: string; icon?: React.ReactNode
}) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
        {icon && <div className="text-gray-600">{icon}</div>}
      </div>
      <div className={clsx('text-2xl font-bold', color)}>{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

// ── Tier badge ────────────────────────────────────────────────
export function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    partner:   'bg-purple-900/40 text-purple-300 border-purple-700/40',
    affiliate: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    standard:  'bg-gray-800 text-gray-400 border-gray-700',
  }
  return (
    <span className={clsx(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      styles[tier] ?? styles.standard
    )}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  )
}

// ── Status badge ──────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    live:            'bg-red-900/40 text-red-400 border-red-800/40',
    rewarded:        'bg-green-900/40 text-green-400 border-green-800/40',
    pending_reward:  'bg-yellow-900/40 text-yellow-400 border-yellow-800/40',
    ended:           'bg-gray-800 text-gray-500 border-gray-700',
    bot_suspect:     'bg-orange-900/40 text-orange-400 border-orange-800/40',
  }
  const labels: Record<string, string> = {
    live:           '● Live',
    rewarded:       '✓ Rewarded',
    pending_reward: '⏳ Pending',
    ended:          'Ended',
    bot_suspect:    '⚠ Flagged',
  }
  return (
    <span className={clsx(
      'px-2 py-0.5 text-xs font-medium rounded-full border',
      styles[status] ?? styles.ended
    )}>
      {labels[status] ?? status}
    </span>
  )
}

// ── Loading spinner ───────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div className={clsx(
      sz, 'border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin'
    )} />
  )
}

// ── Empty state ───────────────────────────────────────────────
export function EmptyState({ icon, title, desc, action }: {
  icon?: string; title: string; desc?: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-4xl mb-4">{icon}</div>}
      <div className="text-white font-medium text-lg mb-2">{title}</div>
      {desc && <div className="text-gray-500 text-sm max-w-xs">{desc}</div>}
      {action && (
        <a href={action.href}
          className="mt-4 px-5 py-2 bg-[#7F77DD] hover:bg-[#6b63c7] text-white text-sm font-medium rounded-lg transition-colors">
          {action.label}
        </a>
      )}
    </div>
  )
}

// ── Section header ────────────────────────────────────────────
export function SectionHeader({ title, sub, action }: {
  title: string; sub?: string
  action?: { label: string; href?: string; onClick?: () => void }
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {action && (
        action.href
          ? <a href={action.href} className="text-sm text-[#7F77DD] hover:text-[#9b95e8] transition-colors">{action.label}</a>
          : <button onClick={action.onClick} className="text-sm text-[#7F77DD] hover:text-[#9b95e8] transition-colors">{action.label}</button>
      )}
    </div>
  )
}

// ── YouTube logo ──────────────────────────────────────────────
export function YouTubeLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/>
    </svg>
  )
}
