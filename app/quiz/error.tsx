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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F6F0E2' }}>
      <div className="text-center max-w-sm w-full rounded-lg p-8" style={{ background: '#FBF8EF', border: '1px solid rgba(156,52,40,0.25)' }}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(156,52,40,0.1)', color: '#9C3428' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#211A13' }}>Something went wrong</h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'rgba(33,26,19,0.55)' }}>
          {error.message ?? 'An unexpected error occurred. Your progress has been saved.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm transition-colors"
            style={{ background: '#B8451F', color: '#F6F0E2' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm transition-colors"
            style={{ background: 'transparent', color: '#211A13', border: '1px solid rgba(33,26,19,0.15)' }}
          >
            <ChevronLeft size={15} /> Back to Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
