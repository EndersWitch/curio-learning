import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import LearningCard from '@/components/quiz/LearningCard'
import { buildLearningZone } from '@/lib/learningZone'
import type { QuizLevel } from '@/types/quiz'

interface Props {
  params: {
    broadTopic: string
    subtopic: string
    level: string
  }
}

export default async function LearningZonePage({ params }: Props) {
  const supabase = createServerClient()
  const levelId = params.level

  const { data: level, error } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('id', levelId)
    .single()

  if (error || !level) notFound()

  const cards = buildLearningZone(level as QuizLevel)

  const playHref = `/quiz/${params.broadTopic}/${params.subtopic}/${levelId}/play`
  const backHref = `/quiz/${params.broadTopic}`

  const isMastery =
    level.section_type === 'subtopic_mastery' ||
    level.section_type === 'broad_topic_mastery'

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Header */}
      <div
        className={`text-white ${
          isMastery
            ? 'bg-gradient-to-r from-amber-500 to-orange-500'
            : 'bg-gradient-to-r from-violet-700 to-indigo-700'
        }`}
      >
        <div className="max-w-2xl mx-auto px-6 py-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs text-white/70 font-semibold mb-4 hover:text-white transition-colors"
          >
            ← Back
          </Link>

          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isMastery ? 'text-amber-100' : 'text-violet-300'
              }`}
            >
              {isMastery ? '🏆 Mastery Challenge' : `Level ${level.level_number}`} ·{' '}
              {level.question_count} questions
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mb-2">{level.title}</h1>

          <div className="flex items-center gap-3 text-sm text-white/80">
            <span>⚡ +{level.xp_reward} XP</span>
            {level.difficulty && (
              <span>
                {level.difficulty === 'easy'
                  ? '🟢 Beginner'
                  : level.difficulty === 'medium'
                  ? '🟡 Intermediate'
                  : '🔴 Hard'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Learning zone label */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-3 py-1 bg-white rounded-full border border-slate-200">
            📖 Learning Zone
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Concept cards */}
        <div className="space-y-4 mb-8">
          {cards.map((card, i) => (
            <LearningCard key={i} concept={card} index={i} />
          ))}
        </div>

        {/* Ready CTA */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-lg p-7 text-center">
          <div className="text-4xl mb-3">
            {isMastery ? '🏆' : '🚀'}
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            {isMastery ? 'Ready for the challenge?' : 'Got it! Ready to quiz?'}
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            {level.question_count} questions · Pass to{' '}
            {isMastery ? 'earn your mastery badge' : 'unlock the next level'}
          </p>

          <Link
            href={playHref}
            className="inline-block w-full py-4 rounded-2xl font-black text-lg text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xl shadow-violet-200 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
          >
            {isMastery ? '⚡ Start Mastery Quiz' : "Let's Go! →"}
          </Link>

          <p className="text-xs text-slate-400 mt-3">
            You can retry as many times as you need
          </p>
        </div>
      </div>
    </div>
  )
}
