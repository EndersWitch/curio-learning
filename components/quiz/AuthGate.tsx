'use client'

import { Lock } from '@/components/icons'

interface AuthGateProps {
  message?: string
  redirectAfter?: string
}

export default function AuthGate({
  message = 'Sign in to save your progress and earn XP!',
  redirectAfter,
}: AuthGateProps) {
  // Always use the existing login.html page — never /auth/login
  const loginUrl = redirectAfter
    ? `/login?redirect=${encodeURIComponent(redirectAfter)}`
    : '/login'

  return (
    <div className="rounded-lg p-8 text-center"
      style={{
        background: 'var(--paper-raised)',
        border: '1px solid rgba(var(--ink-rgb),0.15)',
      }}>
      <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(var(--rust-rgb),0.1)', color: 'var(--rust)' }}>
        <Lock size={22} />
      </div>
      <h3 className="font-black text-lg mb-2" style={{ color: 'var(--ink)' }}>
        Sign In to Continue
      </h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}>
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={loginUrl}
          className="px-6 py-3 rounded-lg font-black text-sm text-center transition-all hover:opacity-90"
          style={{ background: 'var(--rust)', color: 'var(--paper)' }}>
          Sign In →
        </a>
        <a href="/login"
          className="px-6 py-3 rounded-lg font-black text-sm text-center transition-all hover:opacity-80"
          style={{
            background: 'transparent',
            color: 'var(--ink)',
            border: '1px solid rgba(var(--ink-rgb),0.18)',
          }}>
          Create Free Account
        </a>
      </div>
    </div>
  )
}
