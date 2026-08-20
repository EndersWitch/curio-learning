'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { ShuffledQuestion, QuizResult } from '@/types/quiz'
import { ProgressBar, XPBadge } from '@/components/ui/XPBar'
import { calculateXP } from '@/lib/progress'
import { Zap, Trophy, GraduationCap, ArrowRight, Check, X } from '@/components/icons'

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
  'Great job!', 'Correct!', 'Well done!',
  'Nailed it!', 'Brilliant!', 'You got it!', 'Superstar!',
]
const WRONG_MESSAGES = [
  'Not quite. Check the answer below',
  'Keep going! Every mistake teaches you something',
  "Oops! Let's learn from this",
  'Almost! Look at the correct answer',
]

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Mirrors the server-side weighting in the award_quiz_xp RPC — used here only
// for a live preview during play. The actual award is always recomputed and
// confirmed server-side from the real difficulty column, never trusted from the client.
const DIFFICULTY_XP: Record<string, number> = { Starter: 1, Building: 3, Challenge: 5 }
function questionXp(difficulty?: string): number {
  return DIFFICULTY_XP[difficulty ?? ''] ?? 3
}

// Render text with <strong>, <em> tags and *asterisk* → cyan highlight
function RichText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  // Parse: <strong>...</strong>, <em>...</em> and *...*
  const parts: { content: string; bold?: boolean; italic?: boolean; cyan?: boolean }[] = []
  let remaining = text
  while (remaining.length > 0) {
    const strongStart = remaining.indexOf('<strong>')
    const emStart = remaining.indexOf('<em>')
    const asteriskStart = remaining.indexOf('*')
    const next = Math.min(
      strongStart >= 0 ? strongStart : Infinity,
      emStart >= 0 ? emStart : Infinity,
      asteriskStart >= 0 ? asteriskStart : Infinity
    )
    if (next === Infinity) { parts.push({ content: remaining }); break }
    if (next > 0) parts.push({ content: remaining.slice(0, next) })
    if (strongStart >= 0 && strongStart === next) {
      const end = remaining.indexOf('</strong>', strongStart)
      if (end < 0) { parts.push({ content: remaining.slice(strongStart + 8) }); break }
      parts.push({ content: remaining.slice(strongStart + 8, end), bold: true })
      remaining = remaining.slice(end + 9)
    } else if (emStart >= 0 && emStart === next) {
      const end = remaining.indexOf('</em>', emStart)
      if (end < 0) { parts.push({ content: remaining.slice(emStart + 4) }); break }
      parts.push({ content: remaining.slice(emStart + 4, end), italic: true })
      remaining = remaining.slice(end + 5)
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
        p.bold ? <strong key={i} style={{ fontWeight: 700, color: 'var(--ink)' }}>{p.content}</strong>
        : p.italic ? <em key={i} style={{ fontStyle: 'italic' }}>{p.content}</em>
        : p.cyan ? <span key={i} style={{ color: 'var(--rust)', fontWeight: 600 }}>{p.content}</span>
        : <span key={i}>{p.content}</span>
      )}
    </span>
  )
}

// Curio colour tokens
const CURIO = {
  bg:         'var(--paper)',
  card:       'var(--paper-raised)',
  cardBorder: 'rgba(var(--rust-rgb),0.18)',
  text:       'var(--ink)',
  subtext:    'rgba(var(--ink-rgb),0.55)',
  coral:      'var(--brick)',
  cyan:       'var(--rust)',
  amber:      'var(--ochre)',
}

interface Burst { id: number; bx: number; by: number; color: string; size: number; delay: number }

const BURST_COLORS = ['var(--moss)', 'var(--rust)', 'var(--ochre)', 'var(--ink)']

function CorrectBurst() {
  const [particles] = useState<Burst[]>(() =>
    Array.from({ length: 14 }, (_, i) => {
      const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.4
      const dist  = 50 + Math.random() * 50
      return {
        id: i,
        bx: Math.cos(angle) * dist,
        by: Math.sin(angle) * dist,
        color: BURST_COLORS[i % BURST_COLORS.length],
        size: 5 + Math.random() * 5,
        delay: Math.random() * 0.08,
      }
    })
  )
  return (
    <span className="absolute inset-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
      {particles.map(p => (
        <span key={p.id}
          className="absolute rounded-full animate-burst"
          style={{
            '--bx': `${p.bx}px`, '--by': `${p.by}px`,
            background: p.color, width: p.size, height: p.size,
            animationDelay: `${p.delay}s`,
          } as React.CSSProperties} />
      ))}
    </span>
  )
}

export default function QuizRunner({
  questions, levelId, sectionType, baseXP, passThreshold, onComplete,
}: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected]         = useState<string | null>(null)
  const [answerState, setAnswerState]   = useState<AnswerState>('idle')
  const [startTime]  = useState(Date.now())
  const [scoreDisplay, setScoreDisplay] = useState(0)
  const [xpDisplay, setXpDisplay]       = useState(0)
  const [xpBump, setXpBump]             = useState(false)
  const scoreRef      = useRef(0)
  const xpRef         = useRef(0)
  const correctIdsRef = useRef<string[]>([])
  const feedbackRef   = useRef('')

  const current         = questions[currentIndex]
  const progressPercent = ((currentIndex + (answerState !== 'idle' ? 1 : 0)) / questions.length) * 100
  const isLast          = currentIndex === questions.length - 1

  const handleSelect = useCallback((key: string) => {
    if (answerState !== 'idle') return
    const correct = key === current.correct_key
    setSelected(key)
    setAnswerState(correct ? 'correct' : 'wrong')
    feedbackRef.current = correct ? pickRandom(CORRECT_MESSAGES) : pickRandom(WRONG_MESSAGES)
    if (correct) {
      scoreRef.current += 1
      setScoreDisplay(scoreRef.current)
      correctIdsRef.current.push(current.id)
      xpRef.current += questionXp(current.difficulty)
      setXpDisplay(xpRef.current)
      setXpBump(true)
      setTimeout(() => setXpBump(false), 450)
    }
  }, [answerState, current])

  const handleNext = useCallback(() => {
    if (answerState === 'idle') return
    if (isLast) {
      const finalScore = scoreRef.current
      const total      = questions.length
      const passed     = finalScore / total >= passThreshold
      const timeTaken  = Math.round((Date.now() - startTime) / 1000)
      const xpEarned   = calculateXP({ score: finalScore, total, sectionType, baseXP })
      onComplete({ score: finalScore, total, passed, xpEarned, timeTaken, correctQuestionIds: correctIdsRef.current })
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
      return { background: 'var(--paper-raised)', borderColor: 'rgba(var(--ink-rgb),0.15)', color: CURIO.text, cursor: 'pointer' }
    }
    if (optKey === current.correct_key) {
      return { background: 'rgba(var(--moss-rgb),0.12)', borderColor: 'var(--moss)', color: 'var(--moss)' }
    }
    if (optKey === selected) {
      return { background: 'rgba(var(--brick-rgb),0.1)', borderColor: CURIO.coral, color: CURIO.coral }
    }
    return { background: 'rgba(var(--ink-rgb),0.02)', borderColor: 'rgba(var(--ink-rgb),0.08)', color: CURIO.subtext, opacity: 0.5 }
  }

  function bubbleStyle(optKey: string): React.CSSProperties {
    if (answerState !== 'idle') {
      if (optKey === current.correct_key) return { background: 'var(--moss)', color: 'var(--paper)' }
      if (optKey === selected)            return { background: CURIO.coral, color: 'var(--paper)' }
    }
    return { background: 'rgba(var(--ink-rgb),0.08)', color: CURIO.subtext }
  }

  return (
    <div className="w-full max-w-2xl mx-auto select-none">

      {/* Progress strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-black tabular-nums min-w-[3.5rem]" style={{ color: CURIO.subtext }}>
          {currentIndex + 1}/{questions.length}
        </span>
        <div className="flex-1">
          <ProgressBar value={progressPercent} color="bg-[var(--rust)]" />
        </div>
        <span className={xpBump ? 'animate-xp-bump inline-block' : 'inline-block'}>
          <XPBadge xp={xpDisplay} size="sm" />
        </span>
      </div>

      {/* Question card */}
      <div key={`q-${currentIndex}`} className="rounded-3xl p-7 mb-5 animate-fade-slide"
        style={{ background: CURIO.card, border: `1px solid ${CURIO.cardBorder}` }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(var(--rust-rgb),0.1)', color: CURIO.cyan }}>
            Question {currentIndex + 1}
          </span>
          {current.difficulty && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(var(--ochre-rgb),0.12)', color: CURIO.amber }}>
              <Zap size={12} /> +{questionXp(current.difficulty)} XP · {current.difficulty}
            </span>
          )}
          {sectionType === 'subtopic_mastery' && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(var(--ochre-rgb),0.14)', color: CURIO.amber }}>
              <Trophy size={12} /> Mastery
            </span>
          )}
          {sectionType === 'broad_topic_mastery' && (
            <span className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(var(--rust-rgb),0.1)', color: CURIO.cyan }}>
              <GraduationCap size={12} /> Final Boss
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
          const isSelectedWrong   = answerState === 'wrong'   && opt.key === selected
          const isSelectedCorrect = answerState === 'correct' && opt.key === selected
          const isRevealedCorrect = answerState === 'wrong'   && opt.key === current.correct_key
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={answerState !== 'idle'}
              aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt.text}`}
              className={`relative overflow-visible flex items-center gap-4 w-full text-left rounded-2xl border-2 px-5 py-4 font-semibold text-base transition-all duration-200 disabled:cursor-default focus:outline-none active:scale-[0.97]
                ${isSelectedWrong ? 'animate-wrong-bump' : ''}
                ${isSelectedCorrect ? 'animate-correct-bounce animate-ring-pulse' : ''}
                ${isRevealedCorrect ? 'animate-pulse-soft' : ''}
                ${answerState === 'idle' ? 'hover:-translate-y-0.5 hover:scale-[1.01]' : ''}`}
              style={optionStyle(opt.key)}
            >
              {isSelectedCorrect && <CorrectBurst />}
              <span className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-colors duration-200 ${isSelectedCorrect ? 'animate-pop-in' : ''}`}
                style={bubbleStyle(opt.key)}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-snug">
                <RichText text={opt.text} />
              </span>
              {answerState !== 'idle' && opt.key === current.correct_key && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center animate-pop-in"
                  style={{ background: 'var(--moss)', color: 'var(--paper)' }}><Check size={15} /></span>
              )}
              {answerState === 'wrong' && opt.key === selected && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center animate-wiggle"
                  style={{ background: CURIO.coral, color: '#fff' }}><X size={15} /></span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback bar — always shows explanation immediately when answered */}
      {answerState !== 'idle' && (
        <div className={`rounded-2xl px-5 py-4 mb-4 border-2 ${answerState === 'correct' ? 'animate-celebrate' : 'animate-wrong-bump'}`}
          style={answerState === 'correct'
            ? { background: 'rgba(var(--moss-rgb),0.08)', borderColor: 'rgba(var(--moss-rgb),0.3)' }
            : { background: 'rgba(var(--brick-rgb),0.08)', borderColor: 'rgba(var(--brick-rgb),0.3)' }
          }>
          <p className="font-black text-base mb-2"
            style={{ color: answerState === 'correct' ? 'var(--moss)' : 'var(--brick)' }}>
            {feedbackRef.current}
          </p>
          {/* Explanation always visible immediately — no button */}
          {current.explanation && (
            <p className="text-sm leading-relaxed pt-2"
              style={{ color: CURIO.subtext, borderTop: '1px solid rgba(var(--ink-rgb),0.1)' }}>
              <RichText text={current.explanation} />
            </p>
          )}
        </div>
      )}

      {/* Next / Finish button */}
      {answerState !== 'idle' && (
        <button onClick={handleNext}
          className="w-full py-4 rounded-2xl font-black text-base text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:scale-95 animate-pop-in inline-flex items-center justify-center gap-2"
          style={{ background: CURIO.cyan }}>
          {isLast ? 'See My Results' : 'Next Question'} <ArrowRight size={18} />
        </button>
      )}

      <p className="text-center text-xs mt-4" style={{ color: CURIO.subtext }}>
        {answerState === 'idle' ? 'Press 1–4 to answer' : 'Press Enter or Space to continue'}
      </p>
    </div>
  )
}
