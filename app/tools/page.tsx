import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Maths tools',
  description: 'Free hands-on maths tools: fractions of a number, rounding on a number line, and algebra tiles.',
  robots: { index: false, follow: true },
}

type Tool = { name: string; grades: string; blurb: string; href: string }

const TOOLS: Tool[] = [
  {
    name: 'Fraction of a number',
    grades: 'Fractions',
    blurb: 'Cut a donut into equal groups and share out the sprinkles to find a fraction of a whole number.',
    href: '/tools/fraction-fun',
  },
  {
    name: 'Rounding on a number line',
    grades: 'Number sense',
    blurb: 'Find the start point, end point and halfway mark on a number line, then round. Ends with a report of the steps you missed.',
    href: '/tools/lines',
  },
  {
    name: 'Algebra tiles',
    grades: 'Algebra',
    blurb: 'Multiply and factor polynomials, and solve equations, by moving tiles around.',
    href: '/tools/algebra-tiles',
  },
]

const FIGURES: { name: string; href: string }[] = [
  { name: 'Maths figures', href: '/tools/figures/math' },
  { name: 'Physics figures', href: '/tools/figures/physics' },
  { name: 'Chemistry figures', href: '/tools/figures/chemistry' },
  { name: 'Biology figures', href: '/tools/figures/biology' },
  { name: 'Economics figures', href: '/tools/figures/economics' },
]

const card: React.CSSProperties = {
  background: 'var(--paper-raised)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  padding: '1.25rem 1.4rem',
  color: 'var(--ink)',
  textDecoration: 'none',
  display: 'block',
}

export default function ToolsPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '3rem 1.25rem 4rem', color: 'var(--ink)' }}>
        <h1 style={{ fontFamily: 'var(--h)', fontWeight: 800, letterSpacing: '-0.03em', fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', lineHeight: 1 }}>
          maths <span style={{ color: 'var(--rust-text)', fontStyle: 'italic', fontWeight: 600 }}>tools</span>
        </h1>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--ink70)', marginTop: '1rem', maxWidth: 560 }}>
          Hands-on practice you can open and use straight away. Nothing to sign up for, and nothing is saved on our side.
        </p>

        <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {TOOLS.map((t) => (
            <a key={t.href} href={t.href} style={card}>
              <div style={{ fontFamily: 'var(--h)', fontSize: '.78rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--rust-text)' }}>
                {t.grades}
              </div>
              <div style={{ fontFamily: 'var(--h)', fontWeight: 800, fontSize: '1.25rem', margin: '.35rem 0 .5rem' }}>{t.name}</div>
              <p style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', color: 'var(--ink70)', margin: 0 }}>{t.blurb}</p>
            </a>
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--h)', fontWeight: 800, fontSize: '1.5rem', marginTop: '3rem' }}>Make your own diagrams</h2>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--ink70)', marginTop: '.5rem', maxWidth: 600 }}>
          Clean, printable figures for tests and worksheets: number lines, triangles, graphs, circuits, Punnett squares, supply and demand
          and more. Download them as SVG or PNG. The figures are public domain.
        </p>
        <p style={{ margin: '1rem 0 0' }}>
          <a href="/tools/library" style={{ color: 'var(--rust-text)', fontFamily: 'var(--h)', fontWeight: 800 }}>Browse 422 ready-made figures →</a>
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0', display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
          {FIGURES.map((f) => (
            <li key={f.href}>
              <a
                href={f.href}
                style={{ display: 'inline-block', padding: '.5rem .9rem', border: '1px solid var(--line)', borderRadius: 999, color: 'var(--ink)', textDecoration: 'none', fontFamily: 'var(--h)', fontWeight: 600, fontSize: '.9rem', background: 'var(--paper-raised)' }}
              >
                {f.name}
              </a>
            </li>
          ))}
        </ul>

        <p style={{ fontFamily: 'var(--serif)', fontSize: '.85rem', color: 'var(--ink55)', marginTop: '3rem', maxWidth: 640 }}>
          The tools above are adapted from open-source apps by{' '}
          <a href="https://github.com/teacherdotdev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust-text)' }}>
            teacher.dev
          </a>
          , used under the Apache License 2.0. See the <a href="/licences" style={{ color: 'var(--rust-text)' }}>licences page</a>.
        </p>
      </main>
      <Footer />
    </div>
  )
}
