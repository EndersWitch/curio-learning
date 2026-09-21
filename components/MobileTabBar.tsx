'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Home, FileText, PenLine, GraduationCap, Star } from '@/components/icons'

// Phone-only bottom navigation (hidden ≥761px via CSS). The desktop top-nav
// links are hidden on phones, so this is the primary way around the site
// there — thumb-reachable, like a native app.
const TABS = [
  { href: '/', label: 'Home', Icon: Home, match: (p: string) => p === '/' },
  { href: '/papers', label: 'Papers', Icon: FileText, match: (p: string) => p.startsWith('/papers') },
  { href: '/quiz', label: 'Quiz', Icon: PenLine, match: (p: string) => p.startsWith('/quiz') },
  { href: '/subjects', label: 'Subjects', Icon: GraduationCap, match: (p: string) => p.startsWith('/subjects') },
  { href: '/subscription', label: 'Plans', Icon: Star, match: (p: string) => p.startsWith('/subscription') },
]

// Routes where a persistent tab bar would get in the way: the auth screen
// and the focused quiz-taking / lesson flows (they have their own exit).
function isHidden(pathname: string) {
  if (pathname.startsWith('/login')) return true
  return /^\/quiz\/[^/]+\/[^/]+\/(play|learn)/.test(pathname)
}

export default function MobileTabBar() {
  const pathname = usePathname() || '/'
  const hidden = isHidden(pathname)

  // Reserve room at the bottom of the page so content never sits under the bar.
  useEffect(() => {
    document.body.classList.toggle('has-mtab', !hidden)
    return () => document.body.classList.remove('has-mtab')
  }, [hidden])

  if (hidden) return null

  return (
    <nav className="mtab" aria-label="Main">
      {TABS.map(({ href, label, Icon, match }) => {
        const active = match(pathname)
        return (
          <a key={href} href={href} className={`mtab-item${active ? ' active' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={22} />
            <span>{label}</span>
          </a>
        )
      })}
    </nav>
  )
}
