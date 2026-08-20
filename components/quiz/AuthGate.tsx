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
        background: '#FBF8EF',
        border: '1px solid rgba(33,26,19,0.15)',
      }}>
      <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,69,31,0.1)', color: '#B8451F' }}>
        <Lock size={22} />
      </div>
      <h3 className="font-black text-lg mb-2" style={{ color: '#211A13' }}>
        Sign In to Continue
      </h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(33,26,19,0.6)' }}>
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={loginUrl}
          className="px-6 py-3 rounded-lg font-black text-sm text-center transition-all hover:opacity-90"
          style={{ background: '#B8451F', color: '#F6F0E2' }}>
          Sign In →
        </a>
        <a href="/login"
          className="px-6 py-3 rounded-lg font-black text-sm text-center transition-all hover:opacity-80"
          style={{
            background: 'transparent',
            color: '#211A13',
            border: '1px solid rgba(33,26,19,0.18)',
          }}>
          Create Free Account
        </a>
      </div>
    </div>
  )
}
