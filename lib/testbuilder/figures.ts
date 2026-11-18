// Server-only. Finds a STEM diagram (from curio's in-house figure library) that
// suits a topic, so multiple-choice questions can show a real figure.

import Anthropic from '@anthropic-ai/sdk'
import { BLOOM_MODEL, type Learner } from '@/lib/bloom/server'
import index from '@/lib/testbuilder/figureIndex.json'

export interface Figure { id: number; site: string; generator: string; title: string; description: string; src: string }
const FIGURES = index as Figure[]

const STOP = new Set(['the', 'and', 'with', 'from', 'that', 'this', 'what', 'into', 'about', 'their', 'using', 'basic', 'grade', 'topic', 'intro', 'introduction', 'types', 'work', 'working'])
const tokens = (s: string) =>
  [...new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length >= 4 && !STOP.has(w)).map(w => w.replace(/(ing|es|s)$/, '')))]

function siteFor(subject: string | null): string | null {
  const s = (subject ?? '').toLowerCase()
  if (/math/.test(s)) return 'math'
  if (/physic|natural|science/.test(s)) return /chem/.test(s) ? 'chemistry' : 'physics'
  if (/chem/.test(s)) return 'chemistry'
  if (/life|bio/.test(s)) return 'biology'
  if (/econ/.test(s)) return 'economics'
  return null
}

function candidates(topic: string, subject: string | null): Figure[] {
  const want = tokens(`${topic} ${subject ?? ''}`)
  const site = siteFor(subject)
  if (!want.length) return []
  return FIGURES.map(f => {
    const hay = `${f.title} ${f.generator.replace(/-/g, ' ')} ${f.description}`.toLowerCase()
    const score = want.filter(w => hay.includes(w)).length + (site && f.site === site ? 0.5 : 0)
    return { f, score }
  })
    .filter(x => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(x => x.f)
}

const TOOL: Anthropic.Tool = {
  name: 'choose_figure',
  description: 'Choose the one figure that fits, or -1 if none does.',
  input_schema: { type: 'object', properties: { index: { type: 'integer', minimum: -1 } }, required: ['index'] },
}

let anthropic: Anthropic | null = null

export async function pickFigure(learner: Learner, topic: string, ctx: { grade: number; subject: string | null }): Promise<Figure | null> {
  const list = candidates(topic, ctx.subject)
  if (!list.length) return null
  try {
    anthropic ??= new Anthropic()
    const res = await anthropic.messages.create({
      model: BLOOM_MODEL,
      max_tokens: 200,
      system:
        'You choose a diagram to show above a multiple-choice question in a South African school test. Choose a figure only if it is directly about the topic, suits the grade, and a learner could be asked a fair question by reading, working out or interpreting it. Reject figures that are about a different topic, that are too advanced or too easy for the grade, that use US units, currency or spelling, or that are a blank worksheet. If none fits well, answer -1.',
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'choose_figure' },
      messages: [
        {
          role: 'user',
          content:
            `Grade ${ctx.grade}${ctx.subject ? `, ${ctx.subject}` : ''}. Topic: ${topic}.\n\n` +
            list.map((f, i) => `${i}. ${f.title}: ${f.description.slice(0, 200)}`).join('\n'),
        },
      ],
    })
    const { error } = await learner.sb.rpc('log_ai_usage', { p_feature: 'test_generate', p_model: res.model, p_usage: res.usage })
    if (error) console.error('[tests] log usage failed', error)
    const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    const i = (block?.input as { index?: unknown } | undefined)?.index
    return typeof i === 'number' && Number.isInteger(i) && i >= 0 && i < list.length ? list[i]! : null
  } catch (err) {
    console.error('[tests] figure pick failed', err)
    return null
  }
}

/** Text that tells the writer and the checker what the learner will be looking at. */
export function figureNote(f: Figure): string {
  return `A diagram is shown to the learner above every question. Diagram title: "${f.title}". What it shows: ${f.description}\nEvery question must be answerable from the diagram (plus the topic). Call it "the diagram". Only use facts that are stated in the description, and ask the learner to read, work out or interpret something from it, never just to repeat a label.`
}
