export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      <div className="bg-gradient-to-r from-indigo-700 to-violet-700 h-44" />
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />
            <div className="flex-1 rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
              <div className="h-3 w-1/4 rounded bg-slate-200 animate-pulse mb-2" />
              <div className="h-4 w-2/3 rounded bg-slate-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
