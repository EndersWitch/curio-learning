export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50">
      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-violet-800 h-52" />

      {/* Filter bar skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-14 rounded-full bg-slate-200 animate-pulse" />
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <div className="h-28 bg-slate-200 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-4 w-3/4 rounded bg-slate-200 animate-pulse" />
              <div className="h-3 w-full rounded bg-slate-100 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
              <div className="h-2.5 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
