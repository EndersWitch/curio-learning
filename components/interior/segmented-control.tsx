'use client'

// Ported from interior.dev, reskinned to Curio's palette. Replaces the
// hand-built .tab-row pill switcher on the login page.

import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'

const CELL = { type: 'spring', stiffness: 520, damping: 34, mass: 0.45 } as const
const SEG = 'px-3 py-2 text-center whitespace-nowrap'

export type SegmentedOption = { value: string; label: string; disabled?: boolean }

export type SegmentedControlProps = {
  options: SegmentedOption[]
  label: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, label, value, defaultValue, onValueChange, className = '' }: SegmentedControlProps) {
  const count = Math.max(1, options.length)
  const template = `repeat(${count}, minmax(0, 1fr))`

  const [internal, setInternal] = useState(() => defaultValue ?? options[0]?.value ?? '')
  const controlled = value !== undefined
  const current = controlled ? value : internal
  const found = options.findIndex((o) => o.value === current)
  const index = found < 0 ? 0 : found

  const emit = useRef(onValueChange)
  emit.current = onValueChange
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const reduced = useReducedMotion()
  const pos = useMotionValue(index)
  const thumbX = useTransform(pos, (v) => `${v * 100}%`)
  const maskX = useTransform(pos, (v) => `${v * -100}%`)

  useEffect(() => {
    if (reduced) { pos.set(index); return }
    const controls = animate(pos, index, CELL)
    return () => controls.stop()
  }, [index, reduced, pos])

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next)
      if (next !== current) emit.current?.(next)
    },
    [controlled, current],
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`relative inline-block w-full select-none ${className}`}
      style={{ borderRadius: 10, background: '#2B1E3F', padding: 3, border: '1px solid rgba(247,247,255,0.08)' }}
    >
      <div className="relative grid" style={{ gridTemplateColumns: template, touchAction: 'manipulation' }}>
        {options.map((option) => (
          <span key={option.value} aria-hidden className={`${SEG} pointer-events-none`} style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgba(247,247,255,0.4)' }}>
            {option.label}
          </span>
        ))}

        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${100 / count}%`, x: thumbX, borderRadius: 7, background: '#6DD3CE' }}
          initial={false}
        >
          <motion.div className="absolute inset-0" style={{ x: maskX }} initial={false}>
            <div className="absolute inset-y-0 left-0 grid" style={{ width: `${count * 100}%`, gridTemplateColumns: template }}>
              {options.map((option) => (
                <span key={option.value} className={SEG} style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2B1E3F' }}>
                  {option.label}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: template }}>
          {options.map((option, i) => (
            <button
              key={option.value}
              ref={(node) => { buttons.current[i] = node }}
              type="button"
              role="radio"
              aria-checked={i === index}
              aria-disabled={option.disabled || undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => !option.disabled && select(option.value)}
              onKeyDown={(e) => {
                let dir = 0
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') dir = 1
                else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') dir = -1
                else return
                e.preventDefault()
                let j = i
                for (let k = 0; k < count; k++) {
                  j = (j + dir + count) % count
                  if (!options[j]?.disabled) break
                }
                buttons.current[j]?.focus()
                select(options[j].value)
              }}
              className="cursor-default outline-none"
              style={{ borderRadius: 7 }}
            >
              <span className="sr-only">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
