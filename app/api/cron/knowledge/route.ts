import { NextResponse } from 'next/server'
import { refreshFacts, triageFlags } from '@/lib/testbuilder/learn'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Weekly (vercel.json): triage open learner reports and re-check current facts.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  const flags = await triageFlags(8)
  const facts = await refreshFacts(8)
  return NextResponse.json({ flags, facts })
}
