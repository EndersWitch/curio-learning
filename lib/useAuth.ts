'use client'

// Re-export from auth-context so existing imports of useAuth still work.
// All auth state now flows through AuthProvider in the quiz layout.
export { useAuth } from '@/lib/auth-context'
export type { CurioUser } from '@/lib/auth-context'
