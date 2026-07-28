import React from 'react'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'
type LogoVariant = 'mark' | 'full' | 'wordmark'

const SIZES: Record<LogoSize, number> = { sm: 28, md: 40, lg: 64, xl: 120 }

export function LogoMark({ size = 'md', className }: { size?: LogoSize; className?: string }) {
  const s = SIZES[size]
  const id = size
  return (
    <svg
      width={s} height={s}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="StreamMine logo"
      role="img"
    >
      <defs>
        <radialGradient id={`iris-${id}`} cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#c4b5fd"/>
          <stop offset="45%" stopColor="#8b7cf8"/>
          <stop offset="100%" stopColor="#3b0764"/>
        </radialGradient>
        <radialGradient id={`pupil-${id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#1a0533"/>
          <stop offset="100%" stopColor="#080010"/>
        </radialGradient>
        <linearGradient id={`lid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa"/>
          <stop offset="100%" stopColor="#22d3a5"/>
        </linearGradient>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="50" cy="50" rx="46" ry="36" fill="#8b7cf8" opacity="0.12"/>

      {/* Lower eyelid arc */}
      <path d="M14,50 Q50,78 86,50"
        fill="none" stroke={`url(#lid-${id})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.9"/>

      {/* Iris */}
      <circle cx="50" cy="50" r="26" fill={`url(#iris-${id})`}/>
      <circle cx="50" cy="50" r="26" fill="none" stroke={`url(#lid-${id})`} strokeWidth="1.2" opacity="0.45"/>
      <circle cx="50" cy="50" r="19" fill="none" stroke="rgba(167,139,250,.2)" strokeWidth="0.8" strokeDasharray="2 4"/>

      {/* Pupil */}
      <circle cx="50" cy="50" r="14" fill={`url(#pupil-${id})`}/>

      {/* Teal iris refraction */}
      <ellipse cx="41" cy="43" rx="7" ry="4.5" fill="#22d3a5" opacity="0.28" transform="rotate(-20 41 43)"/>

      {/* Upper eyelid = play arrow (paupière) */}
      <path d="M14,50 L50,18 L86,50"
        fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.93"/>

      {/* Subtle fill inside upper lid */}
      <path d="M22,50 Q50,28 78,50 L50,20 Z" fill="rgba(139,124,248,.07)"/>

      {/* Pupil shine */}
      <circle cx="55" cy="44" r="3.5" fill="rgba(255,255,255,.55)"/>
      <circle cx="50" cy="49" r="1.5" fill="rgba(255,255,255,.22)"/>

      {/* Left signal lashes */}
      <line x1="14" y1="51" x2="4" y2="51" stroke="#8b7cf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      <line x1="17" y1="41" x2="8" y2="36" stroke="#8b7cf8" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>

      {/* Right signal lashes */}
      <line x1="86" y1="51" x2="96" y2="51" stroke="#22d3a5" strokeWidth="1.5" strokeLinecap="round" opacity="0.65"/>
      <line x1="83" y1="41" x2="92" y2="36" stroke="#22d3a5" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>

      {/* Broadcast arcs */}
      <path d="M10,38 Q-2,50 10,62" fill="none" stroke="#8b7cf8" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4" opacity="0.35"/>
      <path d="M90,38 Q102,50 90,62" fill="none" stroke="#22d3a5" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="3 4" opacity="0.35"/>
    </svg>
  )
}

export function Logo({
  size = 'md',
  variant = 'full',
  className,
}: {
  size?: LogoSize
  variant?: LogoVariant
  className?: string
}) {
  const textSize = { sm:13, md:16, lg:22, xl:36 }[size]
  const gap      = { sm:6,  md:8,  lg:12, xl:18 }[size]

  if (variant === 'wordmark') {
    return (
      <span style={{ fontSize:textSize, fontWeight:800, letterSpacing:'-0.025em', background:'linear-gradient(90deg,#fff,#a78bfa,#22d3a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
        StreamMine
      </span>
    )
  }

  if (variant === 'mark') return <LogoMark size={size} className={className} />

  return (
    <div style={{ display:'flex', alignItems:'center', gap }} className={className}>
      <LogoMark size={size} />
      <span style={{ fontSize:textSize, fontWeight:800, letterSpacing:'-0.025em', color:'#fff', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', lineHeight:1 }}>
        Stream<span style={{ background:'linear-gradient(90deg,#a78bfa,#22d3a5)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Mine</span>
      </span>
    </div>
  )
}

export default Logo