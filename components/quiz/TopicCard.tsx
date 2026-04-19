'use client'

import Link from 'next/link'
import { ProgressBar } from '@/components/ui/XPBar'

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

const COLOR_MAP: Record<string, { bg: string; ring: string; badge: string; glow: string }> = {
  coral: {
    bg: 'from-rose-400 to-orange-400',
    ring: 'ring-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    glow: 'shadow-rose-200',
  },
  cyan: {
    bg: 'from-cyan-400 to-teal-400',
    ring: 'ring-cyan-200',
    badge: 'bg-cyan-100 text-cyan-700',
    glow: 'shadow-cyan-200',
  },
  amber: {
    bg: 'from-amber-400 to-yellow-400',
    ring: 'ring-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    glow: 'shadow-amber-200',
  },
  violet: {
    bg: 'from-violet-500 to-purple-500',
    ring: 'ring-violet-200',
    badge: 'bg-violet-100 text-violet-700',
    glow: 'shadow-violet-200',
  },
  emerald: {
    bg: 'from-emerald-400 to-green-500',
    ring: 'ring-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
    glow: 'shadow-emerald-200',
  },
  blue: {
    bg: 'from-blue-400 to-indigo-500',
    ring: 'ring-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    glow: 'shadow-blue-200',
  },
}

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
  const c = COLOR_MAP[color] ?? COLOR_MAP.violet
  const href = isLocked ? '#' : `/quiz/${encodeURIComponent(id)}`

  return (
    <Link
      href={href}
      className={`group block rounded-3xl overflow-hidden border-2 bg-white transition-all duration-300
        ${isLocked ? 'opacity-70 cursor-not-allowed border-slate-200' : `border-transparent hover:border-violet-300 hover:shadow-xl hover:-translate-y-1 ${c.glow} hover:shadow-lg`}
      `}
    >
      {/* Color header */}
      <div className={`relative h-28 bg-gradient-to-br ${c.bg} p-5 flex items-start justify-between`}>
        <div className="text-4xl drop-shadow">{icon}</div>

        <div className="flex flex-col items-end gap-1">
          {isPremium && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/30 text-white backdrop-blur-sm">
              ✨ Premium
            </span>
          )}
          {isLocked && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/20 text-white">
              🔒 Locked
            </span>
          )}
          {progressPercent === 100 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/90 text-emerald-700">
              ✅ Mastered!
            </span>
          )}
        </div>

        {/* Decorative blob */}
        <div className="absolute bottom-0 right-0 w-20 h-20 rounded-full bg-white/10 translate-x-6 translate-y-6" />
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-black text-slate-800 text-base leading-tight">{name}</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{description}</p>

        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            Gr {grade}
          </span>
          <span className="text-xs text-slate-400">{subject}</span>
          <span className="text-xs text-slate-400 ml-auto">{subtopicCount} topics</span>
        </div>

        {progressPercent > 0 ? (
          <ProgressBar
            value={progressPercent}
            color={`bg-gradient-to-r ${c.bg}`}
            showPercent
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-400">Not started yet</span>
          </div>
        )}
      </div>
    </Link>
  )
}
