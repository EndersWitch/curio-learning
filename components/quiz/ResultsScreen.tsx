'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { QuizResult } from '@/types/quiz'
import { XPBadge } from '@/components/ui/XPBar'
import { useAuth } from '@/lib/auth-context'
import { Trophy, GraduationCap, Home, RefreshCw, Check, X } from '@/components/icons'

interface ResultsScreenProps {
  result: QuizResult
  levelTitle: string
  sectionType: string
  retryHref: string
  nextHref?: string
  masteryUnlocked?: boolean
  broadMasteryUnlocked?: boolean
}

const PASS_MESSAGES = [
  'You absolutely smashed it!',
  "Outstanding work! You're on fire!",
  'That was brilliant! Keep it up!',
  "Wow! You're a real star!",
  'Incredible effort! So proud of you!',
]
const FAIL_MESSAGES = [
  "So close! Let's try again. You've got this!",
  "Don't give up! Every attempt makes you stronger!",
  'Nice try! Review the learning zone and go again!',
  "Almost there! One more go and you'll nail it!",
]
const CONFETTI_COLORS = ['#B8451F', '#B8451F', '#A9752A', '#3F6B3D']

interface Particle { id:number; left:number; top:number; color:string; duration:number; delay:number; size:number }

// Drives the pop-in + sequential petal reveal + percent count-up timing.
// Shared by the bloom SVG, the score text, and the petal legend dots so
// everything stays in sync.
function useBloomReveal(percent: number) {
  const litPetals = Math.round(percent / 20) // 0-5

  const [popped, setPopped]       = useState(false)
  const [revealed, setRevealed]   = useState(0)
  const [pulseIndex, setPulseIndex] = useState<number | null>(null)
  const [displayPercent, setDisplayPercent] = useState(0)
  const [centerActive, setCenterActive] = useState(false)
  const [centerBump, setCenterBump]     = useState(false)

  useEffect(() => {
    const PETAL_STEP = 320
    const START_DELAY = 450
    const timers: ReturnType<typeof setTimeout>[] = []

    timers.push(setTimeout(() => setPopped(true), 50))

    for (let i = 1; i <= litPetals; i++) {
      timers.push(setTimeout(() => {
        setRevealed(i)
        setPulseIndex(i - 1)
        timers.push(setTimeout(() => setPulseIndex(null), 420))
      }, START_DELAY + i * PETAL_STEP))
    }

    const centerDelay = START_DELAY + (litPetals + 1) * PETAL_STEP
    timers.push(setTimeout(() => {
      setCenterActive(true)
      setCenterBump(true)
      timers.push(setTimeout(() => setCenterBump(false), 450))
    }, centerDelay))

    // Count the percentage up in sync with the petal reveal
    let raf: number
    const start = performance.now()
    function tick() {
      const t = Math.min(1, (performance.now() - start) / centerDelay)
      setDisplayPercent(Math.round(t * percent))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => { timers.forEach(clearTimeout); cancelAnimationFrame(raf) }
  }, [percent, litPetals])

  return { popped, revealed, pulseIndex, displayPercent, centerActive, centerBump }
}

// Bloom SVG with 5 petals that light up one-by-one based on score % — purely
// decorative now, no overlaid text (that's rendered separately for legibility).
// Pops in on mount, then each petal lights up in sequence with a glow + punch,
// and the centre pops once the reveal finishes.
//
// NOTE: rotation MUST stay on a plain SVG attribute (on a wrapping <g>, never
// combined with a CSS `transition` on the same element) — adding a CSS
// `transition`/`transform` to an element that also has an SVG `transform`
// attribute makes the browser drop the attribute-based transform entirely,
// which is what made every petal collapse into one unrotated stack before.
function BloomScore({ percent, passed, reveal }: {
  percent: number; passed: boolean; reveal: ReturnType<typeof useBloomReveal>
}) {
  const petalAngles = [0, 72, 144, 216, 288]
  const { popped, revealed, pulseIndex, centerActive, centerBump } = reveal

  return (
    <div className="relative flex items-center justify-center" style={{ width: 160, height: 160 }}>
      <svg width="160" height="160" viewBox="0 0 200 200" fill="none"
        style={{
          transform: popped ? 'scale(1)' : 'scale(0)',
          opacity: popped ? 1 : 0,
          transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}>
        {petalAngles.map((angle, i) => {
          const isLit = i < revealed
          const pulsing = i === pulseIndex
          return (
            <g key={i} transform={`rotate(${angle} 100 100)`}>
              <ellipse
                cx="100" cy="50" rx="22" ry="42"
                fill={isLit ? '#B8451F' : '#EAE0C6'}
                fillOpacity={isLit ? 1 : 0.5}
                stroke={isLit ? '#B8451F' : 'rgba(184,69,31,0.2)'}
                strokeWidth={isLit ? 1.5 : 0.5}
                style={{
                  transform: `scale(${pulsing ? 1.22 : 1})`,
                  transformOrigin: '100px 50px',
                  filter: isLit ? 'drop-shadow(0 0 10px rgba(184,69,31,0.85))' : 'none',
                  transition: 'fill 0.35s ease, filter 0.35s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              />
            </g>
          )
        })}
        {/* Centre circle */}
        <circle cx="100" cy="100" r="22"
          fill={passed && centerActive ? '#B8451F' : '#EAE0C6'}
          style={{
            transform: `scale(${centerBump ? 1.28 : 1})`,
            transformOrigin: '100px 100px',
            filter: 'none',
            transition: 'fill 0.3s ease, filter 0.3s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </svg>
    </div>
  )
}

export default function ResultsScreen({
  result, levelTitle, sectionType, retryHref, nextHref, masteryUnlocked, broadMasteryUnlocked,
}: ResultsScreenProps) {
  const { score, total, passed, xpEarned, timeTaken } = result
  const percent = Math.round((score / total) * 100)
  const reveal = useBloomReveal(percent)
  const { refreshUser } = useAuth()

  useEffect(() => { refreshUser() }, [])

  const messageRef = useRef(
    passed
      ? PASS_MESSAGES[Math.floor(Math.random() * PASS_MESSAGES.length)]
      : FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]
  )
  const [particles, setParticles] = useState<Particle[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpAnimated, setXpAnimated]   = useState(false)

  useEffect(() => {
    if (!passed) return

    setParticles(Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left:     Math.random() * 100,
      top:      Math.random() * 70,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: 0.6 + Math.random() * 1.2,
      delay:    Math.random() * 0.8,
      size:     6 + Math.floor(Math.random() * 8),
    })))
    setShowConfetti(true)
    const t1 = setTimeout(() => setShowConfetti(false), 3500)
    const t2 = setTimeout(() => setXpAnimated(true), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [passed])

  const isMastery = sectionType === 'subtopic_mastery' || sectionType === 'broad_topic_mastery'
  const minutes   = Math.floor(timeTaken / 60)
  const seconds   = timeTaken % 60
  const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  const ringColor  = percent >= 80 ? '#3F6B3D' : percent >= 60 ? '#A9752A' : '#9C3428'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: '#F6F0E2' }}>

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
          {particles.map(p => (
            <span key={p.id} className="absolute rounded-full animate-bounce"
              style={{
                left: `${p.left}%`, top: `${p.top}%`,
                backgroundColor: p.color, width: p.size, height: p.size,
                animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
              }} />
          ))}
        </div>
      )}

      <div className="w-full max-w-md">

        {/* ── Hero card with Bloom ── */}
        <div className="rounded-3xl p-8 mb-4 text-center"
          style={{ background: '#FBF8EF', border: `2px solid ${ringColor}40` }}>

          {/* Animated Bloom — purely decorative, pop-in + sequential petal reveal */}
          <div className="flex justify-center mb-3">
            <BloomScore percent={percent} passed={passed} reveal={reveal} />
          </div>

          {/* Score — its own clearly legible block, not overlaid on the bloom */}
          <div className="mb-1">
            <span className="text-5xl font-black tabular-nums" style={{ color: '#211A13' }}>
              {reveal.displayPercent}%
            </span>
          </div>
          <p className="text-sm font-bold mb-4" style={{ color: 'rgba(33,26,19,0.55)' }}>
            {score}/{total} correct
          </p>

          {/* Petal legend — lights up in sync with the bloom above */}
          <div className="flex justify-center gap-1 mb-4">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i < reveal.revealed ? '#B8451F' : 'rgba(184,69,31,0.15)',
                  boxShadow: i < reveal.revealed ? '0 0 6px rgba(184,69,31,0.6)' : 'none',
                }} />
            ))}
          </div>

          {/* Pass/fail badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm mb-4 text-white"
            style={{ background: passed ? '#3F6B3D' : '#9C3428' }}>
            {passed ? <Check size={16} /> : <X size={16} />}
            {passed ? 'Passed!' : 'Not Passed'}
          </div>

          <h2 className="text-xl font-black mb-1 leading-tight" style={{ color: '#211A13' }}>
            {messageRef.current}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(33,26,19,0.55)' }}>{levelTitle}</p>
        </div>

        {/* ── Stats ── */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: '#FBF8EF', border: '1px solid rgba(33,26,19,0.1)' }}>
          <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: 'rgba(33,26,19,0.1)' }}>
            {[
              { val: String(score),       label: 'Correct', color: '#3F6B3D' },
              { val: String(total-score), label: 'Missed',  color: '#9C3428' },
              { val: timeLabel,           label: 'Time',    color: 'rgba(33,26,19,0.55)' },
            ].map(({ val, label, color }) => (
              <div key={label} className="text-center px-3">
                <div className="text-2xl font-black" style={{ color }}>{val}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(33,26,19,0.55)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── XP earned ── */}
        {xpEarned > 0 && (
          <div className="rounded-3xl p-5 mb-4 flex items-center justify-between"
            style={{ background: '#FBF8EF', border: '1px solid rgba(169,117,42,0.25)' }}>
            <div>
              <p className="font-black text-sm" style={{ color: '#211A13' }}>XP Earned</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(33,26,19,0.55)' }}>
                {passed ? 'Keep it up!' : 'Every attempt counts!'}
              </p>
            </div>
            <XPBadge xp={xpEarned} animate={xpAnimated} size="lg" />
          </div>
        )}

        {/* ── Mastery unlocks ── */}
        {masteryUnlocked && !broadMasteryUnlocked && (
          <div className="rounded-3xl p-5 mb-4 flex items-center gap-4"
            style={{ background: '#FBF8EF', border: '1px solid rgba(169,117,42,0.35)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(169,117,42,0.15)', border: '1px solid rgba(169,117,42,0.3)', color: '#A9752A' }}>
              <Trophy size={22} />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: '#A9752A' }}>Subtopic Mastery Unlocked!</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(33,26,19,0.55)' }}>All levels cleared. Take the mastery challenge!</p>
            </div>
          </div>
        )}

        {broadMasteryUnlocked && (
          <div className="rounded-3xl p-5 mb-4 flex items-center gap-4"
            style={{ background: '#FBF8EF', border: '1px solid rgba(184,69,31,0.35)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(184,69,31,0.12)', border: '1px solid rgba(184,69,31,0.3)', color: '#B8451F' }}>
              <GraduationCap size={22} />
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: '#B8451F' }}>Final Mastery Unlocked!</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(33,26,19,0.55)' }}>All subtopics mastered. The final boss awaits!</p>
            </div>
          </div>
        )}

        {isMastery && passed && (
          <div className="rounded-3xl p-5 mb-4 text-center"
            style={{ background: '#F4ECDD',
              border: '2px solid rgba(169,117,42,0.3)' }}>
            <div className="flex justify-center mb-1" style={{ color: '#B8451F' }}>
              {sectionType === 'broad_topic_mastery' ? <GraduationCap size={26} /> : <Trophy size={26} />}
            </div>
            <p className="font-black text-base" style={{ color: '#B8451F' }}>
              {sectionType === 'broad_topic_mastery' ? 'Ultimate Topic Champion!' : 'Subtopic Champion!'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(33,26,19,0.55)' }}>
              {sectionType === 'broad_topic_mastery'
                ? 'You have completely mastered this entire topic.'
                : 'This subtopic is fully mastered. On to the next!'}
            </p>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3">
          {passed && nextHref && (
            <Link href={nextHref}
              className="w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#B8451F' }}>
              Next Level →
            </Link>
          )}
          {passed && !nextHref && (
            <Link href="/quiz"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#B8451F' }}>
              <Home size={18} /> Browse More Topics
            </Link>
          )}

          <Link href={retryHref}
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-black text-base text-center transition-all duration-200"
            style={passed
              ? { background: 'rgba(33,26,19,0.06)', color: '#211A13', border: '2px solid rgba(33,26,19,0.15)' }
              : { background: '#B8451F', color: '#fff' }
            }>
            <RefreshCw size={16} /> {passed ? 'Try Again' : 'Try Again, You Can Do It!'}
          </Link>
        </div>

        {!passed && (
          <p className="text-center text-xs mt-4 leading-relaxed" style={{ color: 'rgba(33,26,19,0.55)' }}>
            You need {Math.ceil(total * 0.6)} correct to pass.
            Review the learning zone before retrying!
          </p>
        )}
      </div>
    </div>
  )
}
