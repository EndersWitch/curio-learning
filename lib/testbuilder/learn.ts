// Server-only. The learning loop for the test builder:
//  1. triageFlags: every open learner report is investigated by AI with web
//     search; if the report shows the question writer is missing a term, rule or
//     fact, a PROPOSED lesson is added to test_knowledge for admin review.
//  2. refreshFacts: time-sensitive 'fact' rows are re-checked against the web;
//     confirmed ones get a new verified_at, changed ones become a PROPOSED update.
// Nothing the AI proposes goes live until an admin approves it.

import Anthropic from '@anthropic-ai/sdk'
import { serviceClient } from '@/lib/testbuilder/admin'

const MODEL = process.env.KNOWLEDGE_MODEL?.trim() || 'claude-sonnet-5-5'
const SEARCH = { type: 'web_search_20250305', name: 'web_search', max_uses: 4 } as unknown as Anthropic.Tool

let client: Anthropic | null = null

type Block = Anthropic.ContentBlock

/** Run a research step: free web search, then a forced structured answer. */
async function research<T>(system: string, user: string, tool: Anthropic.Tool): Promise<T | null> {
  client ??= new Anthropic()
  const first = await client.messages.create({
    model: MODEL, max_tokens: 3000, system,
    tools: [SEARCH, tool], tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: user }],
  })
  let block = first.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === tool.name)
  if (!block) {
    const second = await client.messages.create({
      model: MODEL, max_tokens: 2000, system,
      tools: [tool], tool_choice: { type: 'tool', name: tool.name },
      messages: [
        { role: 'user', content: user },
        { role: 'assistant', content: first.content.filter((b: Block) => b.type === 'text') as Anthropic.ContentBlockParam[] },
        { role: 'user', content: 'Now record your decision.' },
      ],
    })
    block = second.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  }
  return (block?.input as T) ?? null
}

const TRIAGE_TOOL: Anthropic.Tool = {
  name: 'record_triage',
  description: 'Record what the investigation found.',
  input_schema: {
    type: 'object',
    properties: {
      verdict: { type: 'string', enum: ['question_wrong', 'mark_wrong', 'too_advanced', 'unclear', 'learner_mistaken', 'cannot_tell'] },
      explanation: { type: 'string', description: 'What is wrong (or right) and why, in two or three plain sentences, naming the source you relied on.' },
      lesson: {
        type: 'object',
        description: 'Only when the report shows the question writer lacks a verified term, rule, fact or grade limit that future questions need. Leave out otherwise.',
        properties: {
          kind: { type: 'string', enum: ['term', 'rule', 'fact', 'avoid'] },
          title: { type: 'string' },
          body: { type: 'string', description: 'The verified content, written as an instruction to a question writer.' },
          subjects: { type: 'array', items: { type: 'string' }, description: 'Lower-case keywords that appear in the subject or topic, such as "accounting" or "natural sciences".' },
          gradeMin: { type: 'integer' }, gradeMax: { type: 'integer' },
          sourceUrl: { type: 'string' },
        },
        required: ['kind', 'title', 'body', 'subjects'],
      },
    },
    required: ['verdict', 'explanation'],
  },
}

type Lesson = { kind: string; title: string; body: string; subjects: string[]; gradeMin?: number; gradeMax?: number; sourceUrl?: string }

export async function triageFlags(max = 6): Promise<{ triaged: number; proposed: number }> {
  const sb = serviceClient()
  if (!sb) return { triaged: 0, proposed: 0 }
  const { data: flags } = await sb.from('test_flags').select('id, question_id, answer_id, kind, reason, note').eq('status', 'open').is('triage', null).limit(max)
  let triaged = 0, proposed = 0
  for (const fl of flags ?? []) {
    try {
      const { data: q } = await sb.from('test_questions').select('*').eq('id', fl.question_id).maybeSingle()
      if (!q) continue
      const [{ data: sess }, { data: key }, { data: ans }] = await Promise.all([
        sb.from('test_sessions').select('grade, subject, scope_text').eq('id', q.session_id).maybeSingle(),
        sb.from('test_question_keys').select('*').eq('question_id', q.id).maybeSingle(),
        fl.answer_id ? sb.from('test_answers').select('*').eq('id', fl.answer_id).maybeSingle() : Promise.resolve({ data: null }),
      ])
      const trim = (v: unknown) => JSON.stringify(v ?? null).slice(0, 2500)
      const out = await research<{ verdict: string; explanation: string; lesson?: Lesson }>(
        'You investigate learner reports about a South African school test (CAPS curriculum). Use web search to check the facts against CAPS-aligned or official South African sources before deciding. Be honest: if the learner is mistaken, say so. Propose a lesson only for something verified that future question writers need to know (a correct term, rule, current fact, a topic that is above the grade, or a non-existent term to avoid). Never invent facts or sources.',
        `Grade ${sess?.grade}, subject: ${sess?.subject ?? 'not given'}.\nLearner's scope: ${String(sess?.scope_text ?? '').slice(0, 600)}\n\nQuestion record: ${trim(q)}\nHidden key / memo: ${trim(key)}\nLearner's answer: ${trim(ans)}\n\nReport type: ${fl.kind}. Reason: ${fl.reason ?? ''}. Note: ${fl.note ?? ''}`,
        TRIAGE_TOOL,
      )
      if (!out) continue
      const text = `${out.verdict}: ${out.explanation}`.slice(0, 1500)
      await sb.from('test_flags').update({ triage: text, triaged_at: new Date().toISOString() }).eq('id', fl.id)
      triaged++
      const l = out.lesson
      if (l && l.title && l.body && Array.isArray(l.subjects) && l.subjects.length && ['term', 'rule', 'fact', 'avoid'].includes(l.kind)) {
        const { error } = await sb.from('test_knowledge').insert({
          subjects: l.subjects.map(s => s.toLowerCase()).slice(0, 6),
          grade_min: Math.max(1, Math.min(12, l.gradeMin ?? sess?.grade ?? 1)),
          grade_max: Math.max(1, Math.min(12, l.gradeMax ?? 12)),
          kind: l.kind, title: l.title.slice(0, 120), body: l.body.slice(0, 1200), source_url: l.sourceUrl ?? null,
          status: 'proposed', origin: 'flag', note: `From report: ${text}`.slice(0, 600),
        })
        if (!error) proposed++
      }
    } catch (err) {
      console.error('[learn] triage failed', fl.id, err)
    }
  }
  return { triaged, proposed }
}

const FACT_TOOL: Anthropic.Tool = {
  name: 'record_fact_check',
  description: 'Record whether the stored fact is still correct today.',
  input_schema: {
    type: 'object',
    properties: {
      stillCorrect: { type: 'boolean' },
      updatedBody: { type: 'string', description: 'If not still correct, the corrected statement, written as an instruction to a question writer.' },
      sourceUrl: { type: 'string' },
      explanation: { type: 'string' },
    },
    required: ['stillCorrect', 'explanation'],
  },
}

export async function refreshFacts(max = 8): Promise<{ checked: number; confirmed: number; proposed: number }> {
  const sb = serviceClient()
  if (!sb) return { checked: 0, confirmed: 0, proposed: 0 }
  const weekAgo = new Date(Date.now() - 6 * 86400_000).toISOString()
  const { data: rows } = await sb.from('test_knowledge').select('id, title, body, source_url, subjects, grade_min, grade_max, verified_at')
    .eq('status', 'approved').eq('kind', 'fact').or(`verified_at.is.null,verified_at.lt.${weekAgo}`).order('verified_at', { ascending: true, nullsFirst: true }).limit(max)
  let confirmed = 0, proposed = 0
  const today = new Date().toISOString().slice(0, 10)
  for (const r of rows ?? []) {
    try {
      const out = await research<{ stillCorrect: boolean; updatedBody?: string; sourceUrl?: string; explanation: string }>(
        `You verify facts that a South African school test writer relies on. Today is ${today}. Use web search and prefer official sources (SARS, National Treasury, DBE, Stats SA, gov.za). Say stillCorrect only if the stored fact matches what is true today.`,
        `Stored fact: ${r.title}: ${r.body}\nOriginal source: ${r.source_url ?? 'none'}`,
        FACT_TOOL,
      )
      if (!out) continue
      if (out.stillCorrect) {
        await sb.from('test_knowledge').update({ verified_at: new Date().toISOString() }).eq('id', r.id)
        confirmed++
      } else if (out.updatedBody) {
        const { error } = await sb.from('test_knowledge').insert({
          subjects: r.subjects, grade_min: r.grade_min, grade_max: r.grade_max, kind: 'fact',
          title: `${r.title} (update ${today})`, body: out.updatedBody.slice(0, 1200), source_url: out.sourceUrl ?? null,
          status: 'proposed', origin: 'cron', note: `Replaces "${r.title}". ${out.explanation}`.slice(0, 600),
        })
        if (!error) proposed++
      }
    } catch (err) {
      console.error('[learn] fact refresh failed', r.id, err)
    }
  }
  return { checked: rows?.length ?? 0, confirmed, proposed }
}
