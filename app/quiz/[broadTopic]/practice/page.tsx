import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

interface Props {
  params: { broadTopic: string }
}

export default async function GeneralPracticePage({ params }: Props) {
  const supabase = createServerClient()
  const broadTopicSlug = decodeURIComponent(params.broadTopic)

  // Find the general practice level for this broad topic
  const { data: practiceLevel } = await supabase
    .from('quiz_levels')
    .select('*')
    .eq('broad_topic', broadTopicSlug)
    .eq('section_type', 'general_practice')
    .limit(1)
    .single()

  if (!practiceLevel) notFound()

  const learnHref = `/quiz/${params.broadTopic}/general/${practiceLevel.id}/learn`

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-violet-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-3xl shadow-lg shadow-cyan-200">
          🎯
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">General Practice</h1>
        <p className="text-slate-500 text-sm mb-1">
          <span className="font-semibold">{broadTopicSlug}</span>
        </p>
        <p className="text-slate-400 text-sm mb-6">
          A mixed set of questions from across the whole topic. Great for revision!
        </p>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-sm">📝</span>
            <span className="text-sm text-slate-700 font-semibold">{practiceLevel.question_count} mixed questions</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm">⚡</span>
            <span className="text-sm text-slate-700 font-semibold">+{practiceLevel.xp_reward} XP on completion</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm">🔄</span>
            <span className="text-sm text-slate-700 font-semibold">Questions shuffle every attempt</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm">🔓</span>
            <span className="text-sm text-slate-700 font-semibold">No prerequisites — always available</span>
          </div>
        </div>

        <Link
          href={learnHref}
          className="block w-full py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg shadow-cyan-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
        >
          Start Practice →
        </Link>

        <Link
          href={`/quiz/${params.broadTopic}`}
          className="block mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Back to {broadTopicSlug}
        </Link>
      </div>
    </div>
  )
}
