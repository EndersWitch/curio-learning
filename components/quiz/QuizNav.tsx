'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'

export default function QuizNav() {
  const { isLoggedIn, profile, loading } = useAuth()

  return (
    <header style={{ background: '#2B1E3F', borderBottom: '1px solid rgba(109,211,206,0.15)' }}
      className="sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        {/* Logo + wordmark — links back to main site */}
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <svg width="28" height="28" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE"/>
            <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(72 100 100)"/>
            <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(144 100 100)"/>
            <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.5" transform="rotate(216 100 100)"/>
            <ellipse cx="100" cy="50" rx="22" ry="42" fill="#6DD3CE" fillOpacity="0.7" transform="rotate(288 100 100)"/>
            <circle cx="100" cy="100" r="22" fill="#FF5E5B"/>
          </svg>
          <span className="font-black text-sm tracking-tight" style={{ color: '#F7F7FF' }}>
            curio <span style={{ color: '#6DD3CE' }}>learning</span>
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-7 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
          ) : isLoggedIn && profile ? (
            <>
              {/* XP badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}>
                ⚡ {(profile.total_xp ?? 0).toLocaleString()} XP
              </div>

              {/* Streak */}
              {(profile.streak ?? 0) > 0 && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-black"
                  style={{ background: 'rgba(255,94,91,0.15)', color: '#FF5E5B' }}>
                  🔥 {profile.streak}
                </div>
              )}

              {/* Avatar — links to profile page */}
              <a href="/profile.html"
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-opacity hover:opacity-80"
                style={{ background: '#FF5E5B', color: '#fff' }}>
                {(profile.display_name ?? 'U')[0].toUpperCase()}
              </a>
            </>
          ) : (
            /* Points to existing login.html — NOT /auth/login */
            <a href="/login.html"
              className="text-xs font-black px-4 py-2 rounded-xl transition-all hover:opacity-90"
              style={{ background: '#FF5E5B', color: '#fff', boxShadow: '0 2px 12px rgba(255,94,91,0.35)' }}>
              Sign In
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
