'use client'

import Link from 'next/link'

interface PremiumLockProps {
  levelTitle?: string
  compact?: boolean
}

export default function PremiumLock({ levelTitle, compact = false }: PremiumLockProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
        <span className="text-base">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-amber-800 truncate">
            {levelTitle ?? 'Premium Level'}
          </p>
          <p className="text-xs text-amber-600">R49/month to unlock</p>
        </div>
        <Link
          href="/premium"
          className="flex-shrink-0 text-xs font-black px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          Unlock
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-3xl overflow-hidden border-2 border-amber-200">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✨</span>
          <span className="font-black text-lg">Premium Content</span>
        </div>
        {levelTitle && (
          <p className="text-amber-100 text-sm">
            "<span className="font-bold">{levelTitle}</span>" is available with Premium
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="bg-amber-50 px-6 py-5">
        <ul className="space-y-2 mb-5">
          {[
            'All quiz levels and mastery challenges',
            'AI-powered deep explanations',
            'Progress tracking and XP',
            'Unlimited practice attempts',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-amber-800">
              <span className="text-amber-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/premium"
            className="flex-1 text-center py-3 rounded-2xl font-black text-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200"
          >
            Get Premium — R49/month
          </Link>
          <Link
            href="/quiz"
            className="flex-1 text-center py-3 rounded-2xl font-black text-sm bg-white text-slate-600 border-2 border-slate-200 hover:border-amber-300 transition-colors"
          >
            Browse Free Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
