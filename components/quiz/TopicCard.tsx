'use client'

import Link from 'next/link'
import { Star, Lock, Check } from '@/components/icons'

interface TopicCardProps {
  id: string
  name: string
  subject: string
  grade: number
  description: string
  icon: string
  color: string
  progressPercent: number
  isPremium: boolean
  isLocked: boolean
  subtopicCount: number
}

// Curio brand colour system — matches the rest of the site exactly
const COLOR_MAP: Record<string, {
  headerBg: string
  headerBorder: string
  badgeBg: string
  badgeText: string
  barBg: string
  glowColor: string
}> = {
  coral: {
    headerBg:    'var(--brick)',
    headerBorder:'var(--brick)',
    badgeBg:     'rgba(var(--brick-rgb),0.14)',
    badgeText:   'var(--brick)',
    barBg:       'var(--brick)',
    glowColor:   'rgba(var(--brick-rgb),0.18)',
  },
  cyan: {
    headerBg:    'var(--rust)',
    headerBorder:'var(--rust)',
    badgeBg:     'rgba(var(--rust-rgb),0.14)',
    badgeText:   'var(--rust)',
    barBg:       'var(--rust)',
    glowColor:   'rgba(var(--rust-rgb),0.18)',
  },
  amber: {
    headerBg:    'var(--ochre)',
    headerBorder:'var(--ochre)',
    badgeBg:     'rgba(var(--ochre-rgb),0.14)',
    badgeText:   'var(--ochre)',
    barBg:       'var(--ochre)',
    glowColor:   'rgba(var(--ochre-rgb),0.18)',
  },
  plum: {
    headerBg:    'var(--ink)',
    headerBorder:'var(--rust)',
    badgeBg:     'rgba(var(--rust-rgb),0.1)',
    badgeText:   'var(--rust)',
    barBg:       'var(--rust)',
    glowColor:   'rgba(var(--rust-rgb),0.16)',
  },
}

const FALLBACK = COLOR_MAP.coral

export default function TopicCard({
  id,
  name,
  subject,
  grade,
  description,
  icon,
  color,
  progressPercent,
  isPremium,
  isLocked,
  subtopicCount,
}: TopicCardProps) {
  const c = COLOR_MAP[color] ?? FALLBACK
  const href = isLocked ? '#' : `/quiz/${encodeURIComponent(id)}`

  return (
    <Link
      href={href}
      className="group block rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--paper-raised)',
        border: `1px solid rgba(var(--ink-rgb),0.12)`,
        cursor: isLocked ? 'not-allowed' : 'pointer',
        opacity: isLocked ? 0.75 : 1,
      }}
      onMouseEnter={e => {
        if (!isLocked) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${c.glowColor}`
          ;(e.currentTarget as HTMLElement).style.borderColor = c.headerBorder + '60'
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(var(--ink-rgb),0.12)'
      }}
    >
      {/* Coloured header strip */}
      <div className="relative h-24 p-4 flex items-start justify-between overflow-hidden"
        style={{ background: c.headerBg }}>

        <span className="text-3xl drop-shadow-md">{icon}</span>

        <div className="flex flex-col items-end gap-1.5">
          {isPremium && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              <Star size={11} /> Premium
            </span>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}>
              <Lock size={11} /> Locked
            </span>
          )}
          {progressPercent === 100 && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--moss)' }}>
              <Check size={11} /> Mastered!
            </span>
          )}
        </div>

        {/* Decorative circle */}
        <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full"
          style={{ background: 'rgba(255,255,255,0.12)' }} />
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-black text-base mb-1 leading-tight" style={{ color: 'var(--ink)' }}>
          {name}
        </h3>
        <p className="text-xs mb-3 line-clamp-1" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: c.badgeBg, color: c.badgeText }}>
            Gr {grade}
          </span>
          <span className="text-xs" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{subject}</span>
          <span className="text-xs ml-auto" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{subtopicCount} levels</span>
        </div>

        {/* Progress bar */}
        {progressPercent > 0 ? (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Progress</span>
              <span className="text-xs font-black" style={{ color: c.badgeText }}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(var(--ink-rgb),0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, background: c.barBg }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(var(--ink-rgb),0.2)' }} />
            <span className="text-xs" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>Not started yet</span>
          </div>
        )}
      </div>
    </Link>
  )
}
