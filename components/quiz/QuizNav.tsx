'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/useAuth'
import { sb } from '@/lib/supabase'

export default function QuizNav() {
  const { isLoggedIn, userId, loading } = useAuth()

  async function doLogout() {
    await sb.auth.signOut()
    window.location.href = '/'
  }

  return (
    <header style={{ background: '#2B1E3F', borderBottom: '1px solid rgba(109,211,206,0.15)' }}
      className="sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between gap-4">

        <a href="/" className="flex items-center gap-2.5 no-underline">
          <svg width="28" height="28" viewBox="0 0 200 200" fill="none">
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

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-7 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
          ) : isLoggedIn && userId ? (
            <NavUser userId={userId} onLogout={doLogout} />
          ) : (
            <a href="/login"
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

function NavUser({ userId, onLogout }: { userId: string; onLogout: () => void }) {
  const [userData, setUserData] = useState({ displayName: 'Account', initial: '?', email: '' })

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      const name = session.user.user_metadata?.full_name || ''
      const email = session.user.email || ''
      setUserData({
        displayName: name.split(' ')[0] || 'Account',
        initial: (name[0] || email[0] || '?').toUpperCase(),
        email,
      })
    })
  }, [userId])

  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:block text-xs font-semibold" style={{ color: '#c4b8d8' }}>
        {userData.displayName}
      </span>
      <div className="relative">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: '#FF5E5B', color: '#fff' }}
          onClick={() => document.getElementById('quizNavDD')?.classList.toggle('open')}
        >
          {userData.initial}
        </button>
        <div id="quizNavDD"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#3d2d58', border: '1px solid rgba(109,211,206,0.2)',
            borderRadius: '12px', minWidth: '180px', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            display: 'none', flexDirection: 'column', overflow: 'hidden', zIndex: 300,
          }}
          className="[&.open]:flex"
        >
          <div style={{ padding: '0.8rem 1rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs font-black" style={{ color: '#F7F7FF' }}>{userData.displayName}</div>
            <div className="text-xs" style={{ color: '#9b8ab0' }}>{userData.email}</div>
          </div>
          <a href="/" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#c4b8d8', display: 'block' }}
            className="hover:bg-white/5 transition-colors">🏠 Home</a>
          <a href="/papers.html" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#c4b8d8', display: 'block' }}
            className="hover:bg-white/5 transition-colors">📄 Papers</a>
          <button onClick={onLogout}
            style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', color: '#FF5E5B', display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            className="hover:bg-white/5 transition-colors">Sign out</button>
        </div>
      </div>
    </div>
  )
}
