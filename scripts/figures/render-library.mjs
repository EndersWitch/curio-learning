#!/usr/bin/env node
// Renders every ready-made example figure of a running STEM Figures site to SVG, plus
// an index of what each one shows. Run it once per site (maths, physics, chemistry,
// biology, economics); see scripts/figures/README.md.
//
//   node scripts/figures/render-library.mjs <site-name> <base-url> [out-dir]
//   node scripts/figures/render-library.mjs math http://127.0.0.1:5191
//
// For each example page listed in the site's sitemap it reads the title, picture
// description and caption, opens the generator with that example's settings (the page's
// "Edit this figure" link) and saves what the generator's own "Download SVG" button
// gives. Output: <out>/<site>/<generator>/<slug>.svg and <out>/<site>/index.json.
// Needs Playwright with Chromium.

import { createRequire } from 'node:module'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
const { chromium } = createRequire(import.meta.url)('playwright')

const [site, base, out = 'public/figures/library'] = process.argv.slice(2)
if (!site || !base) {
  console.error('usage: render-library.mjs <site-name> <base-url> [out-dir]')
  process.exit(2)
}

const sitemap = await (await fetch(new URL('/sitemap.xml', base))).text()
const pages = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => new URL(m[1]).pathname)
  .filter((p) => /^\/[^/]+\/examples\/[^/]+$/.test(p))
console.log(`${site}: ${pages.length} examples`)

// Resume: keep what an earlier run already saved, and only do the rest.
const indexFile = join(out, site, 'index.json')
const done = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')) : []
const have = new Set(done.map((d) => `/${d.generator}/examples/${d.slug}`))
const todo = pages.filter((p) => !have.has(p))
console.log(`${site}: ${done.length} already saved, ${todo.length} to do`)

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] })
const index = [...done]
const failures = []
let next = 0

async function worker() {
  // A page can crash on heavy figures; start a fresh browser context after any failure
  // and after every few figures, and try each figure twice before giving up.
  let ctx, page, used = 0
  const fresh = async () => {
    if (ctx) await ctx.close().catch(() => {})
    ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true })
    page = await ctx.newPage()
    used = 0
  }
  await fresh()
  while (next < todo.length) {
    const path = todo[next++]
    const [, generator, , slug] = path.split('/')
    let lastError
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (used >= 6) await fresh()
        used++
        await page.goto(new URL(path, base).toString(), { waitUntil: 'domcontentloaded' })
        await page.waitForSelector('h1')
        const meta = await page.evaluate(() => ({
          title: document.querySelector('h1')?.textContent?.trim() ?? '',
          alt: document.querySelector('figure img')?.getAttribute('alt') ?? '',
          caption: document.querySelector('figure figcaption')?.textContent?.trim() ?? '',
          edit: [...document.querySelectorAll('a')].find((a) => /Edit this figure/.test(a.textContent ?? ''))?.getAttribute('href') ?? '',
        }))
        if (!meta.edit) throw new Error('no edit link')
        await page.goto(new URL(meta.edit, base).toString(), { waitUntil: 'networkidle' })
        const button = page.getByRole('button', { name: 'Download SVG' }).first()
        await button.waitFor({ timeout: 20000 })
        const [download] = await Promise.all([page.waitForEvent('download'), button.click()])
        const file = join(out, site, generator, `${slug}.svg`)
        mkdirSync(dirname(file), { recursive: true })
        await download.saveAs(file)
        index.push({ site, generator, slug, title: meta.title, description: meta.alt, caption: meta.caption, edit: meta.edit, file: `/figures/library/${site}/${generator}/${slug}.svg` })
        lastError = undefined
        break
      } catch (e) {
        lastError = e
        await fresh()
      }
    }
    if (lastError) failures.push({ path, error: String(lastError).slice(0, 120) })
    if (next % 20 === 0) console.log(`${site}: ${next}/${todo.length}`)
  }
  await ctx.close().catch(() => {})
}

await Promise.all([worker(), worker()])
await browser.close()
index.sort((a, b) => (a.generator + a.slug).localeCompare(b.generator + b.slug))
mkdirSync(join(out, site), { recursive: true })
writeFileSync(join(out, site, 'index.json'), JSON.stringify(index, null, 1))
console.log(`${site}: saved ${index.length}, failed ${failures.length}`)
for (const f of failures) console.log('  FAIL', f.path, f.error)
