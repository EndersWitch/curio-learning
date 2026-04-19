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
const CONFETTI_COLORS = ['#FF5E5B','#6DD3CE','#F5C842','#A855F7','#34D399','#FB923C']

interface Particle { id:number; left:number; top:number; color:string; duration:number; delay:number; size:number }

export default function ResultsScreen({
  result, levelTitle, sectionType, retryHref, nextHref, masteryUnlocked, broadMasteryUnlocked,
}: ResultsScreenProps) {
  const { score, total, passed, xpEarned, timeTaken } = result
  const percent = Math.round((score / total) * 100)

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

  // Score ring colour
  const ringColor  = percent >= 80 ? '#34D399' : percent >= 60 ? '#F5C842' : '#FF5E5B'
  const scoreColor = percent >= 80 ? '#6ee7b7' : percent >= 60 ? '#fde68a' : '#fca5a5'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5"
      style={{ background: '#1a1228' }}>

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

        {/* ── Hero score card ── */}
        <div className="rounded-3xl p-8 mb-4 text-center"
          style={{ background: '#231935', border: `2px solid ${ringColor}40` }}>

          {/* Score ring */}
          <div className="w-32 h-32 mx-auto mb-5 rounded-full flex flex-col items-center justify-center"
            style={{ background: '#2B1E3F', boxShadow: `0 0 0 6px ${ringColor}40, 0 0 0 3px ${ringColor}` }}>
            <span className="text-4xl font-black" style={{ color: ringColor }}>{percent}%</span>
            <span className="text-xs font-semibold mt-0.5" style={{ color: '#9b8ab0' }}>
              {score}/{total}
            </span>
          </div>

          {/* Pass/fail badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm mb-4 text-white"
            style={{ background: passed ? '#34D399' : '#FF5E5B',
              boxShadow: passed ? '0 4px 16px rgba(52,211,153,0.35)' : '0 4px 16px rgba(255,94,91,0.35)' }}>
            {passed ? '🎉 Passed!' : '😤 Not Passed'}
          </div>

          <h2 className="text-xl font-black mb-1 leading-tight" style={{ color: '#F7F7FF' }}>
            {messageRef.current}
          </h2>
          <p className="text-sm" style={{ color: '#9b8ab0' }}>{levelTitle}</p>
        </div>

        {/* ── Stats ── */}
        <div className="rounded-3xl p-5 mb-4"
          style={{ background: '#231935', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="grid grid-cols-3 gap-0 divide-x" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {[
              { val: String(score),     label: 'Correct' },
              { val: String(total - score), label: 'Missed' },
              { val: timeLabel,         label: 'Time' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center px-3">
                <div className="text-2xl font-black" style={{ color: '#F7F7FF' }}>{val}</div>
                <div className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── XP earned ── */}
        {xpEarned > 0 && (
          <div className="rounded-3xl p-5 mb-4 flex items-center justify-between"
            style={{ background: '#231935', border: '1px solid rgba(245,200,66,0.25)' }}>
            <div>
              <p className="font-black text-sm" style={{ color: '#F7F7FF' }}>XP Earned</p>
              <p className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>
                {passed ? 'Keep it up!' : 'Every attempt counts!'}
              </p>
            </div>
            <XPBadge xp={xpEarned} animate={xpAnimated} size="lg" />
          </div>
        )}

        {/* ── Mastery unlocks ── */}
        {masteryUnlocked && !broadMasteryUnlocked && (
          <div className="rounded-3xl p-5 mb-4 flex items-center gap-4"
            style={{ background: '#231935', border: '1px solid rgba(245,200,66,0.35)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)' }}>
              🏆
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: '#F5C842' }}>Subtopic Mastery Unlocked!</p>
              <p className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>
                All levels cleared — take the mastery challenge!
              </p>
            </div>
          </div>
        )}

        {broadMasteryUnlocked && (
          <div className="rounded-3xl p-5 mb-4 flex items-center gap-4"
            style={{ background: '#231935', border: '1px solid rgba(109,211,206,0.35)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(109,211,206,0.12)', border: '1px solid rgba(109,211,206,0.3)' }}>
              👑
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: '#6DD3CE' }}>Final Mastery Unlocked!</p>
              <p className="text-xs mt-0.5" style={{ color: '#9b8ab0' }}>
                All subtopics mastered — the final boss awaits!
              </p>
            </div>
          </div>
        )}

        {isMastery && passed && (
          <div className="rounded-3xl p-5 mb-4 text-center"
            style={{ background: 'linear-gradient(135deg, #2B1E3F 0%, #3d2d58 100%)',
              border: '2px solid rgba(109,211,206,0.3)' }}>
            <div className="text-2xl mb-1">
              {sectionType === 'broad_topic_mastery' ? '👑' : '🏆'}
            </div>
            <p className="font-black text-base" style={{ color: '#6DD3CE' }}>
              {sectionType === 'broad_topic_mastery' ? 'Ultimate Topic Champion!' : 'Subtopic Champion!'}
            </p>
            <p className="text-xs mt-1" style={{ color: '#9b8ab0' }}>
              {sectionType === 'broad_topic_mastery'
                ? 'You have completely mastered this entire topic.'
                : 'This subtopic is fully mastered. On to the next!'}
            </p>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="flex flex-col gap-3">
          {passed && nextHref && (
            <Link href={nextHref}
              className="w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#FF5E5B', boxShadow: '0 4px 20px rgba(255,94,91,0.35)' }}>
              Next Level →
            </Link>
          )}
          {passed && !nextHref && (
            <Link href="/quiz"
              className="w-full py-4 rounded-2xl font-black text-base text-white text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#FF5E5B', boxShadow: '0 4px 20px rgba(255,94,91,0.35)' }}>
              🏠 Browse More Topics
            </Link>
          )}

          <Link href={retryHref}
            className="w-full py-4 rounded-2xl font-black text-base text-center transition-all duration-200"
            style={passed
              ? { background: 'rgba(255,255,255,0.06)', color: '#F7F7FF', border: '2px solid rgba(255,255,255,0.12)' }
              : { background: '#FF5E5B', color: '#fff', boxShadow: '0 4px 20px rgba(255,94,91,0.35)' }
            }>
            {passed ? '🔄 Try Again' : '🔄 Try Again — You Can Do It!'}
          </Link>
        </div>

        {!passed && (
          <p className="text-center text-xs mt-4 leading-relaxed" style={{ color: '#9b8ab0' }}>
            You need {Math.ceil(total * 0.6)} correct to pass.
            Review the learning zone before retrying!
          </p>
        )}
      </div>
    </div>
  )
}
