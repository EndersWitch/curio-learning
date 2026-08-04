'use client'

// Ported from interior.dev, reskinned to Curio's palette. Replaces the
// animate-pulse loading grids used ad hoc across the app — a crossfade
// instead of an idle pulse loop.

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const CROSSFADE = { type: 'spring', stiffness: 260, damping: 34, mass: 0.8 } as const

export function useSkeletonSwap({ ready, delay = 120, minVisible = 380 }: { ready: boolean; delay?: number; minVisible?: number }) {
  const [visible, setVisible] = useState(false)
  const shownAt = useRef(0)

  useEffect(() => {
    if (!ready) {
      if (visible) return
      const t = setTimeout(() => { shownAt.current = performance.now(); setVisible(true) }, delay)
      return () => clearTimeout(t)
    }
    if (!visible) return
    const rest = Math.max(0, minVisible - (performance.now() - shownAt.current))
    const t = setTimeout(() => setVisible(false), rest)
    return () => clearTimeout(t)
  }, [ready, visible, delay, minVisible])

  return { showSkeleton: visible }
}

export type SkeletonSwapProps = {
  ready: boolean
  children: React.ReactNode
  skeleton: React.ReactNode
  delay?: number
  minVisible?: number
  label?: string
  className?: string
}

export function SkeletonSwap({ ready, children, skeleton, delay = 120, minVisible = 380, label, className = '' }: SkeletonSwapProps) {
  const { showSkeleton } = useSkeletonSwap({ ready, delay, minVisible })
  const reduced = useReducedMotion()

  return (
    <div aria-busy={!ready} aria-label={label} className={`relative grid ${className}`}>
      <motion.div
        className="col-start-1 row-start-1 min-w-0"
        initial={false}
        animate={
          reduced
            ? { opacity: showSkeleton ? 0 : 1 }
            : { opacity: showSkeleton ? 0 : 1, scale: showSkeleton ? 0.99 : 1, filter: showSkeleton ? 'blur(4px)' : 'blur(0px)' }
        }
        transition={reduced ? { duration: 0 } : CROSSFADE}
        style={{ pointerEvents: showSkeleton ? 'none' : undefined }}
      >
        {children}
      </motion.div>

      <AnimatePresence initial={false}>
        {showSkeleton ? (
          <motion.div
            key="skeleton"
            aria-hidden
            className="pointer-events-none col-start-1 row-start-1 w-full self-start"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, filter: 'blur(3px)' }}
            transition={reduced ? { duration: 0 } : CROSSFADE}
          >
            {skeleton}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {label ? <span role="status" className="sr-only">{ready ? `${label} loaded` : ''}</span> : null}
    </div>
  )
}
