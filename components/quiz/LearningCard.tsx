'use client'

import type { LearningConcept } from '@/types/quiz'

interface LearningCardProps {
  concept: LearningConcept
  index: number
}

// Dark-theme card styles that match Curio's #231935 card background
const CARD_STYLES: Record<
  LearningConcept['type'],
  { accent: string; iconBg: string; labelColor: string; borderColor: string; icon: string; label: string }
> = {
  key_rule: {
    accent:      '#6DD3CE',
    iconBg:      'rgba(109,211,206,0.12)',
    labelColor:  '#6DD3CE',
    borderColor: 'rgba(109,211,206,0.25)',
    icon:        '🔑',
    label:       'Key Rule',
  },
  did_you_know: {
    accent:      '#F5C842',
    iconBg:      'rgba(245,200,66,0.12)',
    labelColor:  '#F5C842',
    borderColor: 'rgba(245,200,66,0.25)',
    icon:        '✨',
    label:       'Did You Know?',
  },
  example: {
    accent:      '#FF5E5B',
    iconBg:      'rgba(255,94,91,0.12)',
    labelColor:  '#FF5E5B',
    borderColor: 'rgba(255,94,91,0.25)',
    icon:        '📝',
    label:       'Example',
  },
  tip: {
    accent:      '#6DD3CE',
    iconBg:      'rgba(109,211,206,0.10)',
    labelColor:  '#6DD3CE',
    borderColor: 'rgba(109,211,206,0.2)',
    icon:        '💡',
    label:       'Quick Tip',
  },
  common_mistake: {
    accent:      '#FF5E5B',
    iconBg:      'rgba(255,94,91,0.12)',
    labelColor:  '#FF5E5B',
    borderColor: 'rgba(255,94,91,0.3)',
    icon:        '⚠️',
    label:       'Common Mistake',
  },
  spot_difference: {
    accent:      '#F5C842',
    iconBg:      'rgba(245,200,66,0.10)',
    labelColor:  '#F5C842',
    borderColor: 'rgba(245,200,66,0.2)',
    icon:        '🔍',
    label:       'Spot the Difference',
  },
  what_tested: {
    accent:      '#c4b8d8',
    iconBg:      'rgba(196,184,216,0.10)',
    labelColor:  '#c4b8d8',
    borderColor: 'rgba(196,184,216,0.2)',
    icon:        '🎯',
    label:       "What You'll Be Tested On",
  },
}

export default function LearningCard({ concept, index }: LearningCardProps) {
  const s = CARD_STYLES[concept.type] ?? CARD_STYLES.key_rule
  const lines = concept.content.split('\n').filter(Boolean)

  return (
    <div
      className="rounded-2xl p-5 transition-transform duration-200 hover:scale-[1.01]"
      style={{
        background: '#231935',
        border: `1.5px solid ${s.borderColor}`,
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: s.iconBg }}>
          {s.icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: s.labelColor }}>
          {s.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>

      {/* Content */}
      {lines.length > 1 ? (
        <ul className="space-y-2 mt-1">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: '#c4b8d8' }}>
              <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: s.accent, minWidth: '6px' }} />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm leading-relaxed" style={{ color: '#c4b8d8' }}>
          {concept.content}
        </p>
      )}

      {/* Optional example block */}
      {concept.example && (
        <div className="mt-3 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-xs font-black uppercase tracking-wide" style={{ color: s.labelColor }}>
            Example
          </span>
          <p className="text-sm mt-1 italic" style={{ color: '#c4b8d8' }}>{concept.example}</p>
        </div>
      )}
    </div>
  )
}
