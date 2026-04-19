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
  'Great job! 🎉', 'Correct! ✨', 'Well done! 🌟',
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

export default function QuizRunner({
  questions, levelId, sectionType, baseXP, passThreshold, onComplete,
}: QuizRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>('idle')
  const [showExplanation, setShowExplanation] = useState(false)
  const [startTime] = useState(Date.now())
  const [scoreDisplay, setScoreDisplay] = useState(0)
  // Ref for score avoids stale closures in handleNext
  const scoreRef = useRef(0)
  // Ref locks feedback message at selection time — prevents flicker on re-render
  const feedbackRef = useRef('')

  const current = questions[currentIndex]
  const progressPercent = ((currentIndex + (answerState !== 'idle' ? 1 : 0)) / questions.length) * 100
  const isLast = currentIndex === questions.length - 1

  const handleSelect = useCallback((key: string) => {
    if (answerState !== 'idle') return
    const correct = key === current.correct_key
    setSelected(key)
    setAnswerState(correct ? 'correct' : 'wrong')
    feedbackRef.current = correct ? pickRandom(CORRECT_MESSAGES) : pickRandom(WRONG_MESSAGES)
    if (correct) {
      scoreRef.current += 1
      setScoreDisplay(scoreRef.current)
    }
  }, [answerState, current])

  const handleNext = useCallback(() => {
    if (answerState === 'idle') return
    if (isLast) {
      const finalScore = scoreRef.current
      const total = questions.length
      const passed = finalScore / total >= passThreshold
      const timeTaken = Math.round((Date.now() - startTime) / 1000)
      const xpEarned = calculateXP({ score: finalScore, total, sectionType, baseXP })
      onComplete({ score: finalScore, total, passed, xpEarned, timeTaken })
    } else {
      setCurrentIndex(i => i + 1)
      setSelected(null)
      setAnswerState('idle')
      setShowExplanation(false)
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
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [answerState, current, handleSelect, handleNext])

  function getOptionClass(optKey: string): string {
    if (answerState === 'idle') {
      return 'bg-white border-slate-200 text-slate-800 hover:border-violet-400 hover:bg-violet-50 hover:shadow-md active:scale-[0.99] cursor-pointer'
    }
    if (optKey === current.correct_key) {
      return 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-emerald-100 shadow-md'
    }
    if (optKey === selected) {
      return 'bg-rose-50 border-rose-400 text-rose-700 shadow-rose-100 shadow-md'
    }
    return 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
  }

  const xpPerQ = Math.max(1, Math.round(baseXP / questions.length))

  return (
    <div className="w-full max-w-2xl mx-auto select-none">

      {/* Progress strip */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-black text-slate-400 tabular-nums min-w-[3.5rem]">
          {currentIndex + 1}/{questions.length}
        </span>
        <div className="flex-1">
          <ProgressBar value={progressPercent} color="bg-gradient-to-r from-violet-500 to-cyan-500" />
        </div>
        <XPBadge xp={scoreDisplay * xpPerQ} size="sm" />
      </div>

      {/* Question card */}
      <div key={`q-${currentIndex}`} className="bg-white rounded-3xl shadow-xl border border-slate-100 p-7 mb-5 animate-fade-slide">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-violet-100 text-violet-700">
            Question {currentIndex + 1}
          </span>
          {sectionType === 'subtopic_mastery' && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">🏆 Mastery</span>
          )}
          {sectionType === 'broad_topic_mastery' && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">👑 Final Boss</span>
          )}
        </div>
        <p className="text-lg md:text-xl font-black text-slate-800 leading-relaxed">
          {current.question_text}
        </p>
      </div>

      {/* Answer options */}
      <div key={`opts-${currentIndex}`} className="grid grid-cols-1 gap-3 mb-5 animate-fade-slide" style={{ animationDelay: '60ms' }}>
        {current.options.map((opt, i) => {
          const isSelected = opt.key === selected
          const isCorrect = answerState !== 'idle' && opt.key === current.correct_key
          const isWrong = answerState === 'wrong' && isSelected
          return (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              disabled={answerState !== 'idle'}
              aria-label={`Option ${String.fromCharCode(65 + i)}: ${opt.text}`}
              className={`
                flex items-center gap-4 w-full text-left rounded-2xl border-2 px-5 py-4
                font-semibold text-base transition-all duration-200
                disabled:cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400
                ${isWrong ? 'animate-[wrongShake_0.35s_ease-in-out]' : ''}
                ${getOptionClass(opt.key)}
              `}
            >
              <span className={`
                flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-colors duration-200
                ${answerState !== 'idle'
                  ? isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-400 text-white' : 'bg-slate-200 text-slate-400'
                  : 'bg-slate-100 text-slate-600'
                }
              `}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 leading-snug">{opt.text}</span>
              {isCorrect && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black">✓</span>
              )}
              {isWrong && (
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-rose-400 text-white flex items-center justify-center text-sm font-black">✗</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Feedback bar */}
      {answerState !== 'idle' && (
        <div className={`rounded-2xl px-5 py-4 mb-4 border-2 animate-fade-slide ${
          answerState === 'correct' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <p className={`font-black text-base mb-1 ${answerState === 'correct' ? 'text-emerald-700' : 'text-rose-700'}`}>
            {feedbackRef.current}
          </p>
          {current.explanation && !showExplanation && (
            <button
              onClick={() => setShowExplanation(true)}
              className="text-xs font-bold text-slate-500 underline underline-offset-2 hover:text-slate-700"
            >
              Show explanation →
            </button>
          )}
          {current.explanation && showExplanation && (
            <p className="text-sm text-slate-600 mt-2 leading-relaxed border-t border-slate-200 pt-2">
              {current.explanation}
            </p>
          )}
        </div>
      )}

      {/* Next / Finish button */}
      {answerState !== 'idle' && (
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:translate-y-0"
        >
          {isLast ? '🏁 See My Results' : 'Next Question →'}
        </button>
      )}

      <p className="text-center text-xs text-slate-400 mt-4">
        {answerState === 'idle' ? 'Press 1–4 to answer' : 'Press Enter or Space to continue'}
      </p>
    </div>
  )
}
