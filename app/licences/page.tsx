import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Open-source licences',
  description: 'The open-source software curio learning is built on.',
}

const ITEMS = [
  { name: 'Fraction Fun', where: '/tools/fraction-fun', changes: 'Curio colours and branding; analytics and photos removed; reports completion to the page that shows it.' },
  { name: 'Rounding on a Number Line', where: '/tools/lines', changes: 'Curio colours and branding; analytics and photos removed; reports completion to the page that shows it.' },
  { name: 'Algebra Tiles', where: '/tools/algebra-tiles', changes: 'Built as a static site; curio colours and branding; analytics and photos removed; reports completion to the page that shows it.' },
  { name: 'STEM Figures diagram makers', where: '/tools/figures and /tools/library', changes: 'Built as static sites; curio logo and wording; example galleries, analytics and photos removed; links kept inside curio. The figures they make are public domain (CC0 1.0).' },
  { name: 'Morphology Mash word data', where: 'Word-part data', changes: 'Copied unchanged. Used for word-building practice.' },
]

export default function LicencesPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.25rem 4rem', color: 'var(--ink)' }}>
        <h1 style={{ fontFamily: 'var(--h)', fontWeight: 800, letterSpacing: '-0.03em', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1 }}>
          open-source <span style={{ color: 'var(--rust-text)', fontStyle: 'italic', fontWeight: 600 }}>licences</span>
        </h1>
        <p style={{ fontFamily: 'var(--serif)', color: 'var(--ink70)', marginTop: '1rem' }}>
          Some of curio&apos;s hands-on maths is adapted from free, open-source software by{' '}
          <a href="https://github.com/teacherdotdev" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust-text)' }}>teacher.dev</a>,
          shared under the{' '}
          <a href="https://www.apache.org/licenses/LICENSE-2.0" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust-text)' }}>Apache License, Version 2.0</a>.
          We changed it to fit curio, and the changes are listed below. Curio is not affiliated with or endorsed by teacher.dev.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0 0', display: 'grid', gap: '.9rem' }}>
          {ITEMS.map((i) => (
            <li key={i.name} style={{ background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 12, padding: '1rem 1.2rem' }}>
              <div style={{ fontFamily: 'var(--h)', fontWeight: 800 }}>{i.name}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', color: 'var(--ink55)', margin: '.15rem 0 .4rem' }}>{i.where}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', color: 'var(--ink70)' }}>Changes: {i.changes}</div>
            </li>
          ))}
        </ul>
        <p style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', color: 'var(--ink70)', marginTop: '2rem' }}>
          Diagrams made with STEM Figures are dedicated to the public domain (CC0 1.0). Sound effects in Fraction Fun are CC0, mostly by{' '}
          <a href="https://kenney.nl" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust-text)' }}>Kenney</a>.
          The full licence text for each tool is in its folder, for example{' '}
          <a href="/tools/fraction-fun/LICENSE.txt" style={{ color: 'var(--rust-text)' }}>/tools/fraction-fun/LICENSE.txt</a>.
        </p>
      </main>
      <Footer />
    </div>
  )
}
