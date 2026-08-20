interface BloomProps {
  size?: number
  className?: string
}

// Single petal path — tip at (32,4), base at center (32,32). Rotated 5×
// around the center at 72° increments to form the bloom.
const PETAL_D = 'M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z'

export default function Bloom({ size = 26, className = '' }: BloomProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g fill="none" stroke="#B8451F" strokeWidth="2" strokeLinejoin="round">
        <path d={PETAL_D} transform="rotate(0 32 32)" />
        <path d={PETAL_D} transform="rotate(72 32 32)" />
        <path d={PETAL_D} transform="rotate(144 32 32)" />
        <path d={PETAL_D} transform="rotate(216 32 32)" />
        <path d={PETAL_D} transform="rotate(288 32 32)" />
      </g>
      <circle cx="32" cy="32" r="4.5" fill="#A9752A" />
    </svg>
  )
}
