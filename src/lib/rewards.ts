// ─────────────────────────────────────────────────────────────
//  StreamCoin Reward Calculator
//  Mirrors the on-chain formulas in StreamCoin.sol v3
//  Use these for UI previews — the contract is the source of truth
// ─────────────────────────────────────────────────────────────

const DEPLOY_TIME = new Date('2026-01-01').getTime() / 1000 // update at deploy

// ── Epoch ─────────────────────────────────────────────────────
export function currentYear(): number {
  const elapsed = Date.now() / 1000 - DEPLOY_TIME
  return Math.floor(elapsed / (365 * 24 * 3600)) + 1
}

export function epochMultiplier(year?: number): number {
  const yr = year ?? currentYear()
  return Math.pow(0.75, yr - 1)
}

// ── Streamer formula ──────────────────────────────────────────
// BASE     = viewers × 0.00002  STMC/min
// EPOCH    = 0.75^(year−1)
// PARTNER  = 1.50 | 1.25 | 1.00
// DURATION = 1.20 | 1.10 | 1.05 | 1.00
// reward   = BASE × EPOCH × PARTNER × DURATION × minutes
// CAP      = 10 STMC per hour

export function partnerMultiplier(avgViewers: number): number {
  if (avgViewers >= 500) return 1.50
  if (avgViewers >= 100) return 1.25
  return 1.00
}

export function partnerTier(avgViewers: number): 'partner' | 'affiliate' | 'standard' {
  if (avgViewers >= 500) return 'partner'
  if (avgViewers >= 100) return 'affiliate'
  return 'standard'
}

export function durationMultiplier(hours: number): number {
  if (hours >= 8) return 1.20
  if (hours >= 4) return 1.10
  if (hours >= 1) return 1.05
  return 1.00
}

export function calcStreamReward(
  viewers: number,
  minutes: number,
  hours: number,
  avgViewers: number,
  year?: number
): number {
  const base     = viewers * 0.00002
  const epoch    = epochMultiplier(year)
  const partner  = partnerMultiplier(avgViewers)
  const duration = durationMultiplier(hours)
  const raw      = base * epoch * partner * duration * minutes
  const cap      = 10 * hours
  return Math.min(raw, cap)
}

export function calcStreamRatePerMinute(
  viewers: number,
  avgViewers: number,
  year?: number
): number {
  const base    = viewers * 0.00002
  const epoch   = epochMultiplier(year)
  const partner = partnerMultiplier(avgViewers)
  return base * epoch * partner
}

// ── Viewer formula ────────────────────────────────────────────
// BASE   = 0.19 STMC/min (flat)
// EPOCH  = 0.75^(year−1)
// STREAK = 1.0 + min(days, 30) × 0.011
// reward = BASE × EPOCH × STREAK × minutes
// CAP    = 15 STMC per day

export function streakMultiplier(streakDays: number): number {
  return 1.0 + Math.min(streakDays, 30) * 0.011
}

export function calcViewerReward(
  minutes: number,
  streakDays: number,
  year?: number
): number {
  const base   = 0.19
  const epoch  = epochMultiplier(year)
  const streak = streakMultiplier(streakDays)
  const raw    = base * epoch * streak * minutes
  return Math.min(raw, 15)
}

export function calcViewerRatePerMinute(
  streakDays: number,
  year?: number
): number {
  return 0.19 * epochMultiplier(year) * streakMultiplier(streakDays)
}

// ── Formatting helpers ────────────────────────────────────────
export function formatSTMC(amount: number, decimals = 2): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(decimals)}M`
  if (amount >= 1_000)     return `${(amount / 1_000).toFixed(decimals)}K`
  return amount.toFixed(decimals)
}

export function formatViewers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`
  if (count >= 1_000)     return `${(count / 1_000).toFixed(1)}K`
  return count.toString()
}

// ── Pool health ───────────────────────────────────────────────
export const MINING_POOL_TOTAL = 400_000_000

export function poolHealthPercent(totalMinted: number): number {
  return Math.max(0, ((MINING_POOL_TOTAL - totalMinted) / MINING_POOL_TOTAL) * 100)
}
