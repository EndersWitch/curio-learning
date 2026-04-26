'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Bloom from '@/components/Bloom'
import { sb } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  user: {
    email?: string
    user_metadata?: { full_name?: string; grade?: string; is_premium?: boolean }
  }
}

const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

// ─── Quiz demo data ────────────────────────────────────────────────────────────
const SETS = [
  {
    topic: 'English HL · Grade 4',
    questions: [
      { q: 'Which word is the verb in:\n"The girl quickly ran to school."', opts: ['girl','quickly','ran','school'], correct: 2, ok: 'Correct! "Ran" is the verb — it shows the action.', err: '"Ran" is the verb. Verbs are doing/action words.' },
      { q: 'What type of word is "beautiful" in:\n"She wore a beautiful dress."', opts: ['Verb','Noun','Adverb','Adjective'], correct: 3, ok: 'Correct! "Beautiful" is an adjective — it describes the noun.', err: '"Beautiful" is an adjective. Adjectives describe nouns.' },
    ],
  },
  {
    topic: 'Mathematics · Grade 6',
    questions: [
      { q: 'What is ¾ + ½?', opts: ['1','1¼','1½','⁵⁄₄'], correct: 1, ok: 'Correct! Convert ½ to ²⁄₄, then ¾ + ²⁄₄ = ⁵⁄₄ = 1¼.', err: 'Answer is 1¼. Convert ½ to ²⁄₄ then add.' },
      { q: 'Which fraction equals ²⁄₄?', opts: ['³⁄₄','⁴⁄₆','²⁄₄','⁵⁄₆'], correct: 1, ok: 'Correct! ⁴⁄₆ = ²⁄₄ — multiply both by 2.', err: '⁴⁄₆ equals ²⁄₄. Multiply top and bottom by 2.' },
    ],
  },
  {
    topic: 'Natural Sciences · Grade 5',
    questions: [
      { q: 'What is the main function of the heart?', opts: ['Digest food','Pump blood','Filter waste','Control breathing'], correct: 1, ok: 'Correct! The heart pumps blood to deliver oxygen.', err: 'The heart pumps blood. Kidneys filter waste.' },
      { q: 'Which organ produces urine?', opts: ['Liver','Stomach','Kidney','Lungs'], correct: 2, ok: 'Correct! Kidneys filter blood and produce urine.', err: 'The kidneys filter waste and produce urine.' },
    ],
  },
]

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [mounted, setMounted] = useState(false)

  // Quiz state
  const [activeSet, setActiveSet] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)

  // Dashboard state
  const [recPapers, setRecPapers] = useState<any[]>([])
  const [quizHistory, setQuizHistory] = useState<any[]>([])
  const [savedGrade, setSavedGrade] = useState('')
  const [streak, setStreak] = useState(0)
  const [streakDays, setStreakDays] = useState<boolean[]>([])
  const [gradeJustSaved, setGradeJustSaved] = useState(false)

  useEffect(() => {
    setMounted(true)

    /// Load session via Supabase auth
    sb.auth.getSession().then(({ data: { session: s } }) => {
      if (s?.user) {
        setSession(s as any)
        loadDashboard(s as any)
      }
    })

    // Reveal observer — also immediately trigger elements already in viewport
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((x) => { if (x.isIntersecting) x.target.classList.add('in') }),
      { threshold: 0.07, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.rv').forEach((el) => {
      ro.observe(el)
      // Immediately reveal elements already in viewport (above the fold)
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight) (el as HTMLElement).classList.add('in')
    })
    return () => ro.disconnect()
  }, [])

  function loadDashboard(s: Session) {
    // Grade
    const grade = localStorage.getItem('curio_grade') || ''
    setSavedGrade(grade)
    if (grade) fetchRecPapers(grade)

    // Quiz history
    try {
      const hist = JSON.parse(localStorage.getItem('curio_quiz_history') || '[]')
      setQuizHistory(hist.slice(-3).reverse())
    } catch {}

    // Streak
    try {
      const act = JSON.parse(localStorage.getItem('curio_activity') || '{}')
      const today = new Date()
      const days: boolean[] = []
      let s = 0
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const key = d.toISOString().slice(0, 10)
        const on = !!act[key]
        days.push(on)
      }
      setStreakDays(days)
      const realStreak = Object.keys(act).filter((k) => {
        const diff = (Date.now() - new Date(k).getTime()) / 864e5
        return diff < 30
      }).length
      setStreak(realStreak)
    } catch {}
  }

  async function fetchRecPapers(grade: string) {
    if (!grade) return
    try {
      const rows = await fetch(
        `${SUPABASE_URL}/rest/v1/papers?grade=eq.${grade}&order=id.desc&limit=4`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      ).then((r) => r.json())
      setRecPapers(rows || [])
    } catch {}
  }

  function saveGrade(v: string) {
    localStorage.setItem('curio_grade', v)
    setSavedGrade(v)
    setGradeJustSaved(true)
    setTimeout(() => setGradeJustSaved(false), 1200)
    fetchRecPapers(v)
  }

  async function doLogout() {
    await sb.auth.signOut()
    setSession(null)
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  function loadSet(i: number) { setActiveSet(i); setCurrentQ(0); setScore(0); setAnswered(false); setChosen(null) }
  function pick(i: number) {
    if (answered) return
    setChosen(i); setAnswered(true)
    if (i === SETS[activeSet].questions[currentQ].correct) setScore((s) => s + 1)
  }
  function next() {
    const isLast = currentQ >= SETS[activeSet].questions.length - 1
    if (isLast) { setCurrentQ(0); setScore(0); setAnswered(false); setChosen(null) }
    else { setCurrentQ((q) => q + 1); setAnswered(false); setChosen(null) }
  }

  const q = SETS[activeSet].questions[currentQ]
  const total = SETS[activeSet].questions.length
  const isLast = currentQ >= total - 1

  const name = session?.user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const initial = session?.user?.user_metadata?.full_name?.[0]?.toUpperCase() || session?.user?.email?.[0]?.toUpperCase() || '?'
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const bestScore = quizHistory.length
    ? Math.max(...quizHistory.map((h: any) => Math.round((h.score / h.total) * 100)))
    : null

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = new Date()

  return (
    <>
      {/* ── NAV ── */}
      <nav className="curio-nav">
        <a href="/" className="nav-logo">
          <Bloom size={26} />
          curio
        </a>
        <ul className="nav-links">
          <li><a href="/papers">Papers</a></li>
          <li><a href="/quiz">Quiz</a></li>
          <li><a href="/subjects">Subjects</a></li>
          <li><a href="/#pricing">Pricing</a></li>
        </ul>
        <div className="nav-right">
          {session ? (
            <div className="profile-wrap">
              <button
                className="profile-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('profileDD')?.classList.toggle('open')
                }}
              >
                {initial}
              </button>
              <div className="profile-dropdown" id="profileDD" onClick={(e) => e.stopPropagation()}>
                <div className="profile-dd-head">
                  <div className="profile-dd-name">{session.user.user_metadata?.full_name || 'My account'}</div>
                  <div className="profile-dd-email">{session.user.email}</div>
                </div>
                <a href="/papers" className="profile-dd-item">📄 &nbsp;Papers</a>
                <a href="/quiz" className="profile-dd-item">📝 &nbsp;Start a quiz</a>
                <a href="/profile" className="profile-dd-item">👤 &nbsp;Edit profile</a>
                <a href="/subscription" className="profile-dd-item">⭐ &nbsp;Manage subscription</a>
                <button className="profile-dd-item danger" onClick={doLogout}>Sign out</button>
              </div>
            </div>
          ) : (
            <>
              <a href="/login" className="btn-ghost">Log in</a>
              <a href="/login?tab=signup" className="btn-nav">Start free →</a>
            </>
          )}
        </div>
      </nav>

      {/* ── DASHBOARD (logged in) ── */}
      {session && (
        <div id="dashboard" style={{ display: 'block', paddingTop: '60px' }}>
          <div className="dash-wrap">
            {/* Greeting */}
            <div className="dash-greeting">
              <div>
                <div className="dash-eyebrow">{greeting},</div>
                <h1 className="dash-hello">
                  {name} <span className="cy">🌱</span>
                </h1>
                <div className="dash-date">
                  {today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="dash-greeting-right">
                <div className="streak-badge">
                  <span className="streak-fire">🔥</span>
                  <div>
                    <div className="streak-val">{streak}</div>
                    <div className="streak-lbl">day streak</div>
                  </div>
                </div>
                <div className="grade-selector">
                  <span className="grade-selector-label">Grade</span>
                  <select
                    className="grade-select"
                    value={savedGrade}
                    onChange={(e) => saveGrade(e.target.value)}
                  >
                    <option value="">—</option>
                    {[4,5,6,7,8,9,10,11,12].map((g) => (
                      <option key={g} value={String(g)}>{g}</option>
                    ))}
                  </select>
                  <span className={`grade-saved${gradeJustSaved ? ' show' : ''}`}>✓</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="dash-stats">
              <div className="dash-stat cy">
                <div className="ds-label">Papers for your grade</div>
                <div className="ds-val">{recPapers.length > 0 ? recPapers.length : '—'}</div>
                <div className="ds-sub">available now</div>
              </div>
              <div className="dash-stat">
                <div className="ds-label">Quizzes taken</div>
                <div className="ds-val">{quizHistory.length}</div>
                <div className="ds-sub">all time</div>
              </div>
              <div className="dash-stat co">
                <div className="ds-label">Best quiz score</div>
                <div className="ds-val">{bestScore !== null ? `${bestScore}%` : '—'}</div>
                <div className="ds-sub">% correct</div>
              </div>
              <div className="dash-stat am">
                <div className="ds-label">Day streak</div>
                <div className="ds-val">{streak}</div>
                <div className="ds-sub">keep going!</div>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--m30)', marginBottom: '0.8rem' }}>
                Quick actions
              </div>
              <div className="quick-actions">
                <a href="/papers" className="qa-btn"><span className="qa-icon">📄</span><span className="qa-label">Browse papers</span></a>
                <a href="/quiz" className="qa-btn"><span className="qa-icon">📝</span><span className="qa-label">Start a quiz</span></a>
                <a href="/deeplearn" className="qa-btn"><span className="qa-icon">🧠</span><span className="qa-label">Deep Learn</span></a>
                <a href="/subscription" className="qa-btn"><span className="qa-icon">⭐</span><span className="qa-label">My plan</span></a>
              </div>
            </div>

            {/* Panels */}
            <div className="dash-two-col">
              <div className="dash-panel">
                <div className="dash-ph">
                  <span className="dash-pt">📄 Recommended papers</span>
                  <a href="/papers" className="dash-pl">View all →</a>
                </div>
                <div className="dash-pb">
                  {recPapers.length > 0 ? recPapers.map((p: any) => (
                    <div className="rec-paper" key={p.id}>
                      <div className="rec-left">
                        <div className="rec-icon">📄</div>
                        <div>
                          <div className="rec-title">{p.title}</div>
                          <div className="rec-sub">Grade {p.grade}</div>
                        </div>
                      </div>
                      <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="rec-btn">Open ↗</a>
                    </div>
                  )) : (
                    <div className="dash-empty">Set your grade above to see recommendations.</div>
                  )}
                </div>
              </div>
              <div className="dash-panel">
                <div className="dash-ph">
                  <span className="dash-pt">📝 Quiz history</span>
                  <a href="/quiz" className="dash-pl">Take a quiz →</a>
                </div>
                <div className="dash-pb">
                  {quizHistory.length > 0 ? quizHistory.map((h: any, i: number) => {
                    const pct = Math.round((h.score / h.total) * 100)
                    const cls = pct >= 70 ? 'g' : pct >= 40 ? 'o' : 'r'
                    return (
                      <div className="qhi" key={i}>
                        <div>
                          <div className="qhi-topic">{h.topic}</div>
                          <div className="qhi-date">{h.date || ''}</div>
                        </div>
                        <span className={`qhi-score ${cls}`}>{pct}%</span>
                      </div>
                    )
                  }) : (
                    <div className="dash-empty">No quizzes yet — <a href="/quiz">start one →</a></div>
                  )}
                </div>
              </div>
            </div>

            <div className="dash-two-col">
              <div className="dash-panel">
                <div className="dash-ph"><span className="dash-pt">🔥 Study streak</span></div>
                <div className="dash-pb">
                  <div style={{ fontSize: '0.72rem', color: 'var(--m55)', marginBottom: '0.7rem' }}>Days studied this week</div>
                  <div className="streak-week">
                    {streakDays.map((on, i) => {
                      const d = new Date(today)
                      d.setDate(today.getDate() - (6 - i))
                      const isToday = i === 6
                      return (
                        <div key={i} className={`s-day${on ? ' on' : ''}${isToday ? ' today' : ''}`}>
                          <span>{DAYS[d.getDay()]}</span>
                          <div className="s-dot" />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--m30)', marginTop: '0.7rem' }}>
                    {streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} studied — keep it up! 🔥` : 'Open a paper or take a quiz to start your streak!'}
                  </div>
                </div>
              </div>
              <div className="dash-panel">
                <div className="dash-ph"><span className="dash-pt">📋 Recent activity</span></div>
                <div className="dash-pb">
                  <div className="dash-empty">No activity yet.</div>
                </div>
              </div>
            </div>

            {/* Premium upsell — hidden for premium users */}
            {!session.user.user_metadata?.is_premium && (
              <div className="pu">
                <div>
                  <div className="pu-ey">Curio Premium</div>
                  <div className="pu-title">Unlock the full Curio experience.</div>
                  <div className="pu-sub">You&apos;re on the free plan. Upgrade to access AI quizzes, Deep Learn, custom tests and more.</div>
                  <div className="pu-feats">
                    <span className="pu-feat">AI Quizzes</span>
                    <span className="pu-feat">Deep Learn</span>
                    <span className="pu-feat">Custom Tests</span>
                    <span className="pu-feat">No Ads</span>
                  </div>
                </div>
                <div>
                  <a href="/subscription" className="pu-cta">Subscribe now →</a>
                  <div className="pu-price">R49/month · founder pricing</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LANDING (guests) ── always in DOM, hidden when logged in */}
      <div id="landing" style={{ display: session ? 'none' : 'block' }}>
          <section className="hero">
            <div className="hero-left">
              <div className="hero-kicker">
                <span className="hero-kicker-dot" />
                for every SA student, Grade R to 12
              </div>
              <h1 className="hero-h1">
                Your<br />study<br />
                <span className="squiggle w-cyan">friend.</span>
              </h1>
              <p className="hero-desc">
                Exam papers, AI-powered quizzes and deep explanations —{' '}
                <strong>built for South African students.</strong> Free to start. Always in your corner.
              </p>
              <div className="hero-actions">
                <a href="/login?tab=signup" className="btn-primary">Start for free →</a>
                <a href="/quiz" className="btn-soft">Try a quiz</a>
              </div>
              <div className="hero-grades">
                <span className="gp on">All grades</span>
                <span className="gp">4 – 6</span>
                <span className="gp">7 – 9</span>
                <span className="gp">10 – 12</span>
              </div>
            </div>

            <div className="hero-right">
              <div className="bloom-hero">
                <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
                  <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.85" />
                  <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.6" transform="rotate(72 32 32)" />
                  <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.4" transform="rotate(144 32 32)" />
                  <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.4" transform="rotate(216 32 32)" />
                  <ellipse cx="32" cy="16" rx="7" ry="13" fill="#6DD3CE" fillOpacity="0.6" transform="rotate(288 32 32)" />
                  <circle cx="32" cy="32" r="7" fill="#FF5E5B" />
                </svg>
              </div>
              <div className="hero-stat-row">
                <div className="hstat c">
                  <div className="hstat-lbl">Subjects</div>
                  <div className="hstat-val">30+</div>
                  <div className="hstat-sub">Every grade covered</div>
                </div>
                <div className="hstat r">
                  <div className="hstat-lbl">To start</div>
                  <div className="hstat-val">R0</div>
                  <div className="hstat-sub">No card, no catch</div>
                </div>
                <div className="hstat">
                  <div className="hstat-lbl">Grade range</div>
                  <div className="hstat-val" style={{ fontSize: '1.5rem' }}>R – 12</div>
                  <div className="hstat-sub">All levels welcome</div>
                </div>
                <div className="hstat">
                  <div className="hstat-lbl">Papers</div>
                  <div className="hstat-val" style={{ color: 'var(--cyan)' }}>Free</div>
                  <div className="hstat-sub">Always, forever</div>
                </div>
              </div>
              <div className="hero-subjects-card">
                <div className="hsc-lbl">Popular subjects</div>
                <div className="hsc-pills">
                  <span className="hsc-pill c">English HL</span>
                  <span className="hsc-pill">Mathematics</span>
                  <span className="hsc-pill r">Life Sciences</span>
                  <span className="hsc-pill">History</span>
                  <span className="hsc-pill c">Geography</span>
                  <span className="hsc-pill">Physical Sciences</span>
                  <span className="hsc-pill">Accounting</span>
                  <span className="hsc-pill">+ more</span>
                </div>
              </div>
              <span className="hero-script-note">you&apos;ve got this 🌱</span>
            </div>
          </section>

          {/* ── SUBJECTS CLOUD ── */}
          <section className="subjects-section rv">
            <div className="subjects-label">Every subject · Grade R to 12</div>
            <div className="subject-cloud">
              <span className="sc-word big c">English HL</span><span className="sc-div">·</span>
              <span className="sc-word big">Mathematics</span><span className="sc-div">·</span>
              <span className="sc-word med r">Life Sciences</span><span className="sc-div">·</span>
              <span className="sc-word med">Physical Sciences</span><span className="sc-div">·</span>
              <span className="sc-word med">History</span><span className="sc-div">·</span>
              <span className="sc-word big a">Geography</span><span className="sc-div">·</span>
              <span className="sc-word sm">Accounting</span><span className="sc-div">·</span>
              <span className="sc-word sm c">Afrikaans HL</span><span className="sc-div">·</span>
              <span className="sc-word sm">Business Studies</span><span className="sc-div">·</span>
              <span className="sc-word sm r">Economics</span><span className="sc-div">·</span>
              <span className="sc-word sm">Natural Sciences</span><span className="sc-div">·</span>
              <span className="sc-word sm">Social Sciences</span><span className="sc-div">·</span>
              <span className="sc-word sm c">+ more</span>
            </div>
          </section>

          {/* ── CH1: PAPERS ── */}
          <section className="ch1 rv" id="papers">
            <div>
              <h2 className="ch-h">
                Exam papers.<br />Full memos.<br />
                <span className="cy">Yours to keep.</span>
              </h2>
              <p className="ch-p">
                Exam papers for every grade and subject, complete with full marking memos. Download them,
                study from them, own them. We never charge for this — access to good study material
                shouldn&apos;t depend on who you are or where you come from.
              </p>
              <span className="tag-pill tag-free">Always free</span>
            </div>
            <div className="plist">
              {[
                { bar: 'c', title: 'English HL — Paper 1 · Grade 12', meta: 'Language in Context · Comprehensive' },
                { bar: 'r', title: 'Mathematics — Paper 2 · Grade 12', meta: 'Geometry & Statistics · Full paper' },
                { bar: 'c', title: 'Life Sciences — Paper 1 · Grade 12', meta: 'Biochemistry & Cells · Full paper' },
                { bar: 'r', title: 'History — Paper 1 · Grade 11', meta: 'SA History · Source-based' },
                { bar: 'c', title: 'Geography — Paper 2 · Grade 10', meta: 'Human Geography · Full paper' },
              ].map((p, i) => (
                <div className="prow" key={i}>
                  <div className={`pbar ${p.bar}`} />
                  <div className="pinfo">
                    <div className="ptitle">{p.title}</div>
                    <div className="pmeta">{p.meta}</div>
                  </div>
                  <span className="pbadge">Free + Memo</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── CH2: DEEP LEARN ── */}
          <section className="ch2 rv">
            <div className="chat">
              <span className="chat-label" style={{ alignSelf: 'flex-end' }}>you</span>
              <div className="chat-bubble cb-me">Why does photosynthesis matter? I keep forgetting 😕</div>
              <span className="chat-label">curio</span>
              <div className="chat-bubble cb-them">
                Let&apos;s build it up from scratch. 🌿<br /><br />
                <strong>Plants are the only living things that make their own food</strong> — using sunlight, water, and CO₂ from the air.<br /><br />
                Here&apos;s the key: the oxygen they release as a by-product is every breath you&apos;ve ever taken. Every human, every animal — all of it comes from photosynthesis.<br /><br />
                So when your exam asks "why is it important?" — it&apos;s not just a plant thing.{' '}
                <strong>It&apos;s the foundation of all life on Earth.</strong>
              </div>
              <span className="chat-label" style={{ alignSelf: 'flex-end' }}>you</span>
              <div className="chat-bubble cb-me">Oh. That actually makes sense now ✓</div>
            </div>
            <div>
              <h2 className="ch-h">
                Not just<br /><em><span className="cy">right or wrong.</span></em><br />
                <span className="cr">Actually explained.</span>
              </h2>
              <p className="ch-p">
                When you get something wrong, Curio doesn&apos;t just mark you down and move on. Deep Learn
                breaks down the concept from first principles — in plain language, with real examples —
                until it actually clicks.
              </p>
              <span className="tag-pill tag-pro">Premium feature</span>
            </div>
          </section>

          {/* ── CH3: QUIZ ── */}
          <section className="ch3 rv" id="quiz">
            <div>
              <h2 className="ch-h">
                Questions that<br /><span className="cy">actually</span><br />teach you.
              </h2>
              <p className="ch-p">
                Topic-sorted quizzes with instant, meaningful feedback. Build your own custom test.
                Work at your own pace. Every question is a chance to understand something better.
              </p>
              <span className="tag-pill tag-pro">Premium feature</span>
              <div className="topic-tabs" style={{ marginTop: '1.8rem' }}>
                {SETS.map((s, i) => (
                  <div
                    key={i}
                    className={`ttab${activeSet === i ? ' on' : ''}`}
                    onClick={() => loadSet(i)}
                  >
                    <span className="ttab-label">{s.topic.split(' · ')[0]} — {s.topic.split(' · ')[0] === 'English HL' ? 'Parts of Speech' : s.topic.split(' · ')[0] === 'Mathematics' ? 'Fractions' : 'Human Body'}</span>
                    <span className="ttab-grade">Grade {s.topic.split('Grade ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="qcard">
              <div className="qcard-top">
                <span className="qcard-tag">{SETS[activeSet].topic}</span>
                <span className="qcard-score">Score: <b>{score}</b></span>
              </div>
              <div className="qprog">
                <div className="qprog-fill" style={{ width: `${(currentQ / total) * 100}%` }} />
              </div>
              <div className="qcard-body">
                <div className="qcard-qlbl">Q {currentQ + 1} / {total}</div>
                <div className="qcard-q">{q.q}</div>
                <div className="qopts">
                  {q.opts.map((opt, i) => {
                    const isCorrect = answered && i === q.correct
                    const isWrong = answered && i === chosen && i !== q.correct
                    return (
                      <div
                        key={i}
                        className={`qopt${isCorrect ? ' correct' : isWrong ? ' wrong' : ''}`}
                        onClick={() => pick(i)}
                        style={{ pointerEvents: answered ? 'none' : 'auto' }}
                      >
                        <div className="ql">{['A','B','C','D'][i]}</div>
                        {opt}
                      </div>
                    )
                  })}
                </div>
                {answered && (
                  <div className={`qfb show${chosen === q.correct ? ' ok' : ' err'}`}>
                    {chosen === q.correct ? q.ok : q.err}
                  </div>
                )}
              </div>
              <div className="qcard-footer">
                {answered && (
                  <button className="btn-next" style={{ display: 'block' }} onClick={next}>
                    {isLast ? 'Restart →' : 'Continue →'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── PRICING ── */}
          <section className="pricing rv" id="pricing">
            <div className="pricing-header">
              <h2 className="pricing-h">Honest pricing.<br />For <em>every</em> student.</h2>
              <p className="pricing-note-top">
                Papers and memos are free, always. Premium unlocks the tools that take you further —
                for less than a takeaway a month.
              </p>
            </div>
            <div className="pricing-cards">
              <div className="pc">
                <div className="pc-tier">Free · Forever</div>
                <div className="pc-price"><sup>R</sup>0</div>
                <hr className="pc-div" />
                <ul className="pc-items">
                  {['Full past paper library','Download papers as PDF','Full marking memos','All grades & subjects'].map((f) => (
                    <li key={f} className="pc-item"><span className="pci-chk">✓</span>{f}</li>
                  ))}
                </ul>
                <a href="/login?tab=signup" className="pc-btn pc-btn-free">Get started free</a>
              </div>
              <div className="pc hot">
                <div className="pc-badge">Most popular</div>
                <div className="pc-tier">Premium</div>
                <div className="pc-price"><sup>R</sup>49<sub>/mo</sub></div>
                <div className="pc-trial">Founder pricing · Cancel anytime</div>
                <hr className="pc-div" />
                <ul className="pc-items">
                  {[
                    'Everything in Free',
                    'AI-powered quiz mode',
                    'Deep Learn explanations',
                    'Custom test generator',
                    'Progress tracking & streaks',
                    'Topic-sorted question sets',
                  ].map((f) => (
                    <li key={f} className="pc-item"><span className="pci-chk">✓</span>{f}</li>
                  ))}
                </ul>
                <a href="/login?tab=signup" className="pc-btn pc-btn-pro">Subscribe — R49/month →</a>
              </div>
            </div>
            <div className="heart-note">
              💛 <strong>No student left behind.</strong> Exam papers and memos will always be free on Curio —
              no account needed, no strings attached. Because access to good study material shouldn&apos;t
              have a price tag.
            </div>
          </section>

          {/* ── CLOSING ── */}
          <section className="closing">
            <div className="closing-big rv">
              <span className="cy">You&apos;ve</span><br />Got<br /><span className="co">This.</span>
            </div>
            <div className="closing-right rv rv-delay-1">
              <p>
                Every student — no matter their school, their background, or their circumstances —
                deserves a real shot. <strong>Curio is here to give it to you.</strong>
              </p>
              <p>Free to start. No card needed. Just you and the work.</p>
              <span className="closing-script">we believe in you 🌱</span>
              <div>
                <a href="/login?tab=signup" className="btn-primary" style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
                  Create your free account →
                </a>
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer>
            <div className="footer-logo">
              <Bloom size={20} />
              curio
            </div>
            <div className="footer-links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="/contact">Contact</a>
            </div>
            <p className="footer-copy">© 2026 Curio Learning · Made with love for SA students</p>
          </footer>
        </div>
    </>
  )
}
