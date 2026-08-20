'use client'

// Sliding sun/moon well — ported from interior.dev's theme-toggle, restyled
// to Curio's paper/ink/rust tokens. Same mechanic: a recessed track, a
// lifted "cap" that slides to whichever icon is active, no page reload.

import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon } from '@/components/icons'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div
      className="relative flex items-center"
      role="group"
      aria-label="Theme"
      style={{
        width: 54,
        height: 26,
        padding: 3,
        borderRadius: 8,
        background: 'var(--ink08)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), inset 0 0 0 1px var(--ink08)',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: 3,
          top: 3,
          height: 20,
          width: 24,
          borderRadius: 5,
          background: 'var(--paper-raised)',
          boxShadow: '0 1.5px 0 rgba(0,0,0,0.14), 0 0 0 1px var(--ink15)',
          transition: 'transform 220ms cubic-bezier(0.23,1,0.32,1)',
          transform: theme === null ? 'translateX(0px)' : dark ? 'translateX(24px)' : 'translateX(0px)',
          opacity: theme === null ? 0 : 1,
        }}
      />
      <button
        type="button"
        onClick={() => setTheme('light')}
        aria-label="Light mode"
        aria-pressed={!dark}
        className="relative z-10 grid place-items-center"
        style={{ width: 24, height: 20, borderRadius: 5, color: !dark ? 'var(--ink)' : 'var(--ink35)', transition: 'color 200ms ease' }}
      >
        <Sun size={13} />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        aria-label="Dark mode"
        aria-pressed={dark}
        className="relative z-10 grid place-items-center"
        style={{ width: 24, height: 20, borderRadius: 5, color: dark ? 'var(--ink)' : 'var(--ink35)', transition: 'color 200ms ease' }}
      >
        <Moon size={13} />
      </button>
    </div>
  )
}
