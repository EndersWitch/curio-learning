'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/useAuth'
import { XPBadge, StreakBadge } from '@/components/ui/XPBar'

export default function QuizNav() {
  const { isLoggedIn, profile, loading } = useAuth()

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-plum text-base tracking-tight"
        >
          {/* Bloom logo — native SVG, never PNG */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <ellipse cx="14" cy="7"  rx="5" ry="7" fill="#6DD3CE" opacity="0.85" transform="rotate(0  14 14)" />
            <ellipse cx="14" cy="7"  rx="5" ry="7" fill="#FF5E5B" opacity="0.75" transform="rotate(72  14 14)" />
            <ellipse cx="14" cy="7"  rx="5" ry="7" fill="#F5C842" opacity="0.75" transform="rotate(144 14 14)" />
            <ellipse cx="14" cy="7"  rx="5" ry="7" fill="#A855F7" opacity="0.75" transform="rotate(216 14 14)" />
            <ellipse cx="14" cy="7"  rx="5" ry="7" fill="#6DD3CE" opacity="0.75" transform="rotate(288 14 14)" />
            <circle  cx="14" cy="14" r="4"  fill="#FF5E5B" />
          </svg>
          <span className="text-plum-800">curio</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-6 rounded-full bg-slate-100 animate-pulse" />
          ) : isLoggedIn && profile ? (
            <>
              {profile.streak > 0 && <StreakBadge streak={profile.streak} />}
              <XPBadge xp={profile.total_xp} size="sm" />
              <Link
                href="/profile"
                className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-black text-violet-700 hover:bg-violet-200 transition-colors"
              >
                {(profile.display_name ?? 'U')[0].toUpperCase()}
              </Link>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-xs font-black px-4 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
