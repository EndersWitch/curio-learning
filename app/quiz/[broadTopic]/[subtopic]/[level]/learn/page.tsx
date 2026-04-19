import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { toDisplayName } from '@/lib/displayName'
import LearningCard from '@/components/quiz/LearningCard'
import { buildLearningZone } from '@/lib/learningZone'
import type { QuizLevel } from '@/types/quiz'

interface Props {
  params: { broadTopic: string; subtopic: string; level: string }
}

export default async function LearningZonePage({ params }: Props) {
  const supabase = createServerClient()

  const { data: level, error } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('id', params.level)
    .single()

  if (error || !level) notFound()

  const cards    = buildLearningZone(level as QuizLevel)
  const playHref = `/quiz/${params.broadTopic}/${params.subtopic}/${params.level}/play`
  const backHref = `/quiz/${params.broadTopic}`
  const isMastery = level.section_type === 'subtopic_mastery' || level.section_type === 'broad_topic_mastery'

  const headerBg = isMastery
    ? 'linear-gradient(135deg, #3d2200 0%, #7a4500 100%)'
    : 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)'

  const accentColor = isMastery ? '#F5C842' : '#6DD3CE'

  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>

      {/* Header */}
      <div style={{ background: headerBg }}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link href={backHref}
            className="inline-flex items-center gap-1 text-xs font-semibold mb-5 transition-opacity hover:opacity-70"
            style={{ color: accentColor }}>
            ← Back
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black uppercase tracking-widest"
              style={{ color: accentColor }}>
              {isMastery ? '🏆 Mastery Challenge' : `Level ${level.level_number}`}
              {' · '}{level.question_count} questions
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mb-2" style={{ color: '#F7F7FF' }}>
            {level.title}
          </h1>

          <div className="flex items-center gap-3 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <span style={{ color: '#F5C842' }}>⚡ +{level.xp_reward} XP</span>
            {level.difficulty && (
              <span>
                {level.difficulty === 'easy' ? '🟢 Beginner'
                  : level.difficulty === 'medium' ? '🟡 Intermediate'
                  : '🔴 Hard'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Learning zone divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ color: accentColor, background: 'rgba(109,211,206,0.08)', border: `1px solid ${accentColor}30` }}>
            📖 Learning Zone
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Concept cards */}
        <div className="space-y-4 mb-8">
          {cards.map((card, i) => (
            <LearningCard key={i} concept={card} index={i} />
          ))}
        </div>

        {/* Ready CTA */}
        <div className="rounded-3xl p-7 text-center"
          style={{ background: '#231935', border: `1px solid ${accentColor}30` }}>
          <div className="text-4xl mb-3">{isMastery ? '🏆' : '🚀'}</div>
          <h2 className="text-xl font-black mb-2" style={{ color: '#F7F7FF' }}>
            {isMastery ? 'Ready for the challenge?' : 'Got it! Ready to quiz?'}
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9b8ab0' }}>
            {level.question_count} questions · Pass to{' '}
            {isMastery ? 'earn your mastery badge' : 'unlock the next level'}
          </p>

          <Link href={playHref}
            className="inline-block w-full py-4 rounded-2xl font-black text-lg text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: '#FF5E5B', boxShadow: '0 6px 24px rgba(255,94,91,0.4)' }}>
            {isMastery ? '⚡ Start Mastery Quiz' : "Let's Go! →"}
          </Link>

          <p className="text-xs mt-3" style={{ color: '#9b8ab0' }}>
            You can retry as many times as you need
          </p>
        </div>
      </div>
    </div>
  )
}
