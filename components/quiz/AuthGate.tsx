'use client'

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
    ? `/login.html?redirect=${encodeURIComponent(redirectAfter)}`
    : '/login.html'

  return (
    <div className="rounded-3xl p-8 text-center"
      style={{
        background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)',
        border: '2px solid rgba(109,211,206,0.2)',
      }}>
      <div className="text-4xl mb-3">🔐</div>
      <h3 className="font-black text-lg mb-2" style={{ color: '#F7F7FF' }}>
        Sign In to Continue
      </h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: '#c4b8d8' }}>
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={loginUrl}
          className="px-6 py-3 rounded-2xl font-black text-sm text-white text-center transition-all hover:opacity-90"
          style={{ background: '#FF5E5B', boxShadow: '0 4px 16px rgba(255,94,91,0.35)' }}>
          Sign In →
        </a>
        <a href="/login.html"
          className="px-6 py-3 rounded-2xl font-black text-sm text-center transition-all hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: '#F7F7FF',
            border: '1px solid rgba(255,255,255,0.15)',
          }}>
          Create Free Account
        </a>
      </div>
    </div>
  )
}
