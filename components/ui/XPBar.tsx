'use client'

import { useEffect, useState } from 'react'

interface XPBadgeProps {
  xp: number
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function XPBadge({ xp, animate = false, size = 'md' }: XPBadgeProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : xp)

  useEffect(() => {
    if (!animate) return
    let start = 0
    const step = Math.ceil(xp / 30)
    const interval = setInterval(() => {
      start += step
      if (start >= xp) {
        setDisplayed(xp)
        clearInterval(interval)
      } else {
        setDisplayed(start)
      }
    }, 30)
    return () => clearInterval(interval)
  }, [xp, animate])

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full bg-amber-400 text-amber-900 ${sizes[size]}`}
    >
      ⚡ {displayed} XP
    </span>
  )
}

interface ProgressBarProps {
  value: number // 0–100
  color?: string
  label?: string
  showPercent?: boolean
}

export function ProgressBar({
  value,
  color = 'bg-violet-500',
  label,
  showPercent = false,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between mb-1 text-xs font-medium text-slate-500">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

interface StreakBadgeProps {
  streak: number
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < 1) return null
  return (
    <span className="inline-flex items-center gap-1 font-bold text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
      🔥 {streak} day streak
    </span>
  )
}

interface LevelPillProps {
  level: number
  xp: number
}

export function LevelPill({ level, xp }: LevelPillProps) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-1.5 shadow-sm">
      <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black">
        {level}
      </div>
      <div>
        <div className="text-xs font-bold text-slate-700">Level {level}</div>
        <div className="text-xs text-slate-400">{xp.toLocaleString()} XP</div>
      </div>
    </div>
  )
}
