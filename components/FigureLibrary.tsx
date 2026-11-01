'use client'

import { useEffect, useMemo, useState } from 'react'

interface Figure {
  site: string
  generator: string
  slug: string
  title: string
  description: string
  caption: string
  file: string
  open: string
}

const SITE_NAMES: Record<string, string> = {
  math: 'Maths',
  physics: 'Physics',
  chemistry: 'Chemistry',
  biology: 'Biology',
  economics: 'Economics',
}

// A searchable gallery of the ready-made diagrams in public/tools/figure-library.
export default function FigureLibrary() {
  const [all, setAll] = useState<Figure[] | null>(null)
  const [query, setQuery] = useState('')
  const [site, setSite] = useState('all')
  const [shown, setShown] = useState(48)
  const [picked, setPicked] = useState<Figure | null>(null)

  useEffect(() => {
    fetch('/tools/figure-library/index.json')
      .then((r) => r.json())
      .then(setAll)
      .catch(() => setAll([]))
  }, [])

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return (all ?? []).filter((f) => {
      if (site !== 'all' && f.site !== site) return false
      const text = `${f.title} ${f.description} ${f.generator.replace(/-/g, ' ')}`.toLowerCase()
      return words.every((w) => text.includes(w))
    })
  }, [all, query, site])

  useEffect(() => setShown(48), [query, site])

  const chip = (active: boolean): React.CSSProperties => ({
    padding: '.4rem .8rem',
    borderRadius: 999,
    border: '1px solid var(--line)',
    background: active ? 'var(--rust)' : 'var(--paper-raised)',
    color: active ? 'var(--on-rust)' : 'var(--ink)',
    fontFamily: 'var(--h)',
    fontWeight: 700,
    fontSize: '.85rem',
    cursor: 'pointer',
  })

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search, like “pie chart”, “titration” or “supply and demand”"
        aria-label="Search the figure library"
        style={{ width: '100%', padding: '.8rem 1rem', borderRadius: 12, border: '1px solid var(--line)', background: 'var(--paper-raised)', color: 'var(--ink)', fontFamily: 'var(--serif)', fontSize: '1rem' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', margin: '1rem 0' }}>
        <button type="button" style={chip(site === 'all')} onClick={() => setSite('all')}>All</button>
        {Object.entries(SITE_NAMES).map(([id, name]) => (
          <button key={id} type="button" style={chip(site === id)} onClick={() => setSite(id)}>{name}</button>
        ))}
      </div>
      <p style={{ fontFamily: 'var(--serif)', color: 'var(--ink55)', fontSize: '.9rem' }}>
        {all === null ? 'Loading…' : `${matches.length} figure${matches.length === 1 ? '' : 's'}`}
      </p>

      <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))' }}>
        {matches.slice(0, shown).map((f) => (
          <li key={f.file}>
            <button
              type="button"
              onClick={() => setPicked(f)}
              style={{ width: '100%', textAlign: 'left', background: 'var(--paper-raised)', border: '1px solid var(--line)', borderRadius: 12, padding: '.7rem', cursor: 'pointer', color: 'var(--ink)' }}
            >
              <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.file} alt={f.description} loading="lazy" style={{ maxWidth: '100%', maxHeight: 150 }} />
              </div>
              <div style={{ fontFamily: 'var(--h)', fontWeight: 700, fontSize: '.85rem', marginTop: '.5rem', lineHeight: 1.25 }}>{f.title}</div>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.75rem', color: 'var(--ink55)', marginTop: '.2rem' }}>
                {SITE_NAMES[f.site]} · {f.generator.replace(/-/g, ' ')}
              </div>
            </button>
          </li>
        ))}
      </ul>
      {matches.length > shown && (
        <button type="button" style={chip(false)} onClick={() => setShown((n) => n + 48)}>Show more</button>
      )}

      {picked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={picked.title}
          onClick={() => setPicked(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(33,26,19,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 80 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--paper)', color: 'var(--ink)', borderRadius: 16, maxWidth: 760, width: '100%', maxHeight: '92vh', overflow: 'auto', padding: '1.25rem' }}
          >
            <div style={{ background: '#fff', borderRadius: 10, padding: '.5rem', display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={picked.file} alt={picked.description} style={{ maxWidth: '100%', maxHeight: '55vh' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--h)', fontWeight: 800, fontSize: '1.2rem', margin: '1rem 0 .4rem' }}>{picked.title}</h2>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', color: 'var(--ink70)', margin: 0 }}>{picked.caption}</p>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '.8rem', color: 'var(--ink55)', margin: '.8rem 0 0', wordBreak: 'break-all' }}>
              File: public{picked.file}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginTop: '1rem' }}>
              <a href={picked.open} target="_blank" rel="noopener noreferrer" style={{ ...chip(true), textDecoration: 'none' }}>Open in the generator</a>
              <a href={picked.file} download={`${picked.slug}.svg`} style={{ ...chip(false), textDecoration: 'none' }}>Download SVG</a>
              <button type="button" style={chip(false)} onClick={() => setPicked(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
