import Link from 'next/link'
import { Search, ChevronLeft } from '@/components/icons'

export default function QuizNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#F6F0E2' }}>
      <div className="text-center max-w-sm">
        <Search size={40} style={{ color: 'rgba(33,26,19,0.3)', margin: '0 auto 1rem' }} />
        <h2 className="text-2xl font-black mb-2" style={{ color: '#211A13' }}>Topic Not Found</h2>
        <p className="text-sm mb-6" style={{ color: 'rgba(33,26,19,0.55)' }}>
          We couldn&apos;t find that quiz topic. It may have been moved or doesn&apos;t exist yet.
        </p>
        <Link
          href="/quiz"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-black text-sm transition-colors"
          style={{ background: '#B8451F', color: '#F6F0E2' }}
        >
          <ChevronLeft size={15} /> Browse All Topics
        </Link>
      </div>
    </div>
  )
}
