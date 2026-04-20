'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ShuffledQuestion, QuizResult } from '@/types/quiz'
import { ProgressBar, XPBadge } from '@/components/ui/XPBar'
import { calculateXP } from '@/lib/progress'

interface QuizRunnerProps {
  questions: ShuffledQuestion[]
  levelId: string
  sectionType: string
  baseXP: number
  passThreshold: number
  onComplete: (result: QuizResult) => void
}

type AnswerState = 'idle' | 'correct' | 'wrong'

const CORRECT_MESSAGES = [
  'Great job! 🎉', 'Correct! ✨', 'Well done! 🎯',
  'Nailed it! 🚀', 'Brilliant! 💫', 'You got it! 🎯', 'Superstar! ⭐',
]
const WRONG_MESSAGES = [
  'Not quite — check the answer below 👇',
  "Keep going! Every mistake teaches 💪",
  "Oops! Let's learn from this 📚",
  'Almost! Look at the correct answer 🔍',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Render text with <strong> tags and *asterisk* → cyan highlight
function RichText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  // Parse: <strong>...</strong> and *...*
  const parts: { content: string; bold?: boolean; cyan?: boolean }[] = []
  let remaining = text
  while (remaining.length > 0) {
    const strongStart = remaining.indexOf('<strong>')
    const asteriskStart = remaining.indexOf('*')
    const next = Math.min(
      strongStart >= 0 ? strongStart : Infinity,
      asteriskStart >= 0 ? asteriskStart : Infinity
    )
    if (next === Infinity) { parts.push({ content: remaining }); break }
    if (next > 0) parts.push({ content: remaining.slice(0, next) })
    if (strongStart >= 0 && strongStart === next) {
      const end = remaining.indexOf('</strong>', strongStart)
      if (end < 0) { parts.push({ content: remaining }); break }
      parts.push({ content: remaining.slice(strongStart + 8, end), bold: true })
      remaining = remaining.slice(end + 9)
    } else {
      // asterisk
      const closeAsterisk = remaining.indexOf('*', asteriskStart + 1)
      if (closeAsterisk < 0) { parts.push({ content: remaining }); break }
      parts.push({ content: remaining.slice(asteriskStart + 1, closeAsterisk), cyan: true })
      remaining = remaining.slice(closeAsterisk + 1)
    }
  }

  return (
    <span className={className} style={style}>
      {parts.map((p, i) =>
        p.bold ? <strong key={i} style={{ fontWeight: 700, color: '#F7F7FF' }}>{p.content}</strong>
        : p.cyan ? <span key={i} style={{ color: '#6DD3CE', fontWeight: 600 }}>{p.content}</span>
        : <span key={i}>{p.content}</span>
      )}
    </span>
  )
}

// Curio colour tokens
const CURIO = {
  bg:         '#1a1228',
  card:       '#231935',
  cardBorder: 'rgba(109,211,206,0.15)',
  text:       '#F7F7FF',
  subtext:    '#9b8ab0',
  coral:      '#FF5E5B',
  cyan:       '#6DD3CE',
  amber:      '#F5C842',
}

export default function QuizRunner({
  questions, levelId, sectionType, baseXP, passThreshold, onComplete,
}: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected]         = useState<string | null>(null)
  const [answerState, setAnswerState]   = useState<AnswerState>('idle')
  const [startTime]  = useState(Date.now())
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const scoreRef    = useRef(0)
  const feedbackRef = useRef('')

  const current         = questions[currentIndex]
  const progressPercent = ((currentIndex + (answerState !== 'idle' ? 1 : 0)) / questions.length) * 100
  const isLast          = currentIndex === questions.length - 1
  const xpPerQ          = Math.max(1, Math.round(baseXP / questions.length))

  const handleSelect = useCallback((key: string) => {
    if (answerState !== 'idle') return
    const correct = key === current.correct_key
    setSelected(key)
    setAnswerState(correct ? 'correct' : 'wrong')
    feedbackRef.current = correct ? pickRandom(CORRECT_MESSAGES) : pickRandom(WRONG_MESSAGES)
    if (correct) { scoreRef.current += 1; setScoreDisplay(scoreRef.current) }
  }, [answerState, current])

  const handleNext = useCallback(() => {
    if (answerState === 'idle') return
    if (isLast) {
      const finalScore = scoreRef.current
      const total      = questions.length
      const passed     = finalScore / total >= passThreshold
      const timeTaken  = Math.round((Date.now() - startTime) / 1000)
      const xpEarned   = calculateXP({ score: finalScore, total, sectionType, baseXP })
      onComplete({ score: finalScore, total, passed, xpEarned, timeTaken })
    } else {
      setCurrentIndex(i => i + 1)
      setSelected(null)
      setAnswerState('idle')
      feedbackRef.current = ''
    }
  }, [isLast, answerState, questions.length, passThreshold, startTime, sectionType, baseXP, onComplete])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (answerState === 'idle') {
        const keyMap: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 }
        const idx = keyMap[e.key]
        if (idx !== undefined && current.options[idx]) handleSelect(current.options[idx].key)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answerState, current, handleSelect, handleNext])

  function optionStyle(optKey: string): React.CSSProperties {
    if (answerState === 'idle') {
      return { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: CURIO.text, cursor: 'pointer' }
    }
    if (optKey === current.correct_key) {
      return { background: 'rgba(52,211,153,0.12)', borderColor: '#34D399', color: '#6ee7b7' }
    }
    if (optKey === selected) {
      return { background: 'rgba(255,94,91,0.12)', borderColor: CURIO.coral, color: '#fca5a5' }
    }
    return { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', color: CURIO.subtext, opacity: 0.5 }
  }

  function bubbleStyle(optKey: string): React.CSSProperties {
    if (answerState !== 'idle') {
      if (optKey === current.correct_key) return { background: '#34D399', color: '#fff' }
      if (optKey === selected)            return { background: CURIO.coral, color: '#fff' }
    }
    return { background: 'rgba(255,255,255,0.10)', color: CURIO.subtext }
  }

  return (
    <div className="w-full max-w-2xl mx-auto select-none">

      {/* Progress strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-black tabular-nums min-w-[3.5rem]" style={{ color: CURIO.subtext }}>
          {currentIndex + 1}/{questions.length}
        </span>
        <div className="flex-1">
          <ProgressBar value={progressPercent} color="bg-gradient-to-r from-[#FF5E5B] to-[#6DD3CE]" />
        </div>
        <XPBadge xp={scoreDisplay * xpPerQ} size="sm" />
      </div>

      {/* Question card */}
      <div key={`q-${currentIndex}`} className="rounded-3xl p-7 mb-5 animate-fade-slide"
        style={{ background: CURIO.card, border: `1px solid ${CURIO.cardBorder}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(109,211,206,0.12)', color: CURIO.cyan }}>
            Question {currentIndex + 1}
          </span>
          {sectionType === 'subtopic_mastery' && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(245,200,66,0.12)', color: CURIO.amber }}>
              🏆 Mastery
            </span>
          )}
          {sectionType === 'broad_topic_mastery' && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(109,211,206,0.12)', color: CURIO.cyan }}>
              🎓 Final Boss
            </span>
          )}
        </div>
        <RichText text={current.question_text}
          className="text-lg md:text-xl font-black leading-relaxed"
          style={{ color: CURIO.text }} />
      </div>

      {/* Answer options */}
      <div key={`opts-${currentIndex}`} className="grid grid-cols-1 gap-3 mb-5 animate-fade-slide"
        style={{ animationDelay: '60ms' }}>
        {current.options.map((opt, i) => {
          const isWrong = answerState === 'wrong' && opt.key === selected
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={answerState !== 'idle'}
              aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt.text}`}
              className={`flex items-center gap-4 w-full text-left rounded-2xl border-2 px-5 py-4 font-semibold text-base transition-all duration-200 disabled:cursor-default focus:outline-none ${isWrong ? 'animate-[wrongShake_0.35s_ease-in-out]' : ''}`}
              style={optionStyle(opt.key)}
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-colors duration-200"
                style={bubbleStyle(opt.key)}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-snug">
                <RichText text={opt.text} />
              </span>
              {answerState !== 'idle' && opt.key === current.correct_key && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: '#34D399', color: '#fff' }}>✓</span>
              )}
              {answerState === 'wrong' && opt.key === selected && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: CURIO.coral, color: '#fff' }}>✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback bar — always shows explanation immediately when answered */}
      {answerState !== 'idle' && (
        <div className="rounded-2xl px-5 py-4 mb-4 border-2 animate-fade-slide"
          style={answerState === 'correct'
            ? { background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.3)' }
            : { background: 'rgba(255,94,91,0.08)', borderColor: 'rgba(255,94,91,0.3)' }
          }>
          <p className="font-black text-base mb-2"
            style={{ color: answerState === 'correct' ? '#6ee7b7' : '#fca5a5' }}>
            {feedbackRef.current}
          </p>
          {/* Explanation always visible immediately — no button */}
          {current.explanation && (
            <p className="text-sm leading-relaxed pt-2"
              style={{ color: CURIO.subtext, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <RichText text={current.explanation} />
            </p>
          )}
        </div>
      )}

      {/* Next / Finish button */}
      {answerState !== 'idle' && (
        <button onClick={handleNext}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: CURIO.coral, boxShadow: '0 4px 20px rgba(255,94,91,0.35)' }}>
          {isLast ? '🏁 See My Results' : 'Next Question →'}
        </button>
      )}

      <p className="text-center text-xs mt-4" style={{ color: CURIO.subtext }}>
        {answerState === 'idle' ? 'Press 1–4 to answer' : 'Press Enter or Space to continue'}
      </p>
    </div>
  )
}
