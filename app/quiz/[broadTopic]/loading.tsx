export default function Loading() {
  return (
    <div className="min-h-screen" style={{ background: '#1a1228' }}>
      <div className="h-44" style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)' }} />
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <div className="flex-1 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="h-3 w-1/4 rounded animate-pulse mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-4 w-2/3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
