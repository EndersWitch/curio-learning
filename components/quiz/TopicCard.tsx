'use client'

import Link from 'next/link'

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
    headerBg:    'linear-gradient(135deg, #FF5E5B 0%, #ff8a47 100%)',
    headerBorder:'#FF5E5B',
    badgeBg:     'rgba(255,94,91,0.15)',
    badgeText:   '#FF5E5B',
    barBg:       'linear-gradient(90deg, #FF5E5B, #ff8a47)',
    glowColor:   'rgba(255,94,91,0.25)',
  },
  cyan: {
    headerBg:    'linear-gradient(135deg, #6DD3CE 0%, #4ab8c1 100%)',
    headerBorder:'#6DD3CE',
    badgeBg:     'rgba(109,211,206,0.15)',
    badgeText:   '#6DD3CE',
    barBg:       'linear-gradient(90deg, #6DD3CE, #4ab8c1)',
    glowColor:   'rgba(109,211,206,0.25)',
  },
  amber: {
    headerBg:    'linear-gradient(135deg, #F5C842 0%, #f5a623 100%)',
    headerBorder:'#F5C842',
    badgeBg:     'rgba(245,200,66,0.15)',
    badgeText:   '#c8950a',
    barBg:       'linear-gradient(90deg, #F5C842, #f5a623)',
    glowColor:   'rgba(245,200,66,0.25)',
  },
  plum: {
    headerBg:    'linear-gradient(135deg, #3d2d58 0%, #2B1E3F 100%)',
    headerBorder:'#6DD3CE',
    badgeBg:     'rgba(109,211,206,0.1)',
    badgeText:   '#6DD3CE',
    barBg:       'linear-gradient(90deg, #6DD3CE, #4ab8c1)',
    glowColor:   'rgba(109,211,206,0.2)',
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
      className="group block rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: '#231935',
        border: `1px solid rgba(255,255,255,0.08)`,
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
        ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      {/* Coloured header strip */}
      <div className="relative h-24 p-4 flex items-start justify-between overflow-hidden"
        style={{ background: c.headerBg }}>

        <span className="text-3xl drop-shadow-md">{icon}</span>

        <div className="flex flex-col items-end gap-1.5">
          {isPremium && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.25)', color: '#fff', backdropFilter: 'blur(4px)' }}>
              ✨ Premium
            </span>
          )}
          {isLocked && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}>
              🔒 Locked
            </span>
          )}
          {progressPercent === 100 && (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.9)', color: '#1a7a4a' }}>
              ✅ Mastered!
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
        <h3 className="font-black text-base mb-1 leading-tight" style={{ color: '#F7F7FF' }}>
          {name}
        </h3>
        <p className="text-xs mb-3 line-clamp-1" style={{ color: '#9b8ab0' }}>{description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: c.badgeBg, color: c.badgeText }}>
            Gr {grade}
          </span>
          <span className="text-xs" style={{ color: '#9b8ab0' }}>{subject}</span>
          <span className="text-xs ml-auto" style={{ color: '#9b8ab0' }}>{subtopicCount} levels</span>
        </div>

        {/* Progress bar */}
        {progressPercent > 0 ? (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-semibold" style={{ color: '#9b8ab0' }}>Progress</span>
              <span className="text-xs font-black" style={{ color: c.badgeText === '#c8950a' ? '#F5C842' : c.badgeText }}>
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%`, background: c.barBg }} />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
            <span className="text-xs" style={{ color: '#9b8ab0' }}>Not started yet</span>
          </div>
        )}
      </div>
    </Link>
  )
}
