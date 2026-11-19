import { NextResponse } from 'next/server'
import { serviceClient } from '@/lib/testbuilder/admin'
import { refreshFacts, triageFlags } from '@/lib/testbuilder/learn'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

function authed(req: Request): boolean {
  const pw = process.env.ADMIN_PASSWORD
  return !!pw && req.headers.get('x-admin-password') === pw
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const sb = serviceClient()
  if (!sb) return NextResponse.json({ error: 'no service key' }, { status: 500 })
  const [{ data: proposed }, { data: approved }, { data: flags }] = await Promise.all([
    sb.from('test_knowledge').select('*').eq('status', 'proposed').order('created_at', { ascending: false }).limit(100),
    sb.from('test_knowledge').select('id, kind, title, subjects, grade_min, grade_max, verified_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(200),
    sb.from('test_flags').select('id, kind, reason, note, status, triage, created_at').eq('status', 'open').order('created_at', { ascending: false }).limit(50),
  ])
  return NextResponse.json({ proposed, approved, flags })
}

// { action: 'approve' | 'reject' | 'add' | 'run' , id?, entry? }
export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const sb = serviceClient()
  if (!sb) return NextResponse.json({ error: 'no service key' }, { status: 500 })
  const b = (await req.json().catch(() => ({}))) as { action?: string; id?: string; entry?: Record<string, unknown>; flagId?: string; flagStatus?: string }
  if (b.action === 'approve' || b.action === 'reject') {
    const { error } = await sb.from('test_knowledge').update({ status: b.action === 'approve' ? 'approved' : 'rejected', verified_at: b.action === 'approve' ? new Date().toISOString() : null }).eq('id', b.id ?? '')
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
  }
  if (b.action === 'add' && b.entry) {
    const e = b.entry
    const subjects = String(e.subjects ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    if (!subjects.length || !e.title || !e.body || !['term', 'rule', 'fact', 'avoid'].includes(String(e.kind))) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const { error } = await sb.from('test_knowledge').insert({
      subjects, kind: e.kind, title: String(e.title).slice(0, 120), body: String(e.body).slice(0, 1200),
      grade_min: Number(e.gradeMin) || 1, grade_max: Number(e.gradeMax) || 12, source_url: e.sourceUrl ? String(e.sourceUrl) : null,
      status: 'approved', origin: 'admin', verified_at: new Date().toISOString(),
    })
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
  }
  if (b.action === 'definition' && b.entry) {
    const e = b.entry
    if (!e.subject || !e.term || !e.definition) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    const { error } = await sb.from('verified_definitions').upsert({
      subject: String(e.subject).toLowerCase().slice(0, 60), grade: Number(e.grade) || null, term: String(e.term).slice(0, 120),
      definition_text: String(e.definition).slice(0, 1200), source: e.source ? String(e.source) : null,
    }, { onConflict: 'subject,grade,term' })
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
  }
  if (b.action === 'flag' && b.flagId && (b.flagStatus === 'accepted' || b.flagStatus === 'rejected')) {
    await sb.from('test_flags').update({ status: b.flagStatus }).eq('id', b.flagId)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'run') {
    const flags = await triageFlags(6)
    const facts = await refreshFacts(6)
    return NextResponse.json({ flags, facts })
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
