// Server-only. Loads the verified subject reference (test_knowledge) that every
// question writer and checker must follow, so the AI never has to guess
// specialist terms, rules or current facts.

import { serviceClient } from '@/lib/testbuilder/admin'

type Row = { subjects: string[]; grade_min: number; grade_max: number; kind: string; title: string; body: string }

const LABEL: Record<string, string> = {
  term: 'TERM', rule: 'RULE', fact: 'CURRENT FACT', avoid: 'DOES NOT EXIST / NEVER USE',
}

let cache: { at: number; rows: Row[] } | null = null

async function allApproved(): Promise<Row[]> {
  if (cache && Date.now() - cache.at < 5 * 60_000) return cache.rows
  const sb = serviceClient()
  if (!sb) return []
  const { data, error } = await sb
    .from('test_knowledge')
    .select('subjects, grade_min, grade_max, kind, title, body')
    .eq('status', 'approved')
  if (error || !data) return cache?.rows ?? []
  cache = { at: Date.now(), rows: data as Row[] }
  return cache.rows
}

/** Is this an accounting-type subject (or scope), where invented terms are most likely? */
export function matches(row: Row, grade: number, hay: string): boolean {
  if (grade < row.grade_min || grade > row.grade_max) return false
  return row.subjects.some(s => s === '*' || new RegExp(`\\b${s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(hay))
}

/** Reference text for the prompt, or '' when nothing applies. */
export async function knowledgeFor(grade: number, subject: string | null, scope: string): Promise<string> {
  const hay = `${subject ?? ''} ${scope}`.toLowerCase()
  const rows = (await allApproved()).filter(r => matches(r, grade, hay))
  if (!rows.length) return ''
  const lines = rows.map(r => `- [${LABEL[r.kind] ?? r.kind}] ${r.title}: ${r.body}`)
  return (
    `VERIFIED REFERENCE (checked against South African sources). Follow it exactly. It overrides your own memory. ` +
    `If a question would need a term, rule or figure that is not covered here and you are not completely certain of it, write a different question.\n` +
    lines.join('\n')
  )
}

/** Forbidden names for a cheap code-side filter on generated text. */
export async function forbiddenFor(grade: number, subject: string | null, scope: string): Promise<string[]> {
  const hay = `${subject ?? ''} ${scope}`.toLowerCase()
  return (await allApproved())
    .filter(r => r.kind === 'avoid' && matches(r, grade, hay))
    .map(r => r.title.toLowerCase().replace(/[’]/g, "'"))
}

export function mentionsForbidden(text: string, forbidden: string[]): boolean {
  const t = text.toLowerCase().replace(/[’]/g, "'")
  return forbidden.some(f => t.includes(f))
}

/** Subjects where Grade 9 is not a CAPS subject and the learner should be told. */
export function gradeNote(grade: number, subject: string | null): string {
  const s = (subject ?? '').toLowerCase()
  if (grade <= 9 && s.includes('accounting'))
    return `Accounting is not a separate CAPS subject below Grade 10. In Grades 7 to 9 it is the financial literacy part of Economic and Management Sciences (EMS), so keep to that level: simple journals, ledgers, the accounting equation, and straight-line or diminishing balance depreciation at a stated rate. No residual value, no financial statements beyond the basic income statement.`
  return ''
}
