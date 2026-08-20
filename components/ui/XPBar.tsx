'use client'

import { useEffect, useState } from 'react'
import { Zap, Flame } from '@/components/icons'

interface XPBadgeProps {
  xp: number
  animate?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function XPBadge({ xp, animate = false, size = 'md' }: XPBadgeProps) {
  const [displayed, setDisplayed] = useState(animate ? 0 : xp)

  useEffect(() => {
    if (!animate) { setDisplayed(xp); return }
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

  const iconSizes = { sm: 11, md: 13, lg: 15 }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-full ${sizes[size]}`}
      style={{ background: 'var(--ochre)', color: 'var(--paper)' }}
    >
      <Zap size={iconSizes[size]} /> {displayed} XP
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
  color = 'bg-[var(--rust)]',
  label,
  showPercent = false,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between mb-1 text-xs font-medium" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(value)}%</span>}
        </div>
      )}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(var(--ink-rgb),0.08)' }}>
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
    <span className="inline-flex items-center gap-1.5 font-bold text-sm px-3 py-1 rounded-full"
      style={{ background: '#F4ECDD', color: 'var(--ochre)', border: '1px solid rgba(var(--ochre-rgb),0.3)' }}>
      <Flame size={13} /> {streak} day streak
    </span>
  )
}

interface LevelPillProps {
  level: number
  xp: number
}

export function LevelPill({ level, xp }: LevelPillProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: 'var(--paper-raised)', border: '1px solid rgba(var(--ink-rgb),0.15)' }}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black" style={{ background: 'var(--rust)', color: 'var(--paper)' }}>
        {level}
      </div>
      <div>
        <div className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Level {level}</div>
        <div className="text-xs" style={{ color: 'rgba(var(--ink-rgb),0.4)' }}>{xp.toLocaleString()} XP</div>
      </div>
    </div>
  )
}
