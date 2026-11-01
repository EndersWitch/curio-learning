// /llms.txt (https://llmstxt.org): the site, its generators and how to link
// to an exact figure, for AI assistants. Made from the catalog and each
// generator's linking.ts; see $lib/linking/llms.ts.

import { llmsTxt } from '$lib/linking/llms'

export const prerender = true

export function GET() {
  return new Response(llmsTxt(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
