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
    headerBg:    '#9C3428',
    headerBorder:'#9C3428',
    badgeBg:     'rgba(156,52,40,0.14)',
    badgeText:   '#9C3428',
    barBg:       '#9C3428',
    glowColor:   'rgba(156,52,40,0.18)',
  },
  cyan: {
    headerBg:    '#B8451F',
    headerBorder:'#B8451F',
    badgeBg:     'rgba(184,69,31,0.14)',
    badgeText:   '#B8451F',
    barBg:       '#B8451F',
    glowColor:   'rgba(184,69,31,0.18)',
  },
  amber: {
    headerBg:    '#A9752A',
    headerBorder:'#A9752A',
    badgeBg:     'rgba(169,117,42,0.14)',
    badgeText:   '#A9752A',
    barBg:       '#A9752A',
    glowColor:   'rgba(169,117,42,0.18)',
  },
  plum: {
    headerBg:    '#211A13',
    headerBorder:'#B8451F',
    badgeBg:     'rgba(184,69,31,0.1)',
    badgeText:   '#B8451F',
    barBg:       '#B8451F',
    glowColor:   'rgba(184,69,31,0.16)',
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
        background: '#FBF8EF',
        border: `1px solid rgba(33,26,19,0.12)`,
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
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(33,26,19,0.12)'
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
              style={{ background: 'rgba(255,255,255,0.9)', color: '#3F6B3D' }}>
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
        <h3 className="font-black text-base mb-1 leading-tight" style={{ color: '#211A13' }}>
          {name}
        </h3>
        <p className="text-xs mb-3 line-clamp-1" style={{ color: 'rgba(33,26,19,0.55)' }}>{description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: c.badgeBg, color: c.badgeText }}>
            Gr {grade}
          </span>
          <span className="text-xs" style={{ color: 'rgba(33,26,19,0.55)' }}>{subject}</span>
          <span className="text-xs ml-auto" style={{ color: 'rgba(33,26,19,0.55)' }}>{subtopicCount} levels</span>
        </div>

        {/* Progress bar */}
        {progressPercent > 0 ? (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: 'rgba(33,26,19,0.55)' }}>Progress</span>
              <span className="text-xs font-black" style={{ color: c.badgeText }}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(33,26,19,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, background: c.barBg }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(33,26,19,0.2)' }} />
            <span className="text-xs" style={{ color: 'rgba(33,26,19,0.55)' }}>Not started yet</span>
          </div>
        )}
      </div>
    </Link>
  )
}
