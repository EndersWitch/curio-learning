export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#F6F0E2' }}>
      {/* Hero skeleton */}
      <div className="h-52" style={{ background: '#EAE0C6' }} />

      {/* Filter bar skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-14 rounded-full animate-pulse" style={{ background: 'rgba(33,26,19,0.08)' }} />
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg p-4 space-y-3" style={{ background: '#FBF8EF', border: '1px solid rgba(33,26,19,0.1)', height: 140 }}>
            <div className="h-8 w-8 rounded-lg animate-pulse" style={{ background: 'rgba(33,26,19,0.08)' }} />
            <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'rgba(33,26,19,0.08)' }} />
            <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgba(33,26,19,0.06)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
