'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import Bloom from '@/components/Bloom'
import type { Paper } from '@/lib/content'

const SUBJECT_NAMES: Record<string, string> = {
  english: 'English HL', afrikaans: 'Afrikaans', maths: 'Mathematics',
  science: 'Natural Sciences', social: 'Social Sciences', history: 'History',
  geography: 'Geography', physics: 'Physical Sciences', lifesciences: 'Life Sciences',
  accounting: 'Accounting', business: 'Business Studies', economics: 'Economics',
  lifeskills: 'Life Skills', technology: 'Technology', arts: 'Arts & Culture',
}
const SUBJECT_COLOUR: Record<string, string> = {
  maths: 'amber', mathematics: 'amber',
  science: 'coral', physics: 'coral', lifesciences: 'coral',
}

function PaperCard({ p }: { p: Paper }) {
  const subjName = SUBJECT_NAMES[p.subject] || p.subject
  const colour = SUBJECT_COLOUR[p.subject] || ''

  return (
    <div className="paper-card">
      <div className="paperc-top">
        <span className={`paperc-subject-pill ${colour}`}>{subjName}</span>
        {p.has_memo && <span className="paperc-memo-badge">Memo incl.</span>}
      </div>
      <div className="paperc-title">{p.title}</div>
      {p.topic && <div className="paperc-meta">{p.topic}</div>}
      <div className="paperc-actions">
        <a href={p.file_url} target="_blank" rel="noopener" className="paperc-btn paperc-btn-paper">Download paper ↓</a>
        {p.has_memo && p.memo_url ? (
          <a href={p.memo_url} target="_blank" rel="noopener" className="paperc-btn paperc-btn-memo has-memo">Memo ↓</a>
        ) : (
          <span className="paperc-btn paperc-btn-memo" style={{ cursor: 'default', opacity: 0.4 }}>No memo</span>
        )}
      </div>
    </div>
  )
}

// `papers` comes from the server (app/papers/page.tsx), so the full library is
// in the page's HTML. There's deliberately no placeholder/demo fallback: fake
// papers shown to a crawler or reviewer read as a thin or misleading site.
export default function PapersClient({ papers: allPapers }: { papers: Paper[] }) {
  const { user } = useAuth()
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adDismissed, setAdDismissed] = useState(true) // starts hidden until we know it should show

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAdDismissed(sessionStorage.getItem('curio_ad_dismissed_adTopbar') === '1')
  }, [])

  const showAd = !user || !(user.isPremium || user.isFounder)

  const grades = useMemo(() => {
    return [...new Set(allPapers.map((p) => p.grade))].sort((a, b) => a - b)
  }, [allPapers])

  const subjects = useMemo(() => {
    return [...new Set(allPapers.map((p) => p.subject))].sort()
  }, [allPapers])

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return allPapers.filter((p) => {
      const matchGrade = selectedGrade === 'all' || p.grade === selectedGrade
      const matchSubject = selectedSubject === 'all' || p.subject === selectedSubject
      const matchSearch = !q
        || p.title.toLowerCase().includes(q)
        || (SUBJECT_NAMES[p.subject] || p.subject).toLowerCase().includes(q)
        || String(p.grade).includes(q)
        || (p.topic || '').toLowerCase().includes(q)
      return matchGrade && matchSubject && matchSearch
    })
  }, [allPapers, selectedGrade, selectedSubject, searchQuery])

  const isFiltered = selectedGrade !== 'all' || selectedSubject !== 'all' || !!searchQuery

  function clearFilters() {
    setSelectedGrade('all')
    setSelectedSubject('all')
    setSearchQuery('')
  }

  function dismissAd() {
    sessionStorage.setItem('curio_ad_dismissed_adTopbar', '1')
    setAdDismissed(true)
  }

  const byGrade = useMemo(() => {
    const map = new Map<number, Map<string, Paper[]>>()
    for (const p of filtered) {
      if (!map.has(p.grade)) map.set(p.grade, new Map())
      const bySubject = map.get(p.grade)!
      if (!bySubject.has(p.subject)) bySubject.set(p.subject, [])
      bySubject.get(p.subject)!.push(p)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [filtered])

  return (
    <>
      {showAd && !adDismissed && (
        <div className="ad-slot ad-on">
          <div className="ad-topbar">
            <div className="ad-topbar-left">
              <span className="ad-pill">Ad</span>
              <span className="ad-topbar-text"><strong>Remove ads and add AI quizzes and Deep Learn</strong> with Curio Premium, from R49/month.</span>
            </div>
            <div className="ad-topbar-right">
              <a href="/login?tab=signup" className="ad-cta">Go Premium →</a>
              <button className="ad-x" onClick={dismissAd} aria-label="Close">&times;</button>
            </div>
          </div>
        </div>
      )}

      <section className="papers-hero">
        <div className="spread-deco o1 papers-bloom papers-bloom-one"><Bloom size={260} /></div>
        <div className="spread-deco o2 papers-bloom papers-bloom-two"><Bloom size={104} /></div>
        <div className="papers-hero-inner">
          <div className="papers-hero-copy">
            <div className="spread-kicker">
              <span className="spread-kicker-line" />Free forever · No sign-up required
            </div>
            <h1 className="papers-hero-title">
              <span>exam</span>
              <span className="accent">papers.</span>
            </h1>
            <p className="papers-hero-sub">Browse and download CAPS-aligned practice papers by grade and subject. <strong>Papers and memos are always free,</strong> no account needed, no strings.</p>
          </div>
          <div className="papers-hero-stats" aria-label="Paper library totals">
            <div className="papers-hero-stat"><div className="papers-hero-stat-value">{allPapers.length || '—'}</div><div className="papers-hero-stat-label">Papers</div></div>
            <div className="papers-hero-stat"><div className="papers-hero-stat-value">{grades.length || '—'}</div><div className="papers-hero-stat-label">Grades</div></div>
            <div className="papers-hero-stat"><div className="papers-hero-stat-value">{subjects.length || '—'}</div><div className="papers-hero-stat-label">Subjects</div></div>
          </div>
        </div>
      </section>

      <div className="papers-layout">
        <aside className="papers-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Search</div>
            <input
              className="papers-search"
              type="text"
              placeholder="e.g. Maths, English…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Grade</div>
            <div className="grade-list">
              <button className={`grade-btn${selectedGrade === 'all' ? ' active' : ''}`} onClick={() => setSelectedGrade('all')}>
                All grades <span className="grade-count">{allPapers.length}</span>
              </button>
              {grades.map((g) => (
                <button key={g} className={`grade-btn${selectedGrade === g ? ' active' : ''}`} onClick={() => setSelectedGrade(g)}>
                  Grade {g} <span className="grade-count">{allPapers.filter((p) => p.grade === g).length}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Subject</div>
            <div className="subject-pills">
              <button className={`subj-pill all${selectedSubject === 'all' ? ' active' : ''}`} onClick={() => setSelectedSubject('all')}>All</button>
              {subjects.map((s) => (
                <button key={s} className={`subj-pill${selectedSubject === s ? ' active' : ''}`} onClick={() => setSelectedSubject(s)}>
                  {SUBJECT_NAMES[s] || s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="papers-main">
          {allPapers.length === 0 ? (
            <div className="no-results">No papers have been published yet.</div>
          ) : filtered.length === 0 ? (
            <div className="no-results">
              No papers found for your search. <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <>
              <div className="results-bar">
                <span className="results-count">
                  Showing <strong>{filtered.length}</strong>{isFiltered ? ` of ${allPapers.length}` : ''} paper{filtered.length !== 1 ? 's' : ''}
                </span>
                {isFiltered && <button className="clear-btn" onClick={clearFilters}>Clear filters</button>}
              </div>

              {byGrade.map(([grade, bySubject]) => {
                const totalInGrade = [...bySubject.values()].reduce((sum, arr) => sum + arr.length, 0)
                return (
                  <div key={grade}>
                    <div className="grade-heading">
                      <div className="grade-heading-num">{grade}</div>
                      <div className="grade-heading-text">
                        <div className="grade-heading-title">Grade {grade}</div>
                        <div className="grade-heading-sub">{totalInGrade} paper{totalInGrade !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {[...bySubject.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([subject, papers]) => (
                      <div className="subject-group" key={subject}>
                        <div className="subject-group-header">
                          <span className="subject-group-title">{SUBJECT_NAMES[subject] || subject}</span>
                          <div className="subject-group-line" />
                          <span className="subject-group-count">{papers.length} paper{papers.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="papers-grid">
                          {papers.map((p) => <PaperCard p={p} key={p.id} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          )}
        </main>
      </div>
    </>
  )
}
