#!/usr/bin/env node
// Renders one STEM Figures diagram to an SVG file, exactly as the site's own
// "Download SVG" button would, so it can go into a paper, a quiz or a card.
//
//   node scripts/figures/render-figure.mjs <base-url> <path-with-query> <out.svg>
//   node scripts/figures/render-figure.mjs http://127.0.0.1:5190 "/pie-chart" public/figures/pie.svg
//
// The base URL is a running copy of one STEM Figures site: the maths, physics, chemistry,
// biology or economics app (see scripts/figures/README.md). Every figure's settings live
// in its page address, so open the figure in a browser, set it up, and pass that address.
// Needs Playwright with Chromium (npm i -D playwright).

import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [base, path, out] = process.argv.slice(2)
if (!base || !path || !out) {
  console.error('usage: render-figure.mjs <base-url> <path-with-query> <out.svg>')
  process.exit(2)
}

const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } })
  await page.goto(new URL(path, base).toString(), { waitUntil: 'networkidle' })
  const button = page.getByRole('button', { name: 'Download SVG' }).first()
  await button.waitFor({ timeout: 20000 })
  const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
  mkdirSync(dirname(out), { recursive: true })
  await download.saveAs(out)
  console.log(`saved ${out}`)
} finally {
  await browser.close()
}
