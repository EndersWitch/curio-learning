'use client'

import { useEffect, useMemo, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Paper {
  id: number | string
  grade: number
  subject: string
  title: string
  has_memo: boolean
  file_url: string
  memo_url: string | null
  topic?: string | null
}

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

// Shown when the papers table is empty, so the page still demonstrates the
// layout instead of rendering blank.
const DEMO_PAPERS: Paper[] = [
  { id: 1, grade: 10, subject: 'maths', title: 'Mathematics · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Algebra & Functions' },
  { id: 2, grade: 10, subject: 'maths', title: 'Mathematics · Paper 2', has_memo: true, file_url: '#', memo_url: '#', topic: 'Geometry & Statistics' },
  { id: 3, grade: 10, subject: 'english', title: 'English HL · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Comprehension & Language' },
  { id: 4, grade: 10, subject: 'english', title: 'English HL · Paper 2', has_memo: false, file_url: '#', memo_url: null, topic: 'Literature' },
  { id: 5, grade: 10, subject: 'physics', title: 'Physical Sciences · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Mechanics & Waves' },
  { id: 6, grade: 11, subject: 'maths', title: 'Mathematics · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Functions & Algebra' },
  { id: 7, grade: 11, subject: 'maths', title: 'Mathematics · Paper 2', has_memo: true, file_url: '#', memo_url: '#', topic: 'Trigonometry & Stats' },
  { id: 8, grade: 11, subject: 'english', title: 'English HL · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Comprehension & Summary' },
  { id: 9, grade: 11, subject: 'lifesciences', title: 'Life Sciences · Paper 1', has_memo: false, file_url: '#', memo_url: null, topic: 'DNA & Evolution' },
  { id: 10, grade: 12, subject: 'maths', title: 'Mathematics · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Functions, Sequences & Finance' },
  { id: 11, grade: 12, subject: 'maths', title: 'Mathematics · Paper 2', has_memo: true, file_url: '#', memo_url: '#', topic: 'Statistics, Analytical Geometry' },
  { id: 12, grade: 12, subject: 'english', title: 'English HL · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Comprehension, Summary, Language' },
  { id: 13, grade: 12, subject: 'english', title: 'English HL · Paper 2', has_memo: true, file_url: '#', memo_url: '#', topic: 'Literature & Poetry' },
  { id: 14, grade: 12, subject: 'physics', title: 'Physical Sciences · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Mechanics, Electricity' },
  { id: 15, grade: 12, subject: 'physics', title: 'Physical Sciences · Paper 2', has_memo: true, file_url: '#', memo_url: '#', topic: 'Chemical Change, Organic Chemistry' },
  { id: 16, grade: 12, subject: 'accounting', title: 'Accounting · Full Paper', has_memo: true, file_url: '#', memo_url: '#', topic: 'Financial Statements & Analysis' },
  { id: 17, grade: 9, subject: 'maths', title: 'Mathematics · Paper 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Algebra & Geometry' },
  { id: 18, grade: 9, subject: 'english', title: 'English HL · Paper 1', has_memo: false, file_url: '#', memo_url: null, topic: 'Comprehension & Writing' },
  { id: 19, grade: 4, subject: 'english', title: 'English HL · Term 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Language & Reading' },
  { id: 20, grade: 4, subject: 'maths', title: 'Mathematics · Term 1', has_memo: true, file_url: '#', memo_url: '#', topic: 'Number Sense & Operations' },
]

function PaperCard({ p }: { p: Paper }) {
  const subjName = SUBJECT_NAMES[p.subject] || p.subject
  const colour = SUBJECT_COLOUR[p.subject] || ''
  const isDemoLink = p.file_url === '#'

  return (
    <div className="paper-card">
      <div className="pc-top">
        <span className={`pc-subject-pill ${colour}`}>{subjName}</span>
        {p.has_memo && <span className="pc-memo-badge">Memo incl.</span>}
      </div>
      <div className="pc-title">{p.title}</div>
      {p.topic && <div className="pc-meta">{p.topic}</div>}
      <div className="pc-actions">
        {isDemoLink ? (
          <button className="pc-btn pc-btn-paper" onClick={() => showComingSoon()}>Download paper ↓</button>
        ) : (
          <a href={p.file_url} target="_blank" rel="noopener" className="pc-btn pc-btn-paper">Download paper ↓</a>
        )}
        {p.has_memo && p.memo_url && p.memo_url !== '#' ? (
          <a href={p.memo_url} target="_blank" rel="noopener" className="pc-btn pc-btn-memo has-memo">Memo ↓</a>
        ) : p.has_memo && isDemoLink ? (
          <button className="pc-btn pc-btn-memo has-memo" onClick={() => showComingSoon()}>Memo ↓</button>
        ) : (
          <span className="pc-btn pc-btn-memo" style={{ cursor: 'default', opacity: 0.4 }}>No memo</span>
        )}
      </div>
    </div>
  )
}

function showComingSoon() {
  alert('This is a demo paper.\n\nAdd real papers via the Admin Panel → Add Paper, paste in a Supabase Storage URL and it will appear here automatically.')
}

export default function PapersClient() {
  const { user } = useAuth()
  const [allPapers, setAllPapers] = useState<Paper[] | null>(null)
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adDismissed, setAdDismissed] = useState(true) // starts hidden until we know it should show

  useEffect(() => {
    sb.from('papers').select('*').order('grade', { ascending: true }).order('subject', { ascending: true }).order('title', { ascending: true })
      .then(({ data }) => {
        setAllPapers(data && data.length > 0 ? (data as Paper[]) : DEMO_PAPERS)
      })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setAdDismissed(sessionStorage.getItem('curio_ad_dismissed_adTopbar') === '1')
  }, [])

  const showAd = !user || !(user.isPremium || user.isFounder)

  const grades = useMemo(() => {
    if (!allPapers) return []
    return [...new Set(allPapers.map((p) => p.grade))].sort((a, b) => a - b)
  }, [allPapers])

  const subjects = useMemo(() => {
    if (!allPapers) return []
    return [...new Set(allPapers.map((p) => p.subject))].sort()
  }, [allPapers])

  const filtered = useMemo(() => {
    if (!allPapers) return []
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

      <div className="papers-hero">
        <div className="hero-left">
          <div className="hero-eyebrow">Free forever · No sign-up required</div>
          <h1 className="hero-h">Exam papers.<br /><span className="cy">All grades.</span></h1>
          <p className="hero-sub">Browse and download exam papers for every grade and subject. <strong>Papers and memos are always free,</strong> no account needed, no strings.</p>
        </div>
        <div className="hero-stats">
          <div className="hstat"><div className="hstat-val"><span className="cy">{allPapers?.length ?? '—'}</span></div><div className="hstat-label">Papers</div></div>
          <div className="hstat"><div className="hstat-val"><span className="cy">{grades.length || '—'}</span></div><div className="hstat-label">Grades</div></div>
          <div className="hstat"><div className="hstat-val"><span className="cy">{subjects.length || '—'}</span></div><div className="hstat-label">Subjects</div></div>
        </div>
      </div>

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
                All grades <span className="grade-count">{allPapers?.length ?? 0}</span>
              </button>
              {grades.map((g) => (
                <button key={g} className={`grade-btn${selectedGrade === g ? ' active' : ''}`} onClick={() => setSelectedGrade(g)}>
                  Grade {g} <span className="grade-count">{allPapers!.filter((p) => p.grade === g).length}</span>
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
          {allPapers === null ? (
            <div className="papers-loading">
              <svg className="papers-loading-bloom" width="48" height="48" viewBox="0 0 64 64" fill="none">
                <g fill="none" stroke="var(--rust)" strokeWidth="2" strokeLinejoin="round">
                  <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(0 32 32)" />
                  <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(72 32 32)" />
                  <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(144 32 32)" />
                  <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(216 32 32)" />
                  <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(288 32 32)" />
                </g>
                <circle cx="32" cy="32" r="4.5" fill="var(--ochre)" />
              </svg>
              <span className="papers-loading-text">Loading papers…</span>
            </div>
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
