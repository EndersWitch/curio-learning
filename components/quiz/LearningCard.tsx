'use client'

import { useState } from 'react'
import type { LearningConcept, CardType } from '@/types/quiz'

interface LearningCardProps {
  concept: LearningConcept
  index: number
}

// ── Rich text renderer — supports <strong>, *cyan*, and \n as line breaks ──
function RichText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const parts: { content: string; bold?: boolean; cyan?: boolean }[] = []
  let remaining = text ?? ''
  while (remaining.length > 0) {
    const strongStart   = remaining.indexOf('<strong>')
    const asteriskStart = remaining.indexOf('*')
    const next = Math.min(
      strongStart  >= 0 ? strongStart  : Infinity,
      asteriskStart >= 0 ? asteriskStart : Infinity,
    )
    if (next === Infinity) { parts.push({ content: remaining }); break }
    if (next > 0) parts.push({ content: remaining.slice(0, next) })
    if (strongStart >= 0 && strongStart === next) {
      const end = remaining.indexOf('</strong>', strongStart)
      if (end < 0) { parts.push({ content: remaining }); break }
      parts.push({ content: remaining.slice(strongStart + 8, end), bold: true })
      remaining = remaining.slice(end + 9)
    } else {
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

// ── Shared multi-line content renderer ──
function ContentBlock({ text, accentColor, textColor = '#c4b8d8' }: {
  text: string
  accentColor: string
  textColor?: string
}) {
  const lines = (text ?? '').split('\n').filter(Boolean)
  if (lines.length > 1) {
    return (
      <ul className="space-y-2 mt-1">
        {lines.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: textColor }}>
            <span className="flex-shrink-0 mt-1.5" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: accentColor, minWidth: 6, display: 'inline-block',
            }} />
            <RichText text={line} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p className="text-sm leading-relaxed" style={{ color: textColor }}>
      <RichText text={text} />
    </p>
  )
}

// ── Example block — supports multiple lines ──
function ExampleBlock({ text, accentColor }: { text: string; accentColor: string }) {
  const lines = (text ?? '').split('\n').filter(Boolean)
  return (
    <div className="mt-3 rounded-xl p-3" style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <span className="text-xs font-black uppercase tracking-wide" style={{ color: accentColor }}>
        {lines.length > 1 ? 'Examples' : 'Example'}
      </span>
      {lines.length > 1 ? (
        <ul className="mt-1 space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm italic" style={{ color: '#c4b8d8' }}>
              <span className="flex-shrink-0 mt-1.5" style={{
                width: 5, height: 5, borderRadius: '50%',
                background: accentColor, minWidth: 5, display: 'inline-block',
              }} />
              <RichText text={line} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm mt-1 italic" style={{ color: '#c4b8d8' }}>
          <RichText text={text} />
        </p>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CARD TYPE RENDERERS
// ══════════════════════════════════════════════════════════════

// 📕 KEY RULE — cyan border left, structured authority card
function KeyRuleCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#231935',
      border: '1.5px solid rgba(109,211,206,0.25)',
      borderLeft: '4px solid #6DD3CE',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(109,211,206,0.12)' }}>📕</div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
          Key Rule
        </span>
      </div>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <ContentBlock text={concept.content} accentColor="#6DD3CE" />
      {concept.example && <ExampleBlock text={concept.example} accentColor="#6DD3CE" />}
    </div>
  )
}

// ✨ DID YOU KNOW — amber glow, sparkle badge
function DidYouKnowCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: 'linear-gradient(135deg, #231935 60%, #2a2218 100%)',
      border: '1.5px solid rgba(245,200,66,0.3)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(245,200,66,0.15)' }}>✨</div>
        <span className="text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ color: '#2B1E3F', background: '#F5C842', letterSpacing: '0.1em' }}>
          Did You Know?
        </span>
      </div>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <ContentBlock text={concept.content} accentColor="#F5C842" />
      {concept.example && <ExampleBlock text={concept.example} accentColor="#F5C842" />}
    </div>
  )
}

// 📝 EXAMPLE — coral, concrete worked example
function ExampleCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#231935',
      border: '1.5px solid rgba(255,94,91,0.25)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(255,94,91,0.12)', borderBottom: '1px solid rgba(255,94,91,0.15)' }}>
        <span className="text-base">📝</span>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#FF5E5B' }}>
          Example
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
          {concept.title}
        </h3>
        <ContentBlock text={concept.content} accentColor="#FF5E5B" />
        {concept.example && (() => {
          const exLines = concept.example!.split('\n').filter(Boolean)
          return (
            <div className="mt-3 rounded-xl p-4" style={{
              background: 'rgba(255,94,91,0.06)',
              border: '1px solid rgba(255,94,91,0.2)',
            }}>
              {exLines.length > 1 ? (
                <ul className="space-y-1">
                  {exLines.map((l, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-mono" style={{ color: '#ffa09e' }}>
                      <span style={{ marginTop: 2 }}>·</span>
                      <RichText text={l} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-mono" style={{ color: '#ffa09e' }}>
                  <RichText text={concept.example!} />
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// 💡 TIP — bright emerald/cyan, quick win energy
function TipCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#1d2d27',
      border: '1.5px solid rgba(109,211,206,0.3)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'rgba(109,211,206,0.18)' }}>💡</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
              Quick Tip
            </span>
          </div>
          <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
            {concept.title}
          </h3>
          <ContentBlock text={concept.content} accentColor="#6DD3CE" />
          {concept.example && <ExampleBlock text={concept.example} accentColor="#6DD3CE" />}
        </div>
      </div>
    </div>
  )
}

// ⚠️ COMMON MISTAKE — flip reveal! Front shows warning, click to see the fix
function CommonMistakeCard({ concept, index }: LearningCardProps) {
  const [flipped, setFlipped] = useState(false)
  return (
    <div
      className="rounded-2xl cursor-pointer transition-all duration-300 select-none"
      onClick={() => setFlipped(f => !f)}
      style={{
        background: flipped ? '#1a2418' : '#2d1a1a',
        border: flipped ? '1.5px solid rgba(109,211,206,0.3)' : '1.5px solid rgba(255,94,91,0.35)',
        animationDelay: `${index * 80}ms`,
        minHeight: 140,
      }}
    >
      {!flipped ? (
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(255,94,91,0.15)' }}>⚠️</div>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#FF5E5B' }}>
              Common Mistake
            </span>
            <span className="ml-auto text-xs" style={{ color: 'rgba(255,94,91,0.6)' }}>tap to see the fix →</span>
          </div>
          <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
            {concept.title}
          </h3>
          <ContentBlock text={concept.content} accentColor="#FF5E5B" />
        </div>
      ) : (
        <div className="p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: 'rgba(109,211,206,0.15)' }}>✅</div>
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
              The Fix
            </span>
            <span className="ml-auto text-xs" style={{ color: 'rgba(109,211,206,0.6)' }}>← tap to go back</span>
          </div>
          <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
            {concept.title}
          </h3>
          {concept.example && (
            <div className="rounded-xl p-3" style={{
              background: 'rgba(109,211,206,0.06)',
              border: '1px solid rgba(109,211,206,0.2)',
            }}>
              <p className="text-sm" style={{ color: '#c4b8d8' }}>
                <RichText text={concept.example} />
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 🔍 SPOT THE DIFFERENCE — split panel comparison
function SpotDifferenceCard({ concept, index }: LearningCardProps) {
  const lines = (concept.content ?? '').split('\n').filter(Boolean)
  const midpoint = Math.ceil(lines.length / 2)
  const leftLines  = lines.slice(0, midpoint)
  const rightLines = lines.slice(midpoint)
  const sideALabel = concept.sideA ?? '❌ Wrong'
  const sideBLabel = concept.sideB ?? '✅ Right'
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#231935',
      border: '1.5px solid rgba(245,200,66,0.25)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(245,200,66,0.08)', borderBottom: '1px solid rgba(245,200,66,0.15)' }}>
        <span className="text-base">🔍</span>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#F5C842' }}>
          Spot the Difference
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-black text-base mb-4 leading-tight" style={{ color: '#F7F7FF' }}>
          {concept.title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,94,91,0.08)', border: '1px solid rgba(255,94,91,0.2)' }}>
            <div className="text-xs font-black mb-2" style={{ color: '#FF5E5B' }}>{sideALabel}</div>
            {leftLines.map((l, i) => (
              <p key={i} className="text-xs mb-1" style={{ color: '#c4b8d8' }}>
                <RichText text={l} />
              </p>
            ))}
          </div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(109,211,206,0.08)', border: '1px solid rgba(109,211,206,0.2)' }}>
            <div className="text-xs font-black mb-2" style={{ color: '#6DD3CE' }}>{sideBLabel}</div>
            {rightLines.map((l, i) => (
              <p key={i} className="text-xs mb-1" style={{ color: '#c4b8d8' }}>
                <RichText text={l} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// 🎯 WHAT TESTED — checklist with animated ticks
function WhatTestedCard({ concept, index }: LearningCardProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const lines = (concept.content ?? '').split('\n').filter(Boolean)
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#1e1a30',
      border: '1.5px solid rgba(196,184,216,0.2)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(196,184,216,0.1)' }}>🎯</div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#c4b8d8' }}>
          What You'll Be Tested On
        </span>
      </div>
      <h3 className="font-black text-base mb-3 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <button
            key={i}
            onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
            className="w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 transition-all"
            style={{
              background: checked[i] ? 'rgba(109,211,206,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${checked[i] ? 'rgba(109,211,206,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div className="flex-shrink-0 mt-0.5 w-4.5 h-4.5 rounded-md flex items-center justify-center text-xs"
              style={{
                width: 18, height: 18, borderRadius: 5,
                background: checked[i] ? '#6DD3CE' : 'rgba(255,255,255,0.06)',
                border: checked[i] ? 'none' : '1px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
                color: '#2B1E3F',
                fontWeight: 900,
              }}>
              {checked[i] ? '✓' : ''}
            </div>
            <span className="text-sm" style={{ color: checked[i] ? '#6DD3CE' : '#c4b8d8', transition: 'color 0.2s' }}>
              <RichText text={line} />
            </span>
          </button>
        ))}
      </div>
      {lines.length > 0 && (
        <p className="text-xs mt-3 text-center" style={{ color: 'rgba(196,184,216,0.4)' }}>
          Tap each item to mark it as reviewed
        </p>
      )}
    </div>
  )
}

// 🎮 TRY IT — mini challenge / think-before-you-see
function TryItCard({ concept, index }: LearningCardProps) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#1e1730',
      border: '1.5px solid rgba(167,139,250,0.3)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="px-5 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(167,139,250,0.1)', borderBottom: '1px solid rgba(167,139,250,0.15)' }}>
        <span className="text-base">🎮</span>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#a78bfa' }}>
          Try It!
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-black text-base mb-3 leading-tight" style={{ color: '#F7F7FF' }}>
          {concept.title}
        </h3>
        <div className="rounded-xl p-4 mb-4" style={{
          background: 'rgba(167,139,250,0.06)',
          border: '1px solid rgba(167,139,250,0.15)',
        }}>
          <ContentBlock text={concept.content} accentColor="#a78bfa" />
        </div>
        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="w-full py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#a78bfa', color: '#1e1730' }}
          >
            Reveal Answer →
          </button>
        ) : (
          <div className="rounded-xl p-3 animate-in" style={{
            background: 'rgba(109,211,206,0.08)',
            border: '1px solid rgba(109,211,206,0.25)',
          }}>
            <div className="text-xs font-black mb-1" style={{ color: '#6DD3CE' }}>Answer</div>
            <p className="text-sm" style={{ color: '#c4b8d8' }}>
              <RichText text={concept.example ?? concept.content} />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// 🌍 REAL WORLD — story/context card, teal narrative
function RealWorldCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: 'linear-gradient(135deg, #1a2d2b 0%, #231935 100%)',
      border: '1.5px solid rgba(109,211,206,0.2)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(109,211,206,0.12)' }}>🌍</div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
          Real World
        </span>
      </div>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <div className="rounded-xl p-3 mb-3" style={{
        background: 'rgba(109,211,206,0.04)',
        border: '1px solid rgba(109,211,206,0.1)',
        borderLeft: '3px solid #6DD3CE',
      }}>
        <ContentBlock text={concept.content} accentColor="#6DD3CE" />
      </div>
      {concept.example && <ExampleBlock text={concept.example} accentColor="#6DD3CE" />}
    </div>
  )
}

// 🧠 MEMORY TRICK — mnemonic, purple brain feel
function MemoryTrickCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#1f1a30',
      border: '1.5px solid rgba(167,139,250,0.25)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(167,139,250,0.15)' }}>🧠</div>
        <div>
          <span className="text-xs font-black uppercase tracking-widest block" style={{ color: '#a78bfa' }}>
            Memory Trick
          </span>
          <span className="text-xs" style={{ color: 'rgba(167,139,250,0.6)' }}>stick this in your brain</span>
        </div>
      </div>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <div className="rounded-xl p-4" style={{
        background: 'rgba(167,139,250,0.08)',
        border: '1px dashed rgba(167,139,250,0.3)',
      }}>
        <ContentBlock text={concept.content} accentColor="#a78bfa" />
      </div>
      {concept.example && (
        <div className="mt-3 text-sm italic text-center" style={{ color: 'rgba(167,139,250,0.7)' }}>
          "{concept.example}"
        </div>
      )}
    </div>
  )
}

// 🚨 WATCH OUT — critical warning, animated red border
function WatchOutCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#2a1a1a',
      border: '2px solid rgba(255,94,91,0.5)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: 'rgba(255,94,91,0.2)' }}>🚨</div>
        <div>
          <span className="text-xs font-black uppercase tracking-widest block" style={{ color: '#FF5E5B' }}>
            Watch Out!
          </span>
          <span className="text-xs" style={{ color: 'rgba(255,94,91,0.6)' }}>examiners love to test this</span>
        </div>
      </div>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <ContentBlock text={concept.content} accentColor="#FF5E5B" />
      {concept.example && <ExampleBlock text={concept.example} accentColor="#FF5E5B" />}
    </div>
  )
}

// 🎉 FUN FACT — playful amber/coral, light energy
function FunFactCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#2a1f10',
      border: '1.5px solid rgba(245,200,66,0.3)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: 'rgba(245,200,66,0.15)' }}>🎉</div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#F5C842' }}>
            Fun Fact!
          </span>
          <h3 className="font-black text-base mt-1 mb-2 leading-tight" style={{ color: '#F7F7FF' }}>
            {concept.title}
          </h3>
          <ContentBlock text={concept.content} accentColor="#F5C842" />
          {concept.example && <ExampleBlock text={concept.example} accentColor="#F5C842" />}
        </div>
      </div>
    </div>
  )
}

// 🪜 STEP BY STEP — numbered steps, ordered process
function StepByStepCard({ concept, index }: LearningCardProps) {
  const steps = (concept.content ?? '').split('\n').filter(Boolean)
  return (
    <div className="rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#231935',
      border: '1.5px solid rgba(109,211,206,0.2)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(109,211,206,0.12)' }}>🪜</div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6DD3CE' }}>
          Step by Step
        </span>
      </div>
      <h3 className="font-black text-base mb-4 leading-tight" style={{ color: '#F7F7FF' }}>
        {concept.title}
      </h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: '#6DD3CE', color: '#2B1E3F', minWidth: 28 }}>
              {i + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm" style={{ color: '#c4b8d8' }}>
                <RichText text={step} />
              </p>
            </div>
          </div>
        ))}
      </div>
      {concept.example && <ExampleBlock text={concept.example} accentColor="#6DD3CE" />}
    </div>
  )
}

// 📖 DEFINITION — dictionary style, formal
function DefinitionCard({ concept, index }: LearningCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.01]" style={{
      background: '#231935',
      border: '1.5px solid rgba(196,184,216,0.2)',
      animationDelay: `${index * 80}ms`,
    }}>
      <div className="px-5 py-2 flex items-center gap-2"
        style={{ background: 'rgba(196,184,216,0.06)', borderBottom: '1px solid rgba(196,184,216,0.12)' }}>
        <span className="text-sm">📖</span>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#c4b8d8' }}>
          Definition
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-black text-xl mb-1" style={{ color: '#F7F7FF', fontStyle: 'italic' }}>
          {concept.title}
        </h3>
        <div className="mb-3" style={{ height: 2, width: 32, background: '#c4b8d8', borderRadius: 1 }} />
        <ContentBlock text={concept.content} accentColor="#c4b8d8" />
        {concept.example && (
          <div className="mt-3 pl-3" style={{ borderLeft: '2px solid rgba(196,184,216,0.3)' }}>
            <p className="text-sm italic" style={{ color: 'rgba(196,184,216,0.7)' }}>
              <RichText text={concept.example} />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// ROUTER
// ══════════════════════════════════════════════════════════════

export default function LearningCard({ concept, index }: LearningCardProps) {
  switch (concept.type) {
    case 'key_rule':        return <KeyRuleCard      concept={concept} index={index} />
    case 'did_you_know':    return <DidYouKnowCard   concept={concept} index={index} />
    case 'example':         return <ExampleCard      concept={concept} index={index} />
    case 'tip':             return <TipCard          concept={concept} index={index} />
    case 'common_mistake':  return <CommonMistakeCard concept={concept} index={index} />
    case 'spot_difference': return <SpotDifferenceCard concept={concept} index={index} />
    case 'what_tested':     return <WhatTestedCard   concept={concept} index={index} />
    case 'try_it':          return <TryItCard        concept={concept} index={index} />
    case 'real_world':      return <RealWorldCard    concept={concept} index={index} />
    case 'memory_trick':    return <MemoryTrickCard  concept={concept} index={index} />
    case 'watch_out':       return <WatchOutCard     concept={concept} index={index} />
    case 'fun_fact':        return <FunFactCard      concept={concept} index={index} />
    case 'step_by_step':    return <StepByStepCard   concept={concept} index={index} />
    case 'definition':      return <DefinitionCard   concept={concept} index={index} />
    default:                return <KeyRuleCard      concept={concept} index={index} />
  }
}
