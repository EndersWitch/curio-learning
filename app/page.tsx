'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Bloom from '@/components/Bloom'
import Footer from '@/components/Footer'
import ThemeToggle from '@/components/ThemeToggle'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useAccountDrawer } from '@/components/AccountDrawerProvider'
import { Flame, Zap, FileText, PenLine, User, Star, Check, Brain, Heart, ListChecks } from '@/components/icons'

const SUPABASE_URL = 'https://inmrsgujgfktapjnekjs.supabase.co'
const SUPABASE_KEY = 'sb_publishable__15Lhb_ZGbKC2NHJVwB_HA_Z2BW_UoU'

// Local-calendar-date key (YYYY-MM-DD) — never use .toISOString() for this,
// it converts to UTC and rolls the date back a day for UTC+ timezones.
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Quiz demo data ────────────────────────────────────────────────────────────
const SETS = [
  {
    topic: 'English HL · Grade 4',
    questions: [
      { q: 'Which word is the verb in:\n"The girl quickly ran to school."', opts: ['girl','quickly','ran','school'], correct: 2, ok: 'Correct! "Ran" is the verb. It shows the action.', err: '"Ran" is the verb. Verbs are doing/action words.' },
      { q: 'What type of word is "beautiful" in:\n"She wore a beautiful dress."', opts: ['Verb','Noun','Adverb','Adjective'], correct: 3, ok: 'Correct! "Beautiful" is an adjective. It describes the noun.', err: '"Beautiful" is an adjective. Adjectives describe nouns.' },
    ],
  },
  {
    topic: 'Mathematics · Grade 6',
    questions: [
      { q: 'What is ¾ + ½?', opts: ['1','1¼','1½','1¾'], correct: 1, ok: 'Correct! Convert ½ to ²⁄₄, then ¾ + ²⁄₄ = ⁵⁄₄ = 1¼.', err: 'Answer is 1¼. Convert ½ to ²⁄₄ then add.' },
      { q: 'Which fraction equals ²⁄₄?', opts: ['³⁄₄','⁴⁄₈','²⁄₆','⁵⁄₆'], correct: 1, ok: 'Correct! ⁴⁄₈ = ²⁄₄. Multiply top and bottom by 2.', err: '⁴⁄₈ equals ²⁄₄. Multiply top and bottom by 2.' },
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
  const { user, refreshUser } = useAuth()
  const { openDrawer } = useAccountDrawer()
  const ddRef = useRef<HTMLDivElement>(null)

  // Close the profile dropdown when clicking anywhere outside it.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        document.getElementById('profileDD')?.classList.remove('open')
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Quiz state
  const [activeSet, setActiveSet] = useState(0)
  const [currentQ, setCurrentQ] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [chosen, setChosen] = useState<number | null>(null)

  // Dashboard state — all sourced from Supabase, nothing cached locally
  const [recPapers, setRecPapers] = useState<any[]>([])
  const [quizHistory, setQuizHistory] = useState<any[]>([])
  const [savedGrade, setSavedGrade] = useState('')
  const [streakDays, setStreakDays] = useState<boolean[]>([])
  const [gradeJustSaved, setGradeJustSaved] = useState(false)
  const [quizzesTaken, setQuizzesTaken] = useState(0)
  const [bestScoreOverall, setBestScoreOverall] = useState<number | null>(null)

  // Reveal observer — also immediately trigger elements already in viewport
  useEffect(() => {
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

  // Grade select + recommended papers + quiz history/streak strip all key
  // off the shared auth user — profile fields (grade, XP, streak count/date)
  // come straight from useAuth, nothing re-fetched here.
  useEffect(() => {
    setSavedGrade(user?.grade || '')
    if (user?.grade) fetchRecPapers(user.grade)
  }, [user?.grade])

  useEffect(() => {
    if (user?.id) loadQuizHistory(user.id)
  }, [user?.id])

  useEffect(() => {
    setStreakDays(computeStreakWeek(user?.streakDays ?? 0, user?.streakLastDate ?? null))
  }, [user?.streakDays, user?.streakLastDate])

  useEffect(() => {
    // Static pages (papers, subscription, subjects/*, etc.) link to /profile,
    // which next.config.js redirects here with ?account=1 — pop the drawer
    // open so "Edit profile" still feels like one action from anywhere.
    if (new URLSearchParams(window.location.search).get('account') === '1') {
      openDrawer()
      window.history.replaceState(null, '', '/')
    }
  }, [openDrawer])

  // Best-effort weekly streak strip derived from streak_days/streak_last_date —
  // there's no per-day activity log, so we mark the most recent `streakCount`
  // consecutive days up to streak_last_date as active.
  //
  // IMPORTANT: stick to local-calendar-date string keys throughout (never
  // .toISOString(), which converts to UTC and silently rolls the date back
  // a day for anyone east of UTC — that's what made "today" show as
  // yesterday's box lighting up instead).
  function computeStreakWeek(streakCount: number, streakLastDate: string | null): boolean[] {
    const today = new Date()
    // streak_last_date is a plain YYYY-MM-DD from Postgres — parse it as
    // calendar-date components, not as a UTC instant.
    const lastActive = streakLastDate
      ? (() => { const [y, m, d] = streakLastDate.split('-').map(Number); return new Date(y, m - 1, d) })()
      : null
    const activeDates = new Set<string>()
    if (lastActive) {
      for (let i = 0; i < streakCount; i++) {
        const d = new Date(lastActive)
        d.setDate(lastActive.getDate() - i)
        activeDates.add(localDateKey(d))
      }
    }
    const days: boolean[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(activeDates.has(localDateKey(d)))
    }
    return days
  }

  // Quiz history — straight from user_level_progress (server), most recent first.
  // Fetch everything (it's one row per level per user — small) so the stat
  // cards reflect the full picture, then show only the latest 3 in the panel.
  async function loadQuizHistory(userId: string) {
    const { data: progressRows } = await sb
      .from('user_level_progress')
      .select('topic_id, level_id, best_score, passed, attempts, last_attempted_at')
      .eq('user_id', userId)
      .order('last_attempted_at', { ascending: false })

    setQuizzesTaken(progressRows?.length ?? 0)
    setBestScoreOverall(
      progressRows && progressRows.length > 0
        ? Math.max(...progressRows.map((r) => r.best_score))
        : null
    )

    if (progressRows && progressRows.length > 0) {
      const recent = progressRows.slice(0, 3)
      const levelIds = recent.map((r) => r.level_id)
      const { data: levels } = await sb
        .from('quiz_levels')
        .select('level_id, level_display, broad_topic_display')
        .in('level_id', levelIds)
      const levelMap = new Map((levels ?? []).map((l: any) => [l.level_id, l]))

      setQuizHistory(recent.map((r) => ({
        topic: levelMap.get(r.level_id)?.level_display ?? levelMap.get(r.level_id)?.broad_topic_display ?? r.level_id,
        score: r.best_score,
        total: 100,
        date: r.last_attempted_at ? new Date(r.last_attempted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '',
        attempts: r.attempts,
      })))
    } else {
      setQuizHistory([])
    }
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

  async function saveGrade(v: string) {
    setSavedGrade(v)
    setGradeJustSaved(true)
    setTimeout(() => setGradeJustSaved(false), 1200)
    fetchRecPapers(v)
    if (user?.id) {
      await sb.from('profiles').update({ grade: v }).eq('id', user.id)
      await refreshUser()
    }
  }

  async function doLogout() {
    await sb.auth.signOut()
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

  const name = user?.fullName?.split(' ')[0] || 'there'
  const initial = user?.fullName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
  const streak = user?.streakDays ?? 0
  const totalXp = user?.totalXp ?? 0
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const bestScore = bestScoreOverall

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
          <li><a href="/subscription">Subscription</a></li>
        </ul>
        <div className="nav-right">
          {user ? (
            <div className="profile-wrap" ref={ddRef}>
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
                  <div className="profile-dd-name">{user.fullName || 'My account'}</div>
                  <div className="profile-dd-email">{user.email}</div>
                </div>
                <a href="/papers" className="profile-dd-item dd-item-icon"><FileText size={15} /> Papers</a>
                <a href="/quiz" className="profile-dd-item dd-item-icon"><PenLine size={15} /> Start a quiz</a>
                <button
                  className="profile-dd-item dd-item-icon"
                  onClick={() => { document.getElementById('profileDD')?.classList.remove('open'); openDrawer() }}
                >
                  <User size={15} /> Edit profile
                </button>
                <a href="/subscription" className="profile-dd-item dd-item-icon"><Star size={15} /> Manage subscription</a>
                <div className="profile-dd-item dd-item-theme">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
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
      {user && (
        <div id="dashboard" style={{ display: 'block', paddingTop: '60px' }}>
          <div className="dash-wrap">
            {/* Greeting */}
            <div className="dash-greeting">
              <div>
                <div className="dash-eyebrow">{greeting},</div>
                <h1 className="dash-hello">{name}</h1>
                <div className="dash-date">
                  {today.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className="dash-greeting-right">
                <div className="streak-badge">
                  <Flame size={18} className="streak-fire" />
                  <div>
                    <div className="streak-val">{streak}</div>
                    <div className="streak-lbl">day streak</div>
                  </div>
                </div>
                <div className="dash-grade-selector">
                  <span className="dash-grade-selector-label">Grade</span>
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
                  <span className={`grade-saved${gradeJustSaved ? ' show' : ''}`}><Check size={13} /></span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="dash-stats">
              <div className="dash-stat am">
                <div className="ds-label">Total XP</div>
                <div className="ds-val ds-val-icon"><Zap size={22} />{totalXp.toLocaleString()}</div>
                <div className="ds-sub">earned all time</div>
              </div>
              <div className="dash-stat cy">
                <div className="ds-label">Papers for your grade</div>
                <div className="ds-val">{recPapers.length > 0 ? recPapers.length : '—'}</div>
                <div className="ds-sub">available now</div>
              </div>
              <div className="dash-stat">
                <div className="ds-label">Quizzes taken</div>
                <div className="ds-val">{quizzesTaken}</div>
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
              <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--ink35)', marginBottom: '0.8rem' }}>
                Quick actions
              </div>
              <div className="quick-actions">
                <a href="/papers" className="qa-btn"><FileText size={22} className="qa-icon" /><span className="qa-label">Browse papers</span></a>
                <a href="/quiz" className="qa-btn"><PenLine size={22} className="qa-icon" /><span className="qa-label">Start a quiz</span></a>
                <a href="/deeplearn" className="qa-btn"><Brain size={22} className="qa-icon" /><span className="qa-label">Deep Learn</span></a>
                <a href="/subscription" className="qa-btn"><Star size={22} className="qa-icon" /><span className="qa-label">My plan</span></a>
              </div>
            </div>

            {/* Panels */}
            <div className="dash-two-col">
              <div className="dash-panel">
                <div className="dash-ph">
                  <span className="dash-pt dash-pt-icon"><FileText size={16} /> Recommended papers</span>
                  <a href="/papers" className="dash-pl">View all →</a>
                </div>
                <div className="dash-pb">
                  {recPapers.length > 0 ? recPapers.map((p: any) => (
                    <div className="rec-paper" key={p.id}>
                      <div className="rec-left">
                        <div className="rec-icon"><FileText size={15} /></div>
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
                  <span className="dash-pt dash-pt-icon"><PenLine size={16} /> Quiz history</span>
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
                    <div className="dash-empty">No quizzes yet. <a href="/quiz">Start one →</a></div>
                  )}
                </div>
              </div>
            </div>

            <div className="dash-two-col">
              <div className="dash-panel">
                <div className="dash-ph"><span className="dash-pt dash-pt-icon"><Flame size={16} /> Study streak</span></div>
                <div className="dash-pb">
                  <div style={{ fontSize: '0.72rem', color: 'var(--ink55)', marginBottom: '0.7rem' }}>Days studied this week</div>
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
                  <div style={{ fontSize: '0.7rem', color: 'var(--ink35)', marginTop: '0.7rem' }}>
                    {streak > 0 ? `${streak} day${streak !== 1 ? 's' : ''} studied. Keep it up!` : 'Open a paper or take a quiz to start your streak!'}
                  </div>
                </div>
              </div>
              <div className="dash-panel">
                <div className="dash-ph"><span className="dash-pt dash-pt-icon"><ListChecks size={16} /> Recent activity</span></div>
                <div className="dash-pb">
                  <div className="dash-empty">No activity yet.</div>
                </div>
              </div>
            </div>

            {/* Premium upsell — hidden for premium/founder users */}
            {!(user.isPremium || user.isFounder) && (
              <div className="pu">
                <div>
                  <div className="pu-ey">Curio Premium</div>
                  <div className="pu-title">Ready for more than papers?</div>
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
          <Footer />
        </div>
      )}

      {/* ── LANDING (guests) ── always in DOM, hidden when logged in */}
      <div id="landing" style={{ display: user ? 'none' : 'block' }}>
          <section className="hero">
            <div className="spread-deco o1" style={{ bottom: '-8%', left: '2%' }}>
              <Bloom size={220} />
            </div>
            <div className="hero-left">
              <div className="hero-note">
                <span className="hero-note-rule" />
                for every SA student, Grade R to 12
              </div>
              <h1 className="hero-h1">
                Your<br />study<br />
                <span className="squiggle w-cyan">friend.</span>
              </h1>
              <p className="hero-desc">
                Exam papers, AI-powered quizzes and deep explanations,{' '}
                <strong>built for South African students.</strong> Free to start. Always in your corner.
              </p>
              <div className="hero-actions">
                <a href="/login?tab=signup" className="btn-primary">Start for free →</a>
                <a href="/quiz" className="btn-soft">Try a quiz</a>
              </div>
              <div className="hero-grades">
                <a href="/subjects" className="gp on">All grades</a>
                <a href="/subjects#int" className="gp">4 – 6</a>
                <a href="/subjects#sen" className="gp">7 – 9</a>
                <a href="/subjects#fet" className="gp">10 – 12</a>
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-paper-stack">
                <div className="hero-paper back">
                  <div className="hero-paper-tag dim">English HL · Grade 11</div>
                </div>
                <div className="hero-paper front">
                  <div className="hero-paper-top">
                    <span className="hero-paper-tag">Grade 12 · Mathematics P1</span>
                    <span className="hero-paper-stamp">8<span>/10</span></span>
                  </div>
                  <div className="hero-paper-q">
                    4.2&nbsp; Solve for <em>x</em>:<br />2x² − 5x − 3 = 0
                  </div>
                  <div className="hero-paper-opts">
                    <span className="hero-paper-opt">x = −3 or x = ½</span>
                    <span className="hero-paper-opt">
                      <span className="hero-paper-loop">x = 3 or x = −½</span>
                    </span>
                  </div>
                </div>
              </div>
              <p className="hero-caption">
                <strong>30+ subjects</strong> · R0 to start · papers free, forever.
              </p>
            </div>
          </section>

          {/* ── SUBJECTS CLOUD ── */}
          <section className="subjects-section rv">
            <div className="spread-deco o1" style={{ top: '-30px', right: '4%' }}>
              <Bloom size={140} />
            </div>
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
            <div className="spread-deco o1" style={{ bottom: '-40px', right: '-30px' }}>
              <Bloom size={180} />
            </div>
            <div>
              <h2 className="ch-h">
                Exam papers.<br />Full memos.<br />
                <span className="cy">Yours to keep.</span>
              </h2>
              <p className="ch-p">
                Exam papers for every grade and subject, complete with full marking memos. Download them,
                study from them, own them. We never charge for this. Access to good study material
                shouldn&apos;t depend on who you are or where you come from.
              </p>
              <span className="tag-pill tag-free">Always free</span>
            </div>
            <div className="plist">
              {[
                { title: 'English HL · Paper 1 · Grade 12', meta: 'Language in Context · Comprehensive' },
                { title: 'Mathematics · Paper 2 · Grade 12', meta: 'Geometry & Statistics · Full paper' },
                { title: 'Life Sciences · Paper 1 · Grade 12', meta: 'Biochemistry & Cells · Full paper' },
                { title: 'History · Paper 1 · Grade 11', meta: 'SA History · Source-based' },
                { title: 'Geography · Paper 2 · Grade 10', meta: 'Human Geography · Full paper' },
              ].map((p, i) => (
                <div className="prow" key={i}>
                  <div className="pbar">{String(i + 1).padStart(2, '0')}</div>
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
            <div className="spread-deco o1" style={{ top: '-30px', right: '6%' }}>
              <Bloom size={150} />
            </div>
            <div className="chat">
              <span className="chat-label" style={{ alignSelf: 'flex-end' }}>you</span>
              <div className="chat-bubble cb-me">Why does photosynthesis matter? I keep forgetting.</div>
              <span className="chat-label">curio</span>
              <div className="chat-bubble cb-them">
                Let&apos;s build it up from scratch.<br /><br />
                <strong>Plants are the only living things that make their own food,</strong> using sunlight, water, and CO₂ from the air.<br /><br />
                Here&apos;s the key: the oxygen they release as a by-product is every breath you&apos;ve ever taken. Every human, every animal, all of it comes from photosynthesis.<br /><br />
                So when your exam asks &quot;why is it important?&quot; it&apos;s not just a plant thing.{' '}
                <strong>It&apos;s the foundation of all life on Earth.</strong>
              </div>
              <span className="chat-label" style={{ alignSelf: 'flex-end' }}>you</span>
              <div className="chat-bubble cb-me">Oh. That actually makes sense now.</div>
            </div>
            <div>
              <h2 className="ch-h">
                Not just<br /><em><span className="cy">right or wrong.</span></em><br />
                <span className="cr">Actually explained.</span>
              </h2>
              <p className="ch-p">
                When you get something wrong, Curio doesn&apos;t just mark you down and move on. Deep Learn
                breaks down the concept from first principles, in plain language, with real examples,
                until it actually clicks.
              </p>
              <span className="tag-pill tag-pro">Premium feature</span>
            </div>
          </section>

          {/* ── CH3: QUIZ ── */}
          <section className="ch3 rv" id="quiz">
            <div className="spread-deco o1" style={{ bottom: '-30px', left: '-30px' }}>
              <Bloom size={160} />
            </div>
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
                    <span className="ttab-label">{s.topic.split(' · ')[0]} · {s.topic.split(' · ')[0] === 'English HL' ? 'Parts of Speech' : s.topic.split(' · ')[0] === 'Mathematics' ? 'Fractions' : 'Human Body'}</span>
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
            <div className="spread-deco o1" style={{ top: '-20px', right: '2%' }}>
              <Bloom size={110} />
            </div>
            <div className="pricing-header">
              <h2 className="pricing-h">Honest pricing.<br />For <em>every</em> student.</h2>
              <p className="pricing-note-top">
                Papers and memos are free, always. Premium adds the AI quizzes and explanations,
                for less than a takeaway a month.
              </p>
            </div>
            <div className="report-card">
              <div className="report-head">
                <span className="report-head-label">What you get</span>
                <span className="report-head-cell">Free</span>
                <span className="report-head-cell premium">
                  Premium
                  <span className="report-mark">our pick</span>
                </span>
              </div>
              {[
                { label: 'Full past paper library', free: true, pro: true },
                { label: 'Download papers as PDF', free: true, pro: true },
                { label: 'Full marking memos', free: true, pro: true },
                { label: 'All grades & subjects', free: true, pro: true },
                { label: 'AI-powered quiz mode', free: false, pro: true },
                { label: 'Deep Learn explanations', free: false, pro: true },
                { label: 'Custom test generator', free: false, pro: true },
                { label: 'Progress tracking & streaks', free: false, pro: true },
                { label: 'Topic-sorted question sets', free: false, pro: true },
                { label: 'No ads', free: false, pro: true },
              ].map((row) => (
                <div className="report-row" key={row.label}>
                  <span className="report-row-label">{row.label}</span>
                  <span className={`report-row-cell${row.free ? ' on' : ''}`}>{row.free ? <Check size={14} /> : '—'}</span>
                  <span className={`report-row-cell premium${row.pro ? ' on' : ''}`}>{row.pro ? <Check size={14} /> : '—'}</span>
                </div>
              ))}
              <div className="report-foot">
                <span className="report-foot-label" />
                <div className="report-foot-cell">
                  <div className="report-price"><sup>R</sup>0</div>
                  <div className="report-price-sub">forever</div>
                  <a href="/login?tab=signup" className="report-cta report-cta-free">Get started free</a>
                </div>
                <div className="report-foot-cell">
                  <div className="report-price"><sup>R</sup>49<small>/mo</small></div>
                  <div className="report-price-sub">founder pricing</div>
                  <a href="/login?tab=signup" className="report-cta report-cta-pro">Subscribe →</a>
                </div>
              </div>
            </div>
            <div className="heart-note">
              <Heart size={16} className="heart-note-icon" />
              <span><strong>No student left behind.</strong> Exam papers and memos will always be free on Curio.
              No account needed, no strings attached. Because access to good study material shouldn&apos;t
              have a price tag.</span>
            </div>
          </section>

          {/* ── CLOSING ── */}
          <section className="closing">
            <div className="spread-deco o1" style={{ bottom: '-40px', right: '4%' }}>
              <Bloom size={190} />
            </div>
            <div className="closing-big rv">
              <span className="cy">You&apos;ve</span><br />Got<br /><span className="co">This.</span>
            </div>
            <div className="closing-right rv rv-delay-1">
              <p>
                Every student, no matter their school, their background, or their circumstances,
                deserves a real shot. <strong>Curio is here to give it to you.</strong>
              </p>
              <p>Free to start. No card needed. Just you and the work.</p>
              <div>
                <a href="/login?tab=signup" className="btn-primary" style={{ display: 'inline-flex', marginTop: '0.5rem' }}>
                  Create your free account →
                </a>
              </div>
            </div>
          </section>

          <Footer />
        </div>
    </>
  )
}
