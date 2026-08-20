'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, ChevronLeft } from '@/components/icons'

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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--paper)' }}>
      <div className="text-center max-w-sm w-full rounded-lg p-8" style={{ background: 'var(--paper-raised)', border: '1px solid rgba(var(--brick-rgb),0.25)' }}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(var(--brick-rgb),0.1)', color: 'var(--brick)' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: 'var(--ink)' }}>Something went wrong</h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
          {error.message ?? 'An unexpected error occurred. Your progress has been saved.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm transition-colors"
            style={{ background: 'var(--rust)', color: 'var(--paper)' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm transition-colors"
            style={{ background: 'transparent', color: 'var(--ink)', border: '1px solid rgba(var(--ink-rgb),0.15)' }}
          >
            <ChevronLeft size={15} /> Back to Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
