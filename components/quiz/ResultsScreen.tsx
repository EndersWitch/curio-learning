'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import type { QuizResult } from '@/types/quiz'
import { XPBadge } from '@/components/ui/XPBar'

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
  "You absolutely smashed it! 🚀",
  "Outstanding work! You're on fire! 🔥",
  "That was brilliant! Keep it up! 🌟",
  "Wow! You're a real star! ⭐",
  "Incredible effort! So proud of you! 🎊",
]

const FAIL_MESSAGES = [
  "So close! Let's try again — you've got this! 💪",
  "Don't give up! Every attempt makes you stronger! 🏋️",
  "Nice try! Review the learning zone and go again! 📚",
  "Almost there! One more go and you'll nail it! 🎯",
]

const CONFETTI_COLORS = ['#FF5E5B', '#6DD3CE', '#F5C842', '#A855F7', '#34D399', '#FB923C']

interface ConfettiParticle {
  id: number
  left: number
  top: number
  color: string
  duration: number
  delay: number
  size: number
}

export default function ResultsScreen({
  result,
  levelTitle,
  sectionType,
  retryHref,
  nextHref,
  masteryUnlocked,
  broadMasteryUnlocked,
}: ResultsScreenProps) {
  const { score, total, passed, xpEarned, timeTaken } = result
  const percent = Math.round((score / total) * 100)

  // Lock message and confetti on first render — useRef so they never change
  const messageRef = useRef(
    passed
      ? PASS_MESSAGES[Math.floor(Math.random() * PASS_MESSAGES.length)]
      : FAIL_MESSAGES[Math.floor(Math.random() * FAIL_MESSAGES.length)]
  )

  // Generate confetti particles once, client-side only
  const [particles, setParticles] = useState<ConfettiParticle[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [xpAnimated, setXpAnimated] = useState(false)

  useEffect(() => {
    if (!passed) return

    // Generate stable particles after mount (avoids SSR/hydration mismatch)
    const generated: ConfettiParticle[] = Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 70,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      duration: 0.6 + Math.random() * 1.2,
      delay: Math.random() * 0.8,
      size: 6 + Math.floor(Math.random() * 8),
    }))
    setParticles(generated)
    setShowConfetti(true)

    const hideTimer = setTimeout(() => setShowConfetti(false), 3500)
    const xpTimer = setTimeout(() => setXpAnimated(true), 400)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(xpTimer)
    }
  }, [passed])

  const isMastery = sectionType === 'subtopic_mastery' || sectionType === 'broad_topic_mastery'

  const scoreColor =
    percent >= 80 ? 'text-emerald-600' : percent >= 60 ? 'text-amber-600' : 'text-rose-600'
  const scoreRingColor =
    percent >= 80 ? 'ring-emerald-400' : percent >= 60 ? 'ring-amber-400' : 'ring-rose-400'
  const scoreBg =
    percent >= 80
      ? 'from-emerald-50 to-teal-50 border-emerald-200'
      : percent >= 60
      ? 'from-amber-50 to-yellow-50 border-amber-200'
      : 'from-rose-50 to-pink-50 border-rose-200'

  const minutes = Math.floor(timeTaken / 60)
  const seconds = timeTaken % 60
  const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-cyan-50 flex flex-col items-center justify-center p-5">

      {/* ── Confetti burst ─────────────────────────────────────── */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden="true">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full animate-bounce"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                backgroundColor: p.color,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="w-full max-w-md">

        {/* ── Hero score card ─────────────────────────────────── */}
        <div className={`bg-gradient-to-br ${scoreBg} rounded-3xl border-2 p-8 mb-4 text-center shadow-xl`}>

          {/* Score ring */}
          <div
            className={`w-32 h-32 mx-auto mb-5 rounded-full ring-8 ${scoreRingColor} bg-white flex flex-col items-center justify-center shadow-lg`}
          >
            <span className={`text-4xl font-black ${scoreColor}`}>{percent}%</span>
            <span className="text-xs text-slate-400 font-semibold mt-0.5">
              {score}/{total} correct
            </span>
          </div>

          {/* Pass / fail status */}
          <div
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm mb-4 ${
              passed
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                : 'bg-rose-500 text-white shadow-lg shadow-rose-200'
            }`}
          >
            {passed ? '🎉 Passed!' : '😤 Not Passed'}
          </div>

          {/* Message */}
          <h2 className="text-xl font-black text-slate-800 mb-1 leading-tight">
            {messageRef.current}
          </h2>
          <p className="text-sm text-slate-500">{levelTitle}</p>
        </div>

        {/* ── Stats row ──────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 mb-4">
          <div className="grid grid-cols-3 divide-x divide-slate-100">
            <div className="text-center px-3">
              <div className="text-2xl font-black text-slate-800">{score}</div>
              <div className="text-xs text-slate-400 mt-0.5">Correct</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-black text-slate-800">{total - score}</div>
              <div className="text-xs text-slate-400 mt-0.5">Missed</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-black text-slate-800">{timeLabel}</div>
              <div className="text-xs text-slate-400 mt-0.5">Time</div>
            </div>
          </div>
        </div>

        {/* ── XP earned ─────────────────────────────────────── */}
        {xpEarned > 0 && (
          <div className="bg-white rounded-3xl border border-amber-200 shadow-sm p-5 mb-4 flex items-center justify-between">
            <div>
              <p className="font-black text-slate-800 text-sm">XP Earned</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {passed ? 'Keep it up!' : 'Even in a miss, you learn!'}
              </p>
            </div>
            <XPBadge xp={xpEarned} animate={xpAnimated} size="lg" />
          </div>
        )}

        {/* ── Unlock announcements ───────────────────────────── */}
        {masteryUnlocked && !broadMasteryUnlocked && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-5 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-amber-200">
              🏆
            </div>
            <div>
              <p className="font-black text-amber-800 text-sm">Subtopic Mastery Unlocked!</p>
              <p className="text-xs text-amber-600 mt-0.5">
                You've beaten all levels in this section — take the mastery challenge!
              </p>
            </div>
          </div>
        )}

        {broadMasteryUnlocked && (
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border-2 border-violet-300 rounded-3xl p-5 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xl flex-shrink-0 shadow-md shadow-violet-200">
              👑
            </div>
            <div>
              <p className="font-black text-violet-800 text-sm">Final Mastery Unlocked!</p>
              <p className="text-xs text-violet-600 mt-0.5">
                All subtopics mastered — the final boss is waiting for you!
              </p>
            </div>
          </div>
        )}

        {isMastery && passed && (
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-5 mb-4 text-center text-white shadow-xl shadow-violet-200">
            <div className="text-2xl mb-1">
              {sectionType === 'broad_topic_mastery' ? '👑' : '🏆'}
            </div>
            <p className="font-black text-base">
              {sectionType === 'broad_topic_mastery'
                ? 'Ultimate Topic Champion!'
                : 'Subtopic Champion!'}
            </p>
            <p className="text-xs text-violet-200 mt-1">
              {sectionType === 'broad_topic_mastery'
                ? 'You have completely mastered this entire topic.'
                : 'This subtopic is fully mastered. On to the next!'}
            </p>
          </div>
        )}

        {/* ── Action buttons ─────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {passed && nextHref ? (
            <Link
              href={nextHref}
              className="w-full py-4 rounded-2xl font-black text-base text-white text-center
                bg-gradient-to-r from-violet-600 to-indigo-600
                shadow-xl shadow-violet-200 hover:shadow-2xl hover:-translate-y-0.5
                transition-all duration-200 active:translate-y-0"
            >
              Next Level →
            </Link>
          ) : passed ? (
            <Link
              href={`/quiz`}
              className="w-full py-4 rounded-2xl font-black text-base text-white text-center
                bg-gradient-to-r from-violet-600 to-indigo-600
                shadow-xl shadow-violet-200 hover:shadow-2xl hover:-translate-y-0.5
                transition-all duration-200"
            >
              🏠 Browse More Topics
            </Link>
          ) : null}

          <Link
            href={retryHref}
            className={`w-full py-4 rounded-2xl font-black text-base text-center transition-all duration-200
              ${passed
                ? 'bg-white text-slate-700 border-2 border-slate-200 hover:border-violet-300 hover:bg-violet-50'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-200 hover:shadow-2xl hover:-translate-y-0.5'
              }`}
          >
            {passed ? '🔄 Try Again' : '🔄 Try Again — You Can Do It!'}
          </Link>

          {!passed && (
            <Link
              href={retryHref.replace('/learn', '').replace(/\/[^/]+$/, '')}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-slate-500 text-center hover:text-violet-600 transition-colors"
            >
              ← Back to Learning Zone
            </Link>
          )}
        </div>

        {/* Encouragement footer */}
        {!passed && (
          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            You need {Math.ceil(total * 0.6)} correct to pass.{' '}
            Review the learning zone tips before retrying!
          </p>
        )}
      </div>
    </div>
  )
}
