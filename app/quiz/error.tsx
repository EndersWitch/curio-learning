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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
      <div className="text-center max-w-sm w-full rounded-3xl p-8" style={{ background: '#231935', border: '1px solid rgba(255,94,91,0.2)' }}>
        <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,94,91,0.12)', color: '#FF5E5B' }}>
          <AlertTriangle size={28} />
        </div>
        <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>Something went wrong</h2>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: '#9b8ab0' }}>
          {error.message ?? 'An unexpected error occurred. Your progress has been saved.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-colors"
            style={{ background: '#FF5E5B' }}
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/quiz"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: '#F7F7FF', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <ChevronLeft size={15} /> Back to Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
