'use client'

// Ported from interior.dev, reskinned to Curio's palette/sizing (matches the
// existing .field-input footprint: 10px radius, ~13px type).

import { useCallback, useEffect, useLayoutEffect, useId, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

const INSTANT = { duration: 0 } as const
const LIFT = { type: 'spring', stiffness: 760, damping: 46, mass: 0.5 } as const
const RAISE = -26
const SLIDE = -10
const SHRINK = 0.86

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export type UseFloatingLabelOptions = {
  value?: string
  defaultValue?: string
  disabled?: boolean
}

export function useFloatingLabel({ value, defaultValue, disabled = false }: UseFloatingLabelOptions = {}) {
  const ref = useRef<HTMLInputElement | null>(null)
  const mounted = useRef(false)

  const [focused, setFocused] = useState(false)
  const [fill, setFill] = useState({ length: (value ?? defaultValue ?? '').length, instant: true })

  const settle = useCallback((next: number, instant: boolean) => {
    setFill((prev) => (prev.length === next && prev.instant === instant ? prev : { length: next, instant }))
  }, [])

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    const next = value !== undefined ? value.length : el ? el.value.length : 0
    settle(next, !mounted.current)
    mounted.current = true
  }, [value, settle])

  useEffect(() => {
    setFill((prev) => (prev.instant ? { ...prev, instant: false } : prev))
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || value !== undefined) return
    const read = () => settle(el.value.length, false)
    el.addEventListener('input', read)
    el.addEventListener('change', read)
    return () => {
      el.removeEventListener('input', read)
      el.removeEventListener('change', read)
    }
  }, [value, settle])

  useEffect(() => {
    if (disabled) setFocused(false)
  }, [disabled])

  const onFocus = useCallback(() => setFocused(true), [])
  const onBlur = useCallback(() => setFocused(false), [])
  const onChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => settle(event.currentTarget.value.length, false),
    [settle],
  )

  return {
    ref,
    raised: focused || fill.length > 0,
    focused,
    filled: fill.length > 0,
    length: fill.length,
    instant: fill.instant && !focused,
    fieldProps: { onFocus, onBlur, onChange },
  }
}

export type FloatingLabelInputProps = {
  label: string
  value?: string
  defaultValue?: string
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: () => void
  onBlur?: () => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  hint?: string
  invalid?: boolean
  id?: string
  name?: string
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url'
  autoComplete?: string
  maxLength?: number
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  trailing?: React.ReactNode
  inputRef?: React.Ref<HTMLInputElement>
  className?: string
}

export function FloatingLabelInput({
  label,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  hint,
  invalid = false,
  id,
  name,
  type = 'text',
  autoComplete,
  maxLength,
  required = false,
  disabled = false,
  readOnly = false,
  trailing,
  inputRef,
  className = '',
}: FloatingLabelInputProps) {
  const auto = useId()
  const fieldId = id ?? `${auto}-field`
  const hintId = `${auto}-hint`

  const reduced = useReducedMotion()
  const { ref, raised, focused, instant, fieldProps } = useFloatingLabel({ value, defaultValue, disabled })
  const move = reduced || instant ? INSTANT : LIFT

  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      ref.current = node
      if (typeof inputRef === 'function') inputRef(node)
      else if (inputRef && 'current' in inputRef) (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
    },
    [ref, inputRef],
  )

  const borderColor = invalid ? '#FF5E5B' : focused ? '#6DD3CE' : 'rgba(247,247,255,0.12)'
  const bg = invalid || focused ? '#2B1E3F' : '#2B1E3F'

  return (
    <div className={`w-full ${className}`}>
      <div className="relative" style={{ paddingTop: 18 }}>
        <div
          className="relative transition-[border-color,box-shadow] duration-150"
          style={{
            height: 44,
            borderRadius: 10,
            border: `1.5px solid ${borderColor}`,
            background: bg,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <input
            ref={attach}
            id={fieldId}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            autoComplete={autoComplete}
            maxLength={maxLength}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            aria-required={required || undefined}
            aria-invalid={invalid || undefined}
            aria-describedby={hint ? hintId : undefined}
            onFocus={() => { fieldProps.onFocus(); onFocus?.() }}
            onBlur={() => { fieldProps.onBlur(); onBlur?.() }}
            onChange={(event) => { fieldProps.onChange(event); onChange?.(event.currentTarget.value, event) }}
            onKeyDown={onKeyDown}
            className="absolute inset-0 h-full w-full bg-transparent outline-none disabled:cursor-not-allowed"
            style={{
              borderRadius: 9,
              padding: trailing ? '0 40px 0 14px' : '0 14px',
              fontFamily: 'var(--b)',
              fontSize: '0.88rem',
              color: '#F7F7FF',
            }}
          />
          {trailing ? (
            <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
          ) : null}
        </div>

        <motion.label
          htmlFor={fieldId}
          initial={false}
          animate={{ y: raised ? RAISE : 0, x: raised ? SLIDE : 0, scale: raised ? SHRINK : 1 }}
          transition={move}
          style={{
            originX: 0,
            originY: 0,
            willChange: 'transform',
            position: 'absolute',
            left: 14,
            top: 32,
            fontSize: '0.82rem',
            lineHeight: '16px',
            color: invalid ? '#FF5E5B' : raised ? 'rgba(247,247,255,0.7)' : 'rgba(247,247,255,0.35)',
          }}
          className="block cursor-text select-none"
        >
          {label}
          {required ? <span aria-hidden style={{ marginLeft: 2, color: 'rgba(247,247,255,0.3)' }}>*</span> : null}
        </motion.label>
      </div>

      {hint ? (
        <p
          id={hintId}
          className="mt-1.5"
          style={{ fontSize: '0.68rem', lineHeight: '16px', color: invalid ? '#FF5E5B' : 'rgba(247,247,255,0.3)' }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}
