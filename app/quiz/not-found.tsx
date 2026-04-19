import Link from 'next/link'

export default function QuizNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Topic Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">
          We couldn't find that quiz topic. It may have been moved or doesn't exist yet.
        </p>
        <Link
          href="/quiz"
          className="inline-block px-6 py-3 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
        >
          ← Browse All Topics
        </Link>
      </div>
    </div>
  )
}
