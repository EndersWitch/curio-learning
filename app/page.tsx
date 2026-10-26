'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Bloom from '@/components/Bloom'
import Footer from '@/components/Footer'
import ThemeToggle from '@/components/ThemeToggle'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { useAccountDrawer } from '@/components/AccountDrawerProvider'
import { Flame, FileText, PenLine, User, Star, Check, Brain, Heart, ListChecks, Trophy } from '@/components/icons'

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

// Feature rows for the pricing cards — `free` marks what the free plan includes.
const PLAN_FEATURES = [
  { label: 'Full past paper library', free: true },
  { label: 'Download papers as PDF', free: true },
  { label: 'Full marking memos', free: true },
  { label: 'All grades & subjects', free: true },
  { label: 'AI-powered quiz mode', free: false },
  { label: 'Bloom AI tutor', free: false },
  { label: 'Custom test generator', free: false },
  { label: 'Progress tracking & streaks', free: false },
  { label: 'Topic-sorted question sets', free: false },
  { label: 'No ads', free: false },
]

export default function HomePage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const { openDrawer } = useAccountDrawer()
  const ddRef = useRef<HTMLDivElement>(null)

  // Splash stays up until the auth check resolves AND a minimum beat has
  // played, so returning users never see a flash of the landing page before
  // the dashboard swaps in — and the bloom always gets its moment, even when
  // the session check resolves instantly from cache.
  const [splashMinTimeDone, setSplashMinTimeDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSplashMinTimeDone(true), 650)
    return () => clearTimeout(t)
  }, [])
  const showSplash = authLoading || !splashMinTimeDone

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
  const hr = new Date().getHours()
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const bestScore = bestScoreOverall

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const today = new Date()

  return (
    <>
      {/* ── SPLASH — always plays a beat, and masks the auth check so a
          returning user never sees the landing page flash before their
          dashboard swaps in ── */}
      <div className={`home-splash${showSplash ? '' : ' gone'}`} aria-hidden={!showSplash}>
        <Bloom size={52} className="home-splash-bloom" />
      </div>

      {/* ── NAV ── */}
      <nav className="curio-nav">
        <a href="/" className="nav-logo">
          <Bloom size={32} />
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
              <a href="/login?tab=signup" className="btn-nav">Start free</a>
            </>
          )}
        </div>
      </nav>

      {/* ── DASHBOARD (logged in) ── */}
      {user && (
        <div id="dashboard" style={{ display: 'block', paddingTop: '60px' }}>
          <div className="dash-wrap">
            <div className="spread-deco o2 lp-float" style={{ top: '-50px', right: '-40px' }}>
              <Bloom size={220} />
            </div>
            <div className="spread-deco o2 lp-float slow" style={{ top: '38%', left: '-60px' }}>
              <Bloom size={150} tone="moss" />
            </div>
            <div className="spread-deco o2 lp-float" style={{ bottom: '8%', right: '-50px' }}>
              <Bloom size={170} tone="ochre" />
            </div>
            {/* Greeting */}
            <div className="dash-greeting">
              <div>
                <div className="dash-eyebrow">{greeting},</div>
                <h1 className="dash-hello"><span className="squiggle">{name}</span>!</h1>
                <p className="dash-tagline">Ready to learn something new today?</p>
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
              <div className="dash-stat cy">
                <div className="ds-top"><span className="ds-ic"><FileText size={20} /></span><div className="ds-label">Papers for your grade</div></div>
                <div className="ds-val">{recPapers.length > 0 ? recPapers.length : '—'}</div>
                <div className="ds-sub">available now</div>
              </div>
              <div className="dash-stat">
                <div className="ds-top"><span className="ds-ic"><PenLine size={20} /></span><div className="ds-label">Quizzes taken</div></div>
                <div className="ds-val">{quizzesTaken}</div>
                <div className="ds-sub">all time</div>
              </div>
              <div className="dash-stat co">
                <div className="ds-top"><span className="ds-ic"><Trophy size={20} /></span><div className="ds-label">Best quiz score</div></div>
                <div className="ds-val">{bestScore !== null ? `${bestScore}%` : '—'}</div>
                <div className="ds-sub">% correct</div>
              </div>
              <div className="dash-stat am">
                <div className="ds-top"><span className="ds-ic"><Flame size={20} /></span><div className="ds-label">Day streak</div></div>
                <div className="ds-val">{streak}</div>
                <div className="ds-sub">keep going!</div>
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <div className="dash-section-label">
                Quick actions
              </div>
              <div className="quick-actions">
                <a href="/papers" className="qa-btn q1"><FileText size={22} className="qa-icon" /><span className="qa-label">Browse papers</span><span className="qa-arrow" aria-hidden="true">↗</span></a>
                <a href="/quiz" className="qa-btn q2"><PenLine size={22} className="qa-icon" /><span className="qa-label">Start a quiz</span><span className="qa-arrow" aria-hidden="true">↗</span></a>
                <a href="/deeplearn" className="qa-btn q3"><Brain size={22} className="qa-icon" /><span className="qa-label">Bloom</span><span className="qa-arrow" aria-hidden="true">↗</span></a>
                <a href="/subscription" className="qa-btn q4"><Star size={22} className="qa-icon" /><span className="qa-label">My plan</span><span className="qa-arrow" aria-hidden="true">↗</span></a>
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
                <div className="spread-deco o1 lp-float" style={{ bottom: '-30px', right: '2%' }}>
                  <Bloom size={150} tone="paper" />
                </div>
                <div className="spread-deco o1 lp-float slow" style={{ top: '-40px', left: '38%' }}>
                  <Bloom size={100} tone="paper" />
                </div>
                <div>
                  <div className="pu-ey">Curio Premium</div>
                  <div className="pu-title">Ready for more than papers?</div>
                  <div className="pu-sub">You&apos;re on the free plan. Upgrade to access AI quizzes, Bloom, custom tests and more.</div>
                  <div className="pu-feats">
                    <span className="pu-feat">AI Quizzes</span>
                    <span className="pu-feat">Bloom</span>
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
        {/* HERO */}
        <section className="lp-hero">
          <div className="spread-deco o2 lp-float" style={{ top: '70px', left: '-70px' }}>
            <Bloom size={280} />
          </div>
          <div className="spread-deco o2 lp-float slow" style={{ top: '40px', right: '-50px' }}>
            <Bloom size={210} tone="ochre" />
          </div>
          <div className="spread-deco o3 lp-float" style={{ top: '430px', left: '9%' }}>
            <Bloom size={54} tone="moss" />
          </div>
          <div className="spread-deco o3 lp-float slow" style={{ top: '390px', right: '8%' }}>
            <Bloom size={70} />
          </div>
          <div className="lp-wrap">
            <div className="lp-hero-copy">
              <span className="lp-sticker">Free papers, always!</span>
              <div className="lp-pill">
                <span className="lp-pill-icon"><Bloom size={44} className="lp-spin" /></span>
                <h1 className="lp-h1">Your <span className="lp-accent squiggle">study</span> friend</h1>
              </div>
              <p className="lp-lead">Past papers, quizzes and explanations that actually make sense, made for South African students.</p>
              <p className="lp-lead-sm">Free to start. Papers and memos are free, always.</p>
              <div className="lp-actions">
                <a href="/login?tab=signup" className="btn-primary">Start for free</a>
                <a href="/quiz" className="btn-soft">Try a quiz</a>
              </div>
            </div>

            <div className="lp-collage">
              {[
                { cls: 'a', img: '/images/home/hero-science.jpg', alt: 'Colourful flasks and beakers in a science lab', tag: 'Science', pos: '50% 50%' },
                { cls: 'b', img: '/images/home/hero-maths.jpg', alt: 'Colourful magnetic numbers spelling a sum', tag: 'Maths', pos: '50% 50%' },
                { cls: 'c', img: '/images/home/hero-english.jpg', alt: 'A green chalkboard with a spelling list', tag: 'English', pos: '50% 35%' },
              ].map((p) => (
                <figure className={`lp-polaroid ${p.cls}`} key={p.cls}>
                  <div className="lp-polaroid-img">
                    <Image src={p.img} alt={p.alt} fill priority sizes="(max-width: 680px) 45vw, 300px" style={{ objectPosition: p.pos }} />
                  </div>
                  <figcaption><Bloom size={16} /> {p.tag}</figcaption>
                </figure>
              ))}
            </div>

            <div className="lp-stats rv">
              {[
                { n: '30+', l: 'Subjects', t: 't1' },
                { n: '4–12', l: 'Grades covered', t: 't2' },
                { n: 'R0', l: 'Papers and memos, always', t: 't3' },
                { n: 'CAPS', l: 'Aligned to the curriculum', t: 't4' },
              ].map((s) => (
                <div className={`lp-stat ${s.t}`} key={s.l}>
                  <div className="lp-stat-n">{s.n}</div>
                  <div className="lp-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="lp-section" id="why">
          <div className="spread-deco o2 lp-float slow" style={{ top: '30px', right: '-60px' }}>
            <Bloom size={230} tone="moss" />
          </div>
          <div className="lp-wrap">
            <div className="lp-head rv">
              <div>
                <h2 className="lp-h2"><Bloom size={36} className="lp-h2-bloom" />Why students love Curio</h2>
                <p>One place for past papers, practice and the explanations that make them make sense.</p>
              </div>
              <a href="/subjects" className="btn-soft">All subjects</a>
            </div>
            <div className="lp-cards rv">
              {[
                { href: '/papers', title: 'Free papers and memos', text: 'Past exam papers with full marking memos for every grade and subject. Download them and keep them.', t: 't1' },
                { href: '/deeplearn', title: 'Explained, not just marked', text: 'Got something wrong? Bloom breaks the idea down from the start until it clicks.', t: 't2' },
                { href: '/quiz', title: 'Quizzes that teach', text: 'Topic-sorted quizzes with instant feedback, plus custom tests you build yourself.', t: 't3' },
                { href: '/subjects', title: 'Your grade, your subjects', text: 'Pick your grade and go straight to the papers and practice that match your CAPS year.', t: 't4' },
                { href: '/login?tab=signup', title: 'Progress you can see', text: 'Streaks and quiz history show what you have practised and where to go next.', t: 't2' },
                { href: '/subscription', title: 'No student left behind', text: 'Papers and memos stay free. Premium adds the AI features for R49 a month.', t: 't1' },
              ].map((c, i) => (
                <a href={c.href} className={`lp-card ${c.t}`} key={c.title}>
                  <span className="lp-num">
                    <Bloom size={104} className="lp-num-bloom" />
                    <b>{String(i + 1).padStart(2, '0')}</b>
                  </span>
                  <span className="lp-card-text">
                    <h3>{c.title}</h3>
                    <p>{c.text}</p>
                  </span>
                  <span className="lp-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* PHASES */}
        <section className="lp-section" id="phases">
          <div className="spread-deco o2 lp-float" style={{ bottom: '40px', left: '-70px' }}>
            <Bloom size={240} />
          </div>
          <div className="lp-wrap">
            <div className="lp-head rv">
              <div>
                <h2 className="lp-h2"><Bloom size={36} className="lp-h2-bloom" />Where are you in school?</h2>
                <p>Pick your phase and we&apos;ll show you the papers, memos and practice for your grades.</p>
              </div>
              <a href="/subjects" className="btn-soft">View all</a>
            </div>
            <div className="lp-phases rv">
              {[
                { img: '/images/home/phase-intermediate.jpg', pos: '50% 35%', alt: 'Smiling primary school learners outdoors', grades: 'Grades 4–6', title: 'Intermediate phase', text: 'Build solid foundations in English, Maths and Natural Sciences.', href: '/subjects#int', t: 't1' },
                { img: '/images/home/phase-senior.jpg', pos: '50% 25%', alt: 'A learner absorbed in a book', grades: 'Grades 7–9', title: 'Senior phase', text: 'Get ready for high school with the full range of subjects.', href: '/subjects#sen', t: 't2' },
                { img: '/images/home/phase-fet.jpg', pos: '50% 30%', alt: 'Two learners reading a book together', grades: 'Grades 10–12', title: 'FET phase', text: 'Past papers and memos for the years that count, up to matric.', href: '/subjects#fet', t: 't3' },
              ].map((p) => (
                <div className={`lp-phase ${p.t}`} key={p.title}>
                  <div className="lp-phase-photo">
                    <Image src={p.img} alt={p.alt} fill sizes="(max-width: 680px) 100vw, 400px" style={{ objectPosition: p.pos }} />
                    <span className="lp-phase-chip">{p.grades}</span>
                  </div>
                  <div className="lp-phase-body">
                    <h3>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                  <a href={p.href} className="btn-soft">Browse subjects</a>
                </div>
              ))}
            </div>
            <div className="lp-subjects rv">
              {['English HL', 'Mathematics', 'Life Sciences', 'Physical Sciences', 'History', 'Geography', 'Accounting', 'Afrikaans HL', 'Business Studies', 'Economics', 'Natural Sciences', 'Social Sciences'].map((s) => (
                <span className="lp-subj" key={s}>{s}</span>
              ))}
              <a href="/subjects" className="lp-subj more">+ more</a>
            </div>
          </div>
        </section>

        {/* PAPERS */}
        <section className="lp-section" id="papers">
          <div className="spread-deco o2 lp-float slow" style={{ top: '20px', right: '-50px' }}>
            <Bloom size={200} tone="ochre" />
          </div>
          <div className="lp-wrap">
            <div className="lp-head rv">
              <div>
                <h2 className="lp-h2"><Bloom size={36} className="lp-h2-bloom" />Exam papers. Full memos. Yours to keep.</h2>
                <p>
                  Papers for every grade and subject, complete with full marking memos. Download them, study from them,
                  own them. We never charge for this, because access to good study material shouldn&apos;t depend on who you are.
                </p>
              </div>
              <a href="/papers" className="btn-primary">Browse papers</a>
            </div>
            <div className="lp-split rv">
              <div className="lp-photo-card">
                <Image src="/images/home/papers-notebook.jpg" alt="An open notebook with pencils beside it" fill sizes="(max-width: 960px) 100vw, 560px" style={{ objectPosition: '50% 50%' }} />
                <span className="lp-photo-sticker"><Bloom size={22} /> Free + memo</span>
              </div>
              <div className="lp-panel">
                <span className="lp-tag free">Always free</span>
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
              </div>
            </div>
          </div>
        </section>

        {/* DEEP LEARN */}
        <section className="lp-section">
          <div className="spread-deco o2 lp-float" style={{ bottom: '-30px', left: '3%' }}>
            <Bloom size={150} tone="moss" />
          </div>
          <div className="lp-wrap lp-split rv">
            <div className="lp-panel">
              <div className="chat">
                <span className="chat-label" style={{ alignSelf: 'flex-end' }}>you</span>
                <div className="chat-bubble cb-me">Why does photosynthesis matter? I keep forgetting.</div>
                <span className="chat-label">bloom</span>
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
            </div>
            <div className="lp-split-copy">
              <span className="lp-tag pro">Premium feature</span>
              <h2 className="lp-h2">Not just right or wrong. <span className="lp-accent squiggle">Actually</span> explained.</h2>
              <p>
                When you get something wrong, Curio doesn&apos;t just mark you down and move on. Bloom
                breaks down the concept from first principles, in plain language, with real examples,
                until it actually clicks.
              </p>
              <a href="/deeplearn" className="btn-soft">See how Bloom works</a>
            </div>
          </div>
        </section>

        {/* QUIZ */}
        <section className="lp-section" id="quiz">
          <div className="spread-deco o2 lp-float slow" style={{ top: '-20px', right: '4%' }}>
            <Bloom size={130} />
          </div>
          <div className="lp-wrap lp-split rv">
            <div className="lp-split-copy">
              <span className="lp-tag pro">Premium feature</span>
              <h2 className="lp-h2">Questions that <span className="lp-accent squiggle">actually</span> teach you.</h2>
              <p>
                Topic-sorted quizzes with instant, meaningful feedback. Build your own custom test.
                Work at your own pace. Every question is a chance to understand something better.
              </p>
              <div className="topic-tabs">
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
                    {isLast ? 'Restart' : 'Continue'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="lp-section" id="pricing">
          <div className="spread-deco o2 lp-float" style={{ top: '40px', left: '-60px' }}>
            <Bloom size={190} tone="ochre" />
          </div>
          <div className="lp-wrap">
            <div className="lp-head rv">
              <div>
                <h2 className="lp-h2"><Bloom size={36} className="lp-h2-bloom" />Honest pricing. For every student.</h2>
                <p>
                  Papers and memos are free, always. Premium adds the AI quizzes and explanations,
                  for less than a takeaway a month.
                </p>
              </div>
            </div>
            <div className="lp-plans rv">
              {[
                { name: 'Free plan', price: '0', per: '', sub: 'forever', cta: 'Get started free', pro: false },
                { name: 'Premium plan', price: '49', per: '/month', sub: 'founder pricing', cta: 'Subscribe', pro: true },
              ].map((plan) => (
                <div className={`lp-plan${plan.pro ? ' pro' : ''}`} key={plan.name}>
                  {plan.pro && <span className="lp-pick">our pick</span>}
                  <div className="lp-plan-inner">
                    <div className="lp-plan-title">{plan.name}</div>
                    <div className="lp-plan-price">
                      <sup>R</sup>{plan.price}<small>{plan.per}</small>
                    </div>
                    <div className="lp-plan-sub">{plan.sub}</div>
                    <div className="lp-feats">
                      <div className="lp-feats-title">What you get</div>
                      {PLAN_FEATURES.map((f) => {
                        const on = plan.pro || f.free
                        return (
                          <div className={`lp-feat${on ? '' : ' off'}`} key={f.label}>
                            <span className="lp-feat-ic">{on ? <Check size={13} /> : '×'}</span>
                            {f.label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <a href="/login?tab=signup" className="lp-plan-cta">{plan.cta}</a>
                </div>
              ))}
            </div>
            <div className="heart-note">
              <Heart size={16} className="heart-note-icon" />
              <span><strong>No student left behind.</strong> Exam papers and memos will always be free on Curio.
              No account needed, no strings attached. Because access to good study material shouldn&apos;t
              have a price tag.</span>
            </div>
          </div>
        </section>

        {/* CLOSING */}
        <section className="lp-section lp-last">
          <div className="lp-wrap">
            <div className="lp-closing rv">
              <div className="spread-deco lp-closing-b1 lp-float slow"><Bloom size={380} tone="paper" /></div>
              <div className="spread-deco lp-closing-b2 lp-float"><Bloom size={150} tone="paper" /></div>
              <div className="lp-closing-copy">
                <h2>You&apos;ve got this.</h2>
                <p>
                  Every student, no matter their school or their circumstances, deserves a real shot.
                  Curio is here to give it to you. Free to start. No card needed.
                </p>
                <div className="lp-actions" style={{ justifyContent: 'flex-start' }}>
                  <a href="/login?tab=signup" className="lp-btn-ink">Create your free account</a>
                  <a href="/papers" className="btn-soft">Browse papers</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
