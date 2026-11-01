// /llms-full.txt: every generator's full address parameter reference, for AI
// assistants and tools. See $lib/linking/llms.ts.

import { llmsFullTxt } from '$lib/linking/llms'

export const prerender = true

export function GET() {
  return new Response(llmsFullTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
