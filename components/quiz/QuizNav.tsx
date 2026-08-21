'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'
import { useAccountDrawer } from '@/components/AccountDrawerProvider'
import { Flame, Zap, FileText, PenLine, User, Star } from '@/components/icons'
import Bloom from '@/components/Bloom'
import ThemeToggle from '@/components/ThemeToggle'

export default function QuizNav() {
  const { user, loading } = useAuth()
  const { openDrawer } = useAccountDrawer()
  const ddRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside — same as homepage
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        document.getElementById('profileDD')?.classList.remove('open')
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function doLogout() {
    await sb.auth.signOut()
    window.location.href = '/'
  }

  const initial = user?.fullName?.[0]?.toUpperCase() ?? '?'

  return (
    <nav className="curio-nav">
      <a href="/" className="nav-logo">
        <Bloom size={26} />
        curio
      </a>

      <ul className="nav-links">
        <li><a href="/papers">Papers</a></li>
        <li><a href="/quiz">Quiz</a></li>
        <li><a href="/subjects">Subjects</a></li>
        <li><a href="/subscription">Subscription</a></li>
      </ul>

      <div className="nav-right">
        {loading ? (
          <div style={{ width: 80, height: 28, borderRadius: 4, background: 'rgba(var(--ink-rgb),0.06)' }} />
        ) : user ? (
          <div className="profile-wrap" ref={ddRef} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {user.streakDays > 0 && (
              <span title="Day streak" style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.78rem', fontWeight: 700, color: 'var(--ochre)',
                background: 'rgba(var(--ochre-rgb),0.12)', border: '1px solid rgba(var(--ochre-rgb),0.3)',
                borderRadius: 4, padding: '0.3rem 0.65rem',
              }}>
                <Flame size={14} /> {user.streakDays}
              </span>
            )}
            <span title="Total XP" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.78rem', fontWeight: 700, color: 'var(--rust)',
              background: 'rgba(var(--rust-rgb),0.1)', border: '1px solid rgba(var(--rust-rgb),0.3)',
              borderRadius: 4, padding: '0.3rem 0.65rem',
            }}>
              <Zap size={14} /> {user.totalXp.toLocaleString()} XP
            </span>
            <button
              className="profile-btn"
              onClick={(e) => {
                e.stopPropagation()
                document.getElementById('profileDD')?.classList.toggle('open')
              }}>
              {initial}
            </button>
            <div className="profile-dropdown" id="profileDD">
              <div className="profile-dd-head">
                <div className="profile-dd-name">{user.fullName}</div>
                <div className="profile-dd-email">{user.email}</div>
              </div>
              <a href="/papers" className="profile-dd-item dd-item-icon"><FileText size={15} /> Papers</a>
              <a href="/quiz" className="profile-dd-item dd-item-icon"><PenLine size={15} /> Start a quiz</a>
              <button
                className="profile-dd-item dd-item-icon"
                onClick={() => { document.getElementById('profileDD')?.classList.remove('open'); openDrawer() }}
              >
                <User size={15} /> Edit profile
              </button>
              <a href="/subscription" className="profile-dd-item dd-item-icon"><Star size={15} /> Manage subscription</a>
              <div className="profile-dd-item dd-item-theme">
                <span>Theme</span>
                <ThemeToggle />
              </div>
              <button className="profile-dd-item danger" onClick={doLogout}>Sign out</button>
            </div>
          </div>
        ) : (
          <>
            <a href="/login" className="btn-ghost">Log in</a>
            <a href="/login?tab=signup" className="btn-nav">Start free →</a>
          </>
        )}
      </div>
    </nav>
  )
}
