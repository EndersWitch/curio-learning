'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { sb } from '@/lib/supabase'

export default function QuizNav() {
  const { user, loading } = useAuth()
  const ddRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside — same as homepage
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        ddRef.current.classList.remove('open')
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
        <svg width="26" height="26" viewBox="0 0 64 64" fill="none">
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE"/>
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(72 32 32)"/>
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(144 32 32)"/>
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(216 32 32)"/>
          <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(288 32 32)"/>
          <circle cx="32" cy="32" r="7" fill="#FF5E5B"/>
        </svg>
        curio
      </a>

      <ul className="nav-links">
        <li><a href="/papers.html">Papers</a></li>
        <li><a href="/quiz">Quiz</a></li>
        <li><a href="/subjects">Subjects</a></li>
        <li><a href="/#pricing">Pricing</a></li>
      </ul>

      <div className="nav-right">
        {loading ? (
          <div style={{ width: 80, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)' }} />
        ) : user ? (
          <div className="profile-wrap" ref={ddRef}>
            <button
              className="profile-btn"
              onClick={(e) => {
                e.stopPropagation()
                ddRef.current?.classList.toggle('open')
              }}>
              {initial}
            </button>
            <div className="profile-dropdown" id="profileDD">
              <div className="profile-dd-head">
                <div className="profile-dd-name">{user.fullName}</div>
                <div className="profile-dd-email">{user.email}</div>
              </div>
              <a href="/papers.html" className="profile-dd-item">📄 &nbsp;Papers</a>
              <a href="/quiz" className="profile-dd-item">📝 &nbsp;Start a quiz</a>
              <a href="/profile" className="profile-dd-item">👤 &nbsp;Edit profile</a>
              <a href="/subscription" className="profile-dd-item">⭐ &nbsp;Manage subscription</a>
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
