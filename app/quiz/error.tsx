'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error tracking in production
    console.error('[Quiz Error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-rose-100 flex items-center justify-center text-3xl">
          😕
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6 leading-relaxed">
          {error.message ?? 'An unexpected error occurred. Your progress has been saved.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
          >
            Try Again
          </button>
          <Link
            href="/quiz"
            className="px-6 py-3 rounded-2xl font-black text-sm bg-white text-slate-700 border-2 border-slate-200 hover:border-violet-300 transition-colors"
          >
            ← Back to Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
