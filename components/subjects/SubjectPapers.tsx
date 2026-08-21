'use client'

import { useEffect, useState } from 'react'

const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

interface Paper {
  id: number | string
  title: string
  grade: number
  section_type?: string
  topic?: string
  has_memo?: boolean
  file_url: string
}

function usePapers(subjectKey: string | null, grade: number) {
  const [papers, setPapers] = useState<Paper[] | null>(null)

  useEffect(() => {
    if (!subjectKey) { setPapers([]); return }
    let cancelled = false
    fetch(
      `${SUPABASE_URL}/rest/v1/papers?subject=eq.${subjectKey}&grade=eq.${grade}&order=id.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
      .then((r) => r.json())
      .then((rows) => { if (!cancelled) setPapers(Array.isArray(rows) ? rows : []) })
      .catch(() => { if (!cancelled) setPapers([]) })
    return () => { cancelled = true }
  }, [subjectKey, grade])

  return papers
}

export function SubjectPapersGrid({ subjectKey, grade }: { subjectKey: string | null; grade: number }) {
  const papers = usePapers(subjectKey, grade)

  if (papers === null) {
    return <div className="papers-coming-soon">Loading papers…</div>
  }
  if (papers.length === 0) {
    return (
      <div className="papers-coming-soon">
        Papers are being added. <a href="/papers" style={{ color: 'var(--rust)', display: 'inline-block', marginTop: '.4rem' }}>Browse all papers →</a>
      </div>
    )
  }
  return (
    <div className="papers-grid">
      {papers.map((p) => (
        <div className="paper-card" key={p.id}>
          <div className="paper-card-title">{p.title}</div>
          <div className="paper-card-meta">Grade {p.grade} · {p.section_type || p.topic || ''}</div>
          <div className="paper-card-footer">
            <span className="paper-card-badge">{p.has_memo ? 'Free + Memo' : 'Free'}</span>
            <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="paper-card-btn">Open ↗</a>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SubjectPapersSidebar({ subjectKey, grade }: { subjectKey: string | null; grade: number }) {
  const papers = usePapers(subjectKey, grade)

  if (papers === null) return <p className="sidebar-empty">Loading…</p>
  if (papers.length === 0) return <p className="sidebar-empty">Papers coming soon.</p>

  return (
    <>
      {papers.slice(0, 5).map((p) => (
        <div className="paper-row" key={p.id}>
          <div className="paper-info">
            <div className="paper-title">{p.title}</div>
            <div className="paper-meta">{p.section_type || ''}</div>
          </div>
          <span className="paper-badge">Free</span>
        </div>
      ))}
    </>
  )
}
