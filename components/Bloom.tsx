interface BloomProps {
  size?: number
  className?: string
  tone?: 'rust' | 'moss' | 'ochre' | 'paper'
}

// Single petal path — tip at (32,4), base at center (32,32). Rotated 5×
// around the center at 72° increments to form the bloom.
const PETAL_D = 'M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z'

const TONES = {
  rust: 'var(--rust)',
  moss: 'var(--moss)',
  ochre: 'var(--ochre)',
  paper: 'var(--paper)',
}

export default function Bloom({ size = 26, className = '', tone = 'rust' }: BloomProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g fill="none" stroke={TONES[tone]} strokeWidth="2" strokeLinejoin="round">
        <path d={PETAL_D} transform="rotate(0 32 32)" />
        <path d={PETAL_D} transform="rotate(72 32 32)" />
        <path d={PETAL_D} transform="rotate(144 32 32)" />
        <path d={PETAL_D} transform="rotate(216 32 32)" />
        <path d={PETAL_D} transform="rotate(288 32 32)" />
      </g>
      <circle cx="32" cy="32" r="4.5" fill={tone === 'paper' ? 'var(--paper)' : 'var(--ochre)'} />
    </svg>
  )
}
