'use client'

// Ported from interior.dev, reskinned to Curio's palette. Replaces the
// hand-rolled checkPwStrength/.pw-bar-fill meter in the login page.

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const CELL = { type: 'spring', stiffness: 520, damping: 34, mass: 0.45 } as const
const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const
const INSTANT = { duration: 0 } as const

const COMMON = /^(?:password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|123456)/i
const RUN = /(.)\1{3,}/
const RUN_UP = /(?:0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|qwer|wert|erty|asdf)/i
const SYMBOL = /[!-/:-@[-`{-~]/

export type PasswordRule = { id: string; label: string; test: (value: string) => boolean }
export type EvaluatedRule = PasswordRule & { met: boolean }

export const defaultPasswordRules: readonly PasswordRule[] = [
  { id: 'length', label: 'At least 6 characters', test: (v) => v.length >= 6 },
  { id: 'case', label: 'Upper and lower case', test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: 'digit', label: 'A number', test: (v) => /\d/.test(v) },
  { id: 'symbol', label: 'A symbol', test: (v) => SYMBOL.test(v) },
]

const defaultLabels = ['Empty', 'Too short', 'Weak', 'Good', 'Strong'] as const

export function usePasswordStrength(
  value: string,
  { rules = defaultPasswordRules, labels = defaultLabels }: { rules?: readonly PasswordRule[]; labels?: readonly string[] } = {},
) {
  return useMemo(() => {
    const evaluated = rules.map((rule) => ({ ...rule, met: rule.test(value) }))
    const passed = evaluated.reduce((n, r) => n + (r.met ? 1 : 0), 0)
    const guessable = value.length > 0 && (COMMON.test(value) || RUN.test(value) || RUN_UP.test(value))
    const score = value.length === 0 ? 0 : guessable ? 1 : Math.min(rules.length, Math.max(1, passed))
    const label = labels[Math.min(score, labels.length - 1)] ?? ''
    return { score, max: rules.length, label, rules: evaluated, guessable }
  }, [value, rules, labels])
}

export type PasswordStrengthProps = {
  value: string
  rules?: readonly PasswordRule[]
  labels?: readonly string[]
  showRules?: boolean
  className?: string
}

const TONES = {
  none: { bar: 'rgba(33,26,19,0.15)', text: 'rgba(33,26,19,0.4)' },
  danger: { bar: '#9C3428', text: '#9C3428' },
  caution: { bar: '#A9752A', text: '#A9752A' },
  safe: { bar: '#3F6B3D', text: '#3F6B3D' },
} as const

function toneFor(score: number, max: number) {
  if (score === 0) return TONES.none
  const ratio = score / max
  if (ratio <= 0.34) return TONES.danger
  if (ratio <= 0.67) return TONES.caution
  return TONES.safe
}

export function PasswordStrength({
  value,
  rules = defaultPasswordRules,
  labels = defaultLabels,
  showRules = true,
  className = '',
}: PasswordStrengthProps) {
  const { score, max, label, rules: evaluated, guessable } = usePasswordStrength(value, { rules, labels })
  const reduced = useReducedMotion()
  const tone = toneFor(score, max)

  if (value.length === 0) return null

  return (
    <div className={`w-full ${className}`} style={{ marginTop: '0.5rem' }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))`, gap: 5 }}>
        {Array.from({ length: max }, (_, i) => (
          <div key={i} className="relative overflow-hidden" style={{ height: 4, borderRadius: 2, background: 'rgba(33,26,19,0.1)' }}>
            <motion.span
              className="absolute inset-0 origin-left"
              style={{ borderRadius: 2, background: tone.bar }}
              initial={false}
              animate={{ scaleX: i < score ? 1 : 0 }}
              transition={reduced ? INSTANT : { ...CELL, delay: i < score ? i * 0.03 : 0 }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-3">
        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: tone.text }}>{label}</span>
        {guessable ? (
          <span style={{ fontSize: '0.65rem', color: '#A9752A' }}>Commonly guessed</span>
        ) : null}
      </div>

      {showRules ? (
        <ul className="mt-2 grid" style={{ gap: 4 }}>
          {evaluated.map((rule) => (
            <li key={rule.id} className="flex items-center" style={{ gap: 6 }}>
              <span
                className="relative grid shrink-0 place-items-center"
                style={{ width: 13, height: 13, borderRadius: 3, border: '1px solid rgba(33,26,19,0.18)' }}
              >
                <motion.span
                  className="absolute inset-0"
                  style={{ borderRadius: 2, background: '#B8451F' }}
                  initial={false}
                  animate={{ opacity: rule.met ? 1 : 0 }}
                  transition={reduced ? INSTANT : CROSSFADE}
                />
                {rule.met ? (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" className="relative">
                    <path d="M2 6.2 4.7 8.9 10 3.3" stroke="#F6F0E2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </span>
              <span style={{ fontSize: '0.68rem', color: rule.met ? '#211A13' : 'rgba(33,26,19,0.4)' }}>{rule.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
