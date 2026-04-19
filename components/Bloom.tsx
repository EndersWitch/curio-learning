interface BloomProps {
  size?: number
  className?: string
}

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
      <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" />
      <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(72 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(144 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(216 32 32)" />
      <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(288 32 32)" />
      <circle cx="32" cy="32" r="7" fill="#FF5E5B" />
    </svg>
  )
}
