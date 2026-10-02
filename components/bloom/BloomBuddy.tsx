import type { CSSProperties } from 'react'

export type BloomMood = 'idle' | 'listening' | 'thinking' | 'talking' | 'cheer'

// Bloom the mascot: the logo's five-petal flower (components/Bloom.tsx),
// filled like the splash animation (bloom-animation.html), with a face on the
// centre. Every mood is plain CSS keyed off data-mood (`.bb` in globals.css),
// so it's cheap to animate and goes still under prefers-reduced-motion.
const PETAL = 'M100,92 C64,86 64,26 100,8 C136,26 136,86 100,92 Z'
const PETALS = [
  { angle: 0, opacity: 1 },
  { angle: 72, opacity: 0.74 },
  { angle: 144, opacity: 0.55 },
  { angle: 216, opacity: 0.55 },
  { angle: 288, opacity: 0.74 },
]

interface BloomBuddyProps {
  mood?: BloomMood
  size?: number
  still?: boolean    // no idle motion, e.g. the small avatar beside each reply
  entrance?: boolean // petals unfold on mount
  className?: string
}

export default function BloomBuddy({ mood = 'idle', size = 64, still = false, entrance = false, className = '' }: BloomBuddyProps) {
  return (
    <svg
      className={['bb', entrance && 'bb-enter', className].filter(Boolean).join(' ')}
      data-mood={mood}
      data-still={still || undefined}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <g className="bb-petals">
        {PETALS.map(({ angle, opacity }, i) => (
          <g key={angle} transform={`rotate(${angle} 100 100)`}>
            <path className="bb-petal" d={PETAL} style={{ opacity, '--i': i } as CSSProperties} />
          </g>
        ))}
      </g>
      <circle className="bb-core" cx="100" cy="100" r="32" />
      <circle className="bb-cheek" cx="82" cy="108" r="5.5" />
      <circle className="bb-cheek" cx="118" cy="108" r="5.5" />
      <g className="bb-eyes">
        <ellipse className="bb-eye" cx="90" cy="96" rx="3.8" ry="4.8" />
        <ellipse className="bb-eye" cx="110" cy="96" rx="3.8" ry="4.8" />
      </g>
      <path className="bb-eyes-happy" d="M85,98 Q90,90 95,98 M105,98 Q110,90 115,98" />
      <path className="bb-mouth-smile" d="M92,107 Q100,114.5 108,107" />
      <ellipse className="bb-mouth-talk" cx="100" cy="109" rx="5" ry="4.4" />
      <circle className="bb-mouth-o" cx="100" cy="110" r="3.2" />
      <path className="bb-mouth-grin" d="M88,105 Q100,121 112,105 Z" />
    </svg>
  )
}
