import Link from 'next/link'
import { Search, ChevronLeft } from '@/components/icons'

export default function QuizNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#1a1228' }}>
      <div className="text-center max-w-sm">
        <Search size={40} style={{ color: '#4a3a63', margin: '0 auto 1rem' }} />
        <h2 className="text-2xl font-black mb-2" style={{ color: '#F7F7FF' }}>Topic Not Found</h2>
        <p className="text-sm mb-6" style={{ color: '#9b8ab0' }}>
          We couldn&apos;t find that quiz topic. It may have been moved or doesn&apos;t exist yet.
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-white transition-colors"
          style={{ background: '#6DD3CE', color: '#2B1E3F' }}
        >
          <ChevronLeft size={15} /> Browse All Topics
        </Link>
      </div>
    </div>
  )
}
