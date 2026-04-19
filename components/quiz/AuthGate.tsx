'use client'

import Link from 'next/link'

interface AuthGateProps {
  message?: string
  redirectAfter?: string
}

export default function AuthGate({
  message = 'Sign in to save your progress and earn XP!',
  redirectAfter,
}: AuthGateProps) {
  const loginUrl = redirectAfter
    ? `/auth/login?redirect=${encodeURIComponent(redirectAfter)}`
    : '/auth/login'

  return (
    <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 p-8 text-center">
      <div className="text-4xl mb-3">🔐</div>
      <h3 className="font-black text-slate-800 text-lg mb-2">Account Required</h3>
      <p className="text-sm text-slate-500 mb-5 max-w-xs mx-auto">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={loginUrl}
          className="px-6 py-3 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
        >
          Sign In →
        </Link>
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded-2xl font-black text-sm bg-white text-violet-700 border-2 border-violet-200 hover:border-violet-400 transition-colors"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  )
}
