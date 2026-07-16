// Shared monoline icon set — hand-written SVGs (no external icon dependency).
// Every icon shares the same visual weight: 24x24 viewBox, round caps/joins,
// currentColor stroke. Replaces emoji use across the app.

import type { SVGProps } from 'react'

export interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function base(props: IconProps) {
  const { size = 18, strokeWidth = 1.75, ...rest } = props
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    ...rest,
  }
}

export function Flame(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2c1 3-2 4.5-2 7.5a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5a6 6 0 1 1-12 0c0-4 3-5.5 3-9 0-1.2.5-2.2 1-3z" />
    </svg>
  )
}

export function Zap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  )
}

export function FileText(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6M9 9h1" />
    </svg>
  )
}

export function PenLine(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M13 4 20 11 9 22H2v-7z" />
      <path d="M11.5 5.5 18.5 12.5" />
    </svg>
  )
}

export function User(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" />
    </svg>
  )
}

export function Star(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 2.5 15 9l7 1-5 5 1.3 7L12 18.5 5.7 22 7 15 2 10l7-1z" />
    </svg>
  )
}

export function Check(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12.5 9.5 18 20 6" />
    </svg>
  )
}

export function X(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 5 19 19M19 5 5 19" />
    </svg>
  )
}

export function Lock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4.5" y="11" width="15" height="10" rx="2" />
      <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
    </svg>
  )
}

export function Search(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="M20.5 20.5 15.8 15.8" />
    </svg>
  )
}

export function ChevronRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 5 16 12 9 19" />
    </svg>
  )
}

export function ChevronLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M15 5 8 12 15 19" />
    </svg>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  )
}

export function BookOpen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 6c-1.8-1.6-4.3-2.3-8-2v14c3.7-.3 6.2.4 8 2 1.8-1.6 4.3-2.3 8-2V4c-3.7-.3-6.2.4-8 2z" />
      <path d="M12 6v14" />
    </svg>
  )
}

export function BookMarked(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 3h11a1 1 0 0 1 1 1v17l-5-3.2L8 21V4a1 1 0 0 1 1-1z" />
      <path d="M6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h2" />
    </svg>
  )
}

export function Trophy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" />
      <path d="M12 14v3M9 21h6M9.5 21c0-2 1-3 2.5-4 1.5 1 2.5 2 2.5 4" />
    </svg>
  )
}

export function GraduationCap(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 9 12 4l10 5-10 5z" />
      <path d="M6 11.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" />
      <path d="M22 9v6" />
    </svg>
  )
}

export function Target(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.8" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AlertTriangle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 22 20H2z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Lightbulb(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6.5 6.5 0 0 0-3.6 11.9c.6.4.9 1 .9 1.7v.4h5.4v-.4c0-.7.3-1.3.9-1.7A6.5 6.5 0 0 0 12 3z" />
    </svg>
  )
}

export function Eye(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function Globe(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z" />
    </svg>
  )
}

export function Brain(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7c-1.4.3-2.5 1.5-2.5 3 0 .6.2 1.1.4 1.6C3.6 12.1 3 13 3 14.2 3 15.8 4.3 17 5.8 17c.1 1.7 1.5 3 3.2 3A2.5 2.5 0 0 0 11.5 17.5V7A2.5 2.5 0 0 0 9 4.5z" />
      <path d="M15 4.5A2.5 2.5 0 0 1 17.5 7c1.4.3 2.5 1.5 2.5 3 0 .6-.2 1.1-.4 1.6.8.5 1.4 1.4 1.4 2.6 0 1.6-1.3 2.8-2.8 2.8-.1 1.7-1.5 3-3.2 3a2.5 2.5 0 0 1-2.5-2.5V7A2.5 2.5 0 0 1 15 4.5z" />
    </svg>
  )
}

export function ListChecks(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 6 1.5 1.5L7.5 4.5" />
      <path d="m3 13 1.5 1.5L7.5 11.5" />
      <path d="m3 20 1.5 1.5L7.5 18.5" />
      <path d="M11 6h10M11 13h10M11 20h10" />
    </svg>
  )
}

export function Layers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m12 3 9 5-9 5-9-5z" />
      <path d="m3 13 9 5 9-5" />
    </svg>
  )
}

export function RefreshCw(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M20 8a8 8 0 0 0-14.6-3.4M4 4v5h5" />
      <path d="M4 16a8 8 0 0 0 14.6 3.4M20 20v-5h-5" />
    </svg>
  )
}

export function Heart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20.5s-7.5-4.6-9.8-9C.6 8 1.7 4.5 5 3.5c2-.6 3.9.2 5 1.8 1.1-1.6 3-2.4 5-1.8 3.3 1 4.4 4.5 2.8 8-2.3 4.4-9.8 9-9.8 9z" />
    </svg>
  )
}

export function Home(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 11 9-7 9 7" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export function Calculator(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2" />
      <path d="M8 6.5h8" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </svg>
  )
}

export function FlaskConical(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 2h6M10 2v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V2" />
      <path d="M7.5 14.5h9" />
    </svg>
  )
}

export function Landmark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 9 9-6 9 6" />
      <path d="M4 9h16v2H4zM6 11v8M10 11v8M14 11v8M18 11v8" />
      <path d="M3 21h18" />
    </svg>
  )
}

export function Briefcase(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  )
}

export function Cog(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v2.2M12 18.8V21M4.9 7.5l1.9 1.1M17.2 15.4l1.9 1.1M3 12h2.2M18.8 12H21M4.9 16.5l1.9-1.1M17.2 8.6l1.9-1.1M7.5 19.1l1.1-1.9M15.4 6.8l1.1-1.9M9.5 4.9l.6-2M14 4.9l-.6-2" />
    </svg>
  )
}

export function TrendingUp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m3 16 6-6 4 4 8-9" />
      <path d="M15 5h6v6" />
    </svg>
  )
}
