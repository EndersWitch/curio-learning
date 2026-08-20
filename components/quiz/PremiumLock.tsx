'use client'

import Link from 'next/link'
import { Star, Check } from '@/components/icons'

interface PremiumLockProps {
  levelTitle?: string
  compact?: boolean
}

export default function PremiumLock({ levelTitle, compact = false }: PremiumLockProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#F4ECDD', border: '1px solid rgba(169,117,42,0.3)' }}>
        <Star size={16} style={{ color: '#A9752A' }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black truncate" style={{ color: '#A9752A' }}>
            {levelTitle ?? 'Premium Level'}
          </p>
          <p className="text-xs" style={{ color: 'rgba(169,117,42,0.8)' }}>R49/month to unlock</p>
        </div>
        <Link
          href="/premium"
          className="flex-shrink-0 text-xs font-black px-3 py-1.5 rounded transition-colors"
          style={{ background: '#A9752A', color: '#F6F0E2' }}
        >
          Unlock
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border-2" style={{ borderColor: 'rgba(169,117,42,0.3)' }}>
      {/* Header */}
      <div className="px-6 py-5 text-white" style={{ background: '#A9752A' }}>
        <div className="flex items-center gap-3 mb-2">
          <Star size={20} />
          <span className="font-black text-lg">Premium Content</span>
        </div>
        {levelTitle && (
          <p className="text-sm" style={{ color: 'rgba(246,240,226,0.85)' }}>
            "<span className="font-bold">{levelTitle}</span>" is available with Premium
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="px-6 py-5" style={{ background: '#F4ECDD' }}>
        <ul className="space-y-2 mb-5">
          {[
            'All quiz levels and mastery challenges',
            'AI-powered deep explanations',
            'Progress tracking and XP',
            'Unlimited practice attempts',
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: '#8A611F' }}>
              <Check size={14} style={{ color: '#A9752A' }} />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/premium"
            className="flex-1 text-center py-3 rounded-lg font-black text-sm transition-colors"
            style={{ background: '#A9752A', color: '#F6F0E2' }}
          >
            Get Premium — R49/month
          </Link>
          <Link
            href="/quiz"
            className="flex-1 text-center py-3 rounded-lg font-black text-sm border-2 transition-colors"
            style={{ background: '#FBF8EF', color: 'rgba(33,26,19,0.6)', borderColor: 'rgba(33,26,19,0.15)' }}
          >
            Browse Free Topics
          </Link>
        </div>
      </div>
    </div>
  )
}
