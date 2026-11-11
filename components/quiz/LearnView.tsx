import Link from 'next/link'
import LearningCard from '@/components/quiz/LearningCard'
import type { LearningConcept } from '@/types/quiz'
import { BookOpen, ArrowRight } from '@/components/icons'

// The Learning Zone screen. Plain (no hooks) so the server can render it for
// free lessons — putting the lesson text in the page's HTML — and
// PremiumLearn can render it in the browser once a subscriber is confirmed.
export default function LearnView({
  title, levelOrder, questionCount, cards, backHref, playHref, context, guide,
}: {
  title: string
  levelOrder: number
  questionCount: number
  cards: LearningConcept[]
  backHref: string
  playHref: string
  context?: string                         // e.g. "Grade 4 English Home Language · Parts of Speech · Nouns"
  guide?: { href: string; label: string }  // the CAPS subject guide this lesson belongs to
}) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--paper)' }}>
      <div style={{ background: 'var(--paper-dim)' }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href={backHref}
            className="inline-flex items-center gap-1 text-xs font-semibold mb-4 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--rust)' }}>← Back</Link>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: 'var(--rust)' }}>
            Level {levelOrder} · {questionCount} questions
          </p>
          <h1 className="text-2xl font-black" style={{ color: 'var(--ink)' }}>{title}</h1>
          {context && (
            <p className="text-sm mt-1" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>{context}</p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(var(--ink-rgb),0.1)' }} />
          <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: 'var(--rust)', background: 'rgba(var(--rust-rgb),0.08)', border: '1px solid rgba(var(--rust-rgb),0.2)' }}>
            <BookOpen size={13} /> Learning Zone
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(var(--ink-rgb),0.1)' }} />
        </div>

        <div className="space-y-4 mb-8">
          {cards.map((card, i) => <LearningCard key={i} concept={card} index={i} />)}
        </div>

        <div className="rounded p-7 text-center"
          style={{ background: 'var(--paper-raised)', border: '1px solid rgba(var(--rust-rgb),0.15)' }}>
          <h2 className="text-xl font-black mb-2" style={{ color: 'var(--ink)' }}>Ready to quiz?</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
            {questionCount} questions · You can retry as many times as you like
          </p>
          <Link href={playHref}
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded font-black text-lg text-white"
            style={{ background: 'var(--rust)' }}>
            Let&apos;s Go <ArrowRight size={20} />
          </Link>
        </div>

        {guide && (
          <p className="text-sm mt-6 text-center" style={{ color: 'rgba(var(--ink-rgb),0.55)' }}>
            Part of the CAPS curriculum for{' '}
            <a href={guide.href} style={{ color: 'var(--rust)', fontWeight: 600 }}>{guide.label} →</a>
          </p>
        )}
      </div>
    </div>
  )
}
