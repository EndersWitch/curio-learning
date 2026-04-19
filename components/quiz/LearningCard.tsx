'use client'

import type { LearningConcept } from '@/types/quiz'
import { CARD_STYLES } from '@/lib/learningZone'

interface LearningCardProps {
  concept: LearningConcept
  index: number
}

export default function LearningCard({ concept, index }: LearningCardProps) {
  const style = CARD_STYLES[concept.type]

  // Split multiline content (for "what tested" bullet lists)
  const lines = concept.content.split('\n').filter(Boolean)

  return (
    <div
      className={`rounded-2xl border-2 p-5 ${style.bg} ${style.border} transition-all duration-300 hover:scale-[1.01]`}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{style.icon}</span>
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">
          {style.label}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-black text-slate-800 text-base mb-2 leading-tight">
        {concept.title}
      </h3>

      {/* Content */}
      {lines.length > 1 ? (
        <ul className="space-y-1.5 mt-2">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-0.5 text-xs">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed">{concept.content}</p>
      )}

      {/* Optional example block */}
      {concept.example && (
        <div className="mt-3 bg-white/70 rounded-xl p-3 border border-white/80">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wide">
            Example
          </span>
          <p className="text-sm text-slate-700 mt-1 italic">{concept.example}</p>
        </div>
      )}
    </div>
  )
}
