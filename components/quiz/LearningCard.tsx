'use client'

import { useState } from 'react'
import type { LearningConcept } from '@/types/quiz'
import {
  BookMarked, Lightbulb, PenLine, Zap, AlertTriangle, Search, ListChecks,
  Eye, Globe, Brain, Star, Layers, BookOpen, Check, X,
} from '@/components/icons'

interface LearningCardProps {
  concept: LearningConcept
  index: number
}

// Every card type maps onto the same visual accent — cyan for neutral/
// instructional content, amber for highlights, coral for warnings. Color is
// a secondary cue; the icon + label are what actually distinguish types.
const NEUTRAL = 'rgba(var(--ink-rgb),0.55)'
const CARD_BG = 'var(--paper-raised)'
const CARD_BORDER = 'rgba(var(--ink-rgb),0.12)'

// ── Rich text renderer — supports <strong>, <em>, *cyan*, and \n as line breaks ──
function RichText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const parts: { content: string; bold?: boolean; italic?: boolean; cyan?: boolean }[] = []
  let remaining = text ?? ''
  while (remaining.length > 0) {
    const strongStart   = remaining.indexOf('<strong>')
    const emStart        = remaining.indexOf('<em>')
    const asteriskStart = remaining.indexOf('*')
    const next = Math.min(
      strongStart  >= 0 ? strongStart  : Infinity,
      emStart       >= 0 ? emStart       : Infinity,
      asteriskStart >= 0 ? asteriskStart : Infinity,
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

// ── Shared multi-line content renderer ──
function ContentBlock({ text, accentColor, textColor = 'rgba(var(--ink-rgb),0.6)' }: {
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
      background: 'rgba(var(--ink-rgb),0.035)',
      border: '1px solid rgba(var(--ink-rgb),0.1)',
    }}>
      <span className="text-xs font-black uppercase tracking-wide" style={{ color: accentColor }}>
        {lines.length > 1 ? 'Examples' : 'Example'}
      </span>
      {lines.length > 1 ? (
        <ul className="mt-1 space-y-1">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm italic" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}>
              <span className="flex-shrink-0 mt-1.5" style={{
                width: 5, height: 5, borderRadius: '50%',
                background: accentColor, minWidth: 5, display: 'inline-block',
              }} />
              <RichText text={line} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm mt-1 italic" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}>
          <RichText text={text} />
        </p>
      )}
    </div>
  )
}

// ── Shared card shell — one dark surface, icon + label header, everyone the
// same shape. This is what replaces the old per-type gradient/wash/left-bar look.
function CardShell({
  icon, label, accentColor, index, children, onClick, minHeight,
}: {
  icon: React.ReactNode
  label: string
  accentColor: string
  index: number
  children: React.ReactNode
  onClick?: () => void
  minHeight?: number
}) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] ${onClick ? 'cursor-pointer select-none' : ''}`}
      onClick={onClick}
      style={{
        background: CARD_BG,
        border: `1.5px solid ${CARD_BORDER}`,
        animationDelay: `${index * 80}ms`,
        minHeight,
      }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}1f`, color: accentColor }}>
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest" style={{ color: accentColor }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// CARD TYPE RENDERERS
// ══════════════════════════════════════════════════════════════

function KeyRuleCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  return (
    <CardShell icon={<BookMarked size={16} />} label="Key Rule" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function DidYouKnowCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--ochre)'
  return (
    <CardShell icon={<Lightbulb size={16} />} label="Did You Know?" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function ExampleCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  return (
    <CardShell icon={<PenLine size={16} />} label="Example" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && (() => {
        const exLines = concept.example!.split('\n').filter(Boolean)
        return (
          <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(var(--ink-rgb),0.035)', border: '1px solid rgba(var(--ink-rgb),0.1)' }}>
            {exLines.length > 1 ? (
              <ul className="space-y-1">
                {exLines.map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm font-mono" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}>
                    <span style={{ marginTop: 2 }}>·</span>
                    <RichText text={l} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-mono" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}>
                <RichText text={concept.example!} />
              </p>
            )}
          </div>
        )
      })()}
    </CardShell>
  )
}

function TipCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  return (
    <CardShell icon={<Zap size={16} />} label="Quick Tip" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

// Flip reveal — front shows the mistake, click to see the fix.
// The fix text comes from concept.example if present, otherwise from
// content lines starting with "Fix:".
function CommonMistakeCard({ concept, index }: LearningCardProps) {
  const [flipped, setFlipped] = useState(false)

  const allLines = (concept.content ?? '').split('\n').filter(Boolean)
  const fixStartIdx = allLines.findIndex(l => l.trim().toLowerCase().startsWith('fix:'))
  const mistakeLines = fixStartIdx >= 0 ? allLines.slice(0, fixStartIdx) : allLines
  const fixLinesFromContent = fixStartIdx >= 0 ? allLines.slice(fixStartIdx) : []
  const fixText = concept.example ? concept.example : fixLinesFromContent.join('\n')
  const mistakeText = mistakeLines.join('\n')

  const accent = flipped ? 'var(--rust)' : 'var(--brick)'

  return (
    <CardShell
      icon={flipped ? <Check size={16} /> : <AlertTriangle size={16} />}
      label={flipped ? 'The Fix' : 'Common Mistake'}
      accentColor={accent}
      index={index}
      onClick={() => setFlipped(f => !f)}
      minHeight={140}
    >
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      {!flipped ? (
        <>
          <ContentBlock text={mistakeText} accentColor={accent} />
          <p className="text-xs mt-3" style={{ color: 'rgba(var(--brick-rgb),0.6)' }}>Tap to see the fix →</p>
        </>
      ) : fixText ? (
        <div className="rounded-xl p-3" style={{ background: 'rgba(var(--rust-rgb),0.06)', border: '1px solid rgba(var(--rust-rgb),0.2)' }}>
          <ContentBlock text={fixText} accentColor={accent} textColor="rgba(var(--ink-rgb),0.6)" />
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'rgba(var(--rust-rgb),0.5)' }}>No fix provided.</p>
      )}
    </CardShell>
  )
}

// Split-panel comparison — each content line is "left | right"; lines
// without a | are treated as a header/description row spanning both sides.
function SpotDifferenceCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--ochre)'
  const lines = (concept.content ?? '').split('\n').filter(Boolean)
  const sideALabel = concept.sideA ?? 'Wrong'
  const sideBLabel = concept.sideB ?? 'Right'

  const rows: Array<{ left: string; right: string } | { header: string }> = lines.map(line => {
    const pipeIdx = line.indexOf('|')
    if (pipeIdx >= 0) return { left: line.slice(0, pipeIdx).trim(), right: line.slice(pipeIdx + 1).trim() }
    return { header: line.trim() }
  })

  return (
    <CardShell icon={<Search size={16} />} label="Spot the Difference" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-4 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="rounded-t-xl px-3 pt-2.5 pb-1.5 flex items-center gap-1.5" style={{ background: 'rgba(var(--brick-rgb),0.08)', border: '1px solid rgba(var(--brick-rgb),0.2)', borderBottom: 'none' }}>
          <X size={12} style={{ color: 'var(--brick)' }} />
          <div className="text-xs font-black" style={{ color: 'var(--brick)' }}>{sideALabel}</div>
        </div>
        <div className="rounded-t-xl px-3 pt-2.5 pb-1.5 flex items-center gap-1.5" style={{ background: 'rgba(var(--rust-rgb),0.08)', border: '1px solid rgba(var(--rust-rgb),0.2)', borderBottom: 'none' }}>
          <Check size={12} style={{ color: 'var(--rust)' }} />
          <div className="text-xs font-black" style={{ color: 'var(--rust)' }}>{sideBLabel}</div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {rows.map((row, i) => {
          if ('header' in row) {
            return (
              <div key={i} className="text-xs px-1 py-0.5" style={{ color: 'rgba(196,184,216,0.6)', fontStyle: 'italic' }}>
                <RichText text={row.header} />
              </div>
            )
          }
          return (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(var(--brick-rgb),0.05)', border: '1px solid rgba(var(--brick-rgb),0.15)' }}>
                <p className="text-sm font-semibold" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}><RichText text={row.left} /></p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(var(--rust-rgb),0.05)', border: '1px solid rgba(var(--rust-rgb),0.15)' }}>
                <p className="text-sm font-semibold" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}><RichText text={row.right} /></p>
              </div>
            </div>
          )
        })}
      </div>

      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function WhatTestedCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const lines = (concept.content ?? '').split('\n').filter(Boolean)
  return (
    <CardShell icon={<ListChecks size={16} />} label="What You'll Be Tested On" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-3 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <button
            key={i}
            onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
            className="w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 transition-all"
            style={{
              background: checked[i] ? 'rgba(var(--rust-rgb),0.08)' : 'rgba(var(--ink-rgb),0.03)',
              border: `1px solid ${checked[i] ? 'rgba(var(--rust-rgb),0.25)' : 'rgba(var(--ink-rgb),0.08)'}`,
            }}
          >
            <div className="flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{
                width: 18, height: 18, borderRadius: 5,
                background: checked[i] ? accent : 'rgba(var(--ink-rgb),0.08)',
                border: checked[i] ? 'none' : '1px solid rgba(var(--ink-rgb),0.18)',
                transition: 'all 0.2s', color: 'var(--paper)',
              }}>
              {checked[i] && <Check size={11} />}
            </div>
            <span className="text-sm" style={{ color: checked[i] ? accent : 'rgba(var(--ink-rgb),0.6)', transition: 'color 0.2s' }}>
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
    </CardShell>
  )
}

function TryItCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--ochre)'
  const [revealed, setRevealed] = useState(false)
  return (
    <CardShell icon={<Eye size={16} />} label="Try It!" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-3 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(var(--ink-rgb),0.035)', border: '1px solid rgba(var(--ink-rgb),0.1)' }}>
        <ContentBlock text={concept.content} accentColor={accent} />
      </div>
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-2.5 rounded-xl font-black text-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: accent, color: 'var(--paper)' }}
        >
          Reveal Answer →
        </button>
      ) : (
        <div className="rounded-xl p-3 animate-in" style={{ background: 'rgba(var(--rust-rgb),0.08)', border: '1px solid rgba(var(--rust-rgb),0.25)' }}>
          <div className="text-xs font-black mb-1" style={{ color: 'var(--rust)' }}>Answer</div>
          <p className="text-sm" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}><RichText text={concept.example ?? concept.content} /></p>
        </div>
      )}
    </CardShell>
  )
}

function RealWorldCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  return (
    <CardShell icon={<Globe size={16} />} label="Real World" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <div className="rounded-xl p-3 mb-1" style={{ background: 'rgba(var(--ink-rgb),0.035)', border: '1px solid rgba(var(--ink-rgb),0.1)' }}>
        <ContentBlock text={concept.content} accentColor={accent} />
      </div>
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function MemoryTrickCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--ochre)'
  return (
    <CardShell icon={<Brain size={16} />} label="Memory Trick" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <div className="rounded-xl p-4" style={{ background: 'rgba(var(--ink-rgb),0.035)', border: '1px dashed rgba(var(--ink-rgb),0.18)' }}>
        <ContentBlock text={concept.content} accentColor={accent} />
      </div>
      {concept.example && (
        <div className="mt-3 text-sm italic text-center" style={{ color: 'rgba(var(--ochre-rgb),0.7)' }}>
          &quot;{concept.example}&quot;
        </div>
      )}
    </CardShell>
  )
}

function WatchOutCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--brick)'
  return (
    <CardShell icon={<AlertTriangle size={16} />} label="Watch Out!" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function FunFactCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--ochre)'
  return (
    <CardShell icon={<Star size={16} />} label="Fun Fact!" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-2 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <ContentBlock text={concept.content} accentColor={accent} />
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function StepByStepCard({ concept, index }: LearningCardProps) {
  const accent = 'var(--rust)'
  const steps = (concept.content ?? '').split('\n').filter(Boolean)
  return (
    <CardShell icon={<Layers size={16} />} label="Step by Step" accentColor={accent} index={index}>
      <h3 className="font-black text-base mb-4 leading-tight" style={{ color: 'var(--ink)' }}>{concept.title}</h3>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
              style={{ background: accent, color: 'var(--paper)', minWidth: 28 }}>
              {i + 1}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm" style={{ color: 'rgba(var(--ink-rgb),0.6)' }}><RichText text={step} /></p>
            </div>
          </div>
        ))}
      </div>
      {concept.example && <ExampleBlock text={concept.example} accentColor={accent} />}
    </CardShell>
  )
}

function DefinitionCard({ concept, index }: LearningCardProps) {
  return (
    <CardShell icon={<BookOpen size={16} />} label="Definition" accentColor={NEUTRAL} index={index}>
      <h3 className="font-black text-xl mb-1" style={{ color: 'var(--ink)', fontStyle: 'italic' }}>{concept.title}</h3>
      <div className="mb-3" style={{ height: 2, width: 32, background: NEUTRAL, borderRadius: 1 }} />
      <ContentBlock text={concept.content} accentColor={NEUTRAL} />
      {concept.example && (
        <div className="mt-3 pl-3" style={{ borderLeft: `2px solid rgba(196,184,216,0.3)` }}>
          <p className="text-sm italic" style={{ color: 'rgba(196,184,216,0.7)' }}><RichText text={concept.example} /></p>
        </div>
      )}
    </CardShell>
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
