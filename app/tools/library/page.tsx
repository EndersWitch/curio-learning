import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import FigureLibrary from '@/components/FigureLibrary'

export const metadata: Metadata = {
  title: 'Figure library',
  robots: { index: false, follow: false },
}

export default function LibraryPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '3rem 1.25rem 4rem', color: 'var(--ink)' }}>
        <a href="/tools" style={{ color: 'var(--rust-text)', fontFamily: 'var(--h)', fontWeight: 700, fontSize: '.9rem', textDecoration: 'none' }}>← Tools</a>
        <h1 style={{ fontFamily: 'var(--h)', fontWeight: 800, letterSpacing: '-0.03em', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1, margin: '.6rem 0 1rem' }}>
          figure <span style={{ color: 'var(--rust-text)', fontStyle: 'italic', fontWeight: 600 }}>library</span>
        </h1>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--ink70)', maxWidth: 620, marginBottom: '1.5rem' }}>
          Ready-made diagrams for tests, worksheets and cards: maths, physics, chemistry, biology and economics. Open one in its generator to change the numbers and labels. Public domain, no credit needed.
        </p>
        <FigureLibrary />
      </main>
      <Footer />
    </div>
  )
}
