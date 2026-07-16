export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      {/* Hero skeleton */}
      <div className="h-52" style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }} />

      {/* Filter bar skeleton */}
      <div className="max-w-4xl mx-auto px-6 py-6 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-14 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        ))}
      </div>

      {/* Cards grid skeleton */}
      <div className="max-w-4xl mx-auto px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl p-4 space-y-3" style={{ background: '#231935', border: '1px solid rgba(255,255,255,0.06)', height: 140 }}>
            <div className="h-8 w-8 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-4 w-3/4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="h-3 w-1/2 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
