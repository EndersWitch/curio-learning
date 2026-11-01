#!/usr/bin/env python3
"""Turn a STEM Figures workspace into one that builds as static single-page apps under
/tools/figures/<site>/ inside curio. Usage: host-patch.py <workspace> <site> [<site> ...]
Idempotent enough to run on a fresh copy; do not run twice on the same copy."""
import re, sys, pathlib, shutil, subprocess

ws = pathlib.Path(sys.argv[1]); sites = sys.argv[2:]
CODEMOD = pathlib.Path(__file__).with_name('codemod.py')
DOMAINS = {'mathfigures.com':'math','physicsfigures.com':'physics','chemistryfigures.com':'chemistry',
           'biologyfigures.com':'biology','econfigures.com':'economics','engineeringfigures.com':'engineering'}
REPO = pathlib.Path(__file__).resolve().parents[2]
ICON = (REPO/'app/icon.svg').read_text()

def sub(path, pattern, repl, count=1, flags=0, literal=False):
    t = path.read_text()
    new = t.replace(pattern, repl, count) if literal else re.sub(pattern, repl, t, count=count, flags=flags)
    if new == t: print('  (no change)', path.relative_to(ws), pattern[:40])
    path.write_text(new)

# ---- shared package
shared = ws/'packages/shared/src'
subprocess.check_call(['python3', str(CODEMOD), str(shared)])
cat = shared/'catalog/index.ts'
t = cat.read_text()
for dom, name in DOMAINS.items(): t = t.replace(f"'https://{dom}'", f"'/tools/figures/{name}'")
t = t.replace("import { BIOLOGY } from './biology'", "import { base } from '$app/paths'\nimport { BIOLOGY } from './biology'", 1)
t = t.replace("(g.site === here ? g.path : SITES[g.site].url + g.path)", "(g.site === here ? `${base}${g.path}` : SITES[g.site].url + g.path)")
cat.write_text(t)
mail = shared/'EmailDialog.svelte'
mail.write_text(mail.read_text().replace("'support@teacher.dev'", "'hello@curiolearning.co.za'"))

for site in sites:
    app = ws/'apps'/site
    print('patching', site)
    subprocess.check_call(['python3', str(CODEMOD), str(app/'src')])
    # 1. adapter / base path / SPA
    (app/'svelte.config.js').write_text(f"""import adapter from '@sveltejs/adapter-static'

// Hosted inside curio under /tools/figures/{site}/ (see scripts/figures/build-hosted.sh).
/** @type {{import('@sveltejs/kit').Config}} */
export default {{
  kit: {{
    adapter: adapter({{ pages: 'build', assets: 'build', fallback: 'index.html', strict: false }}),
    paths: {{ base: '/tools/figures/{site}', relative: false }},
    prerender: {{ handleHttpError: 'warn', handleMissingId: 'ignore', handleUnseenRoutes: 'ignore' }},
    // Code shared by the STEM Figures sites lives in packages/shared.
    alias: {{ $shared: '../../packages/shared/src' }},
  }},
}}
""")
    (app/'src/routes/+layout.ts').write_text("""// The generators read their settings from the page address, so every page is drawn in the
// browser. The site is one shell (index.html) that every address falls back to.
export const ssr = false
export const prerender = false
""")
    root_page = app/'src/routes/+page.ts'
    if root_page.exists(): root_page.write_text('')
    # 2. server-only routes and the example galleries
    routes = app/'src/routes'
    for p in list(routes.glob('sitemap.xml')) + list(routes.glob('llms*.txt')): shutil.rmtree(p)
    for p in routes.glob('[[]generator=examplegenerator[]]'): shutil.rmtree(p)
    ex = app/'src/lib/examples/examples.ts'
    if ex.exists():
        t = ex.read_text()
        fn = re.search(r"function examplesOf<[^\n]*\{\n", t)
        t = t[:fn.end()] + "  // Curio hosts the generators without the example galleries; the ready-made figures are saved as SVG in public/figures/library.\n  return []\n" + t[fn.end():]
        ex.write_text(t)
    # 3. findGenerator ignores the base path
    gi = app/'src/lib/generators/index.ts'
    t = gi.read_text()
    t = t.replace("export const findGenerator = (path: string) => GENERATORS.find((g) => g.path === path)",
        "export const findGenerator = (path: string) => {\n  const local = (path.startsWith(base) ? path.slice(base.length) : path).replace(/\\/$/, '') || '/'\n  return GENERATORS.find((g) => g.path === local)\n}")
    t = "import { base } from '$app/paths'\n" + t
    gi.write_text(t)
    # 4. links to the other sites stay inside curio
    cfg = app/'src/lib/site/config.ts'
    t = cfg.read_text()
    for dom, name in DOMAINS.items(): t = t.replace(f"'https://{dom}'", f"'/tools/figures/{name}'")
    cfg.write_text(t)
    # 5. what's new links
    news = app/'src/lib/site/News.svelte'
    if news.exists():
        t = news.read_text()
        t = t.replace("href={item.link.href}", "href={item.link.href.startsWith('/') ? `${base}${item.link.href}` : item.link.href}")
        if "import { base }" not in t:
            t = re.sub(r"(<script[^>]*>\n)", r"\1  import { base } from '$app/paths'\n", t, count=1)
        news.write_text(t)
    # 6. footer, about, privacy: curio's own wording; people photo removed
    foot = app/'src/lib/site/Footer.svelte'
    t = foot.read_text()
    t = re.sub(r'<a href="https://teacher\.dev"[^>]*>\s*(<img[^>]*/>)\s*<span>Built by teacher\.dev</span>\s*</a>',
               r'<a href="/tools">\1\n    <span>curio learning</span>\n  </a>', t)
    foot.write_text(t)
    about = app/'src/routes/about/+page.svelte'
    t = about.read_text()
    head = t[:t.index('<Seo')]
    style = t[t.index('<style'):] if '<style' in t else ''
    title = re.search(r'<Seo title="About" description="([^"]*)"', t).group(1).replace('from teacher.dev', 'by curio learning')
    about.write_text(head + f'''<Seo title="About" description="{title}" path="/about" />

<div class="page">
  <a class="back" href={{`${{base}}/`}}>← All figures</a>
  <h1>About</h1>
  <p class="sub">Clean figures for tests and worksheets.</p>

  <section class="card">
    <div class="titlerow">
      <img src={{`${{base}}/logo.svg`}} alt="" width="40" height="40" />
      <h2>Part of curio learning</h2>
    </div>
    <p>
      These figure makers are one of curio learning's own tools. They are adapted from STEM Figures, open-source
      software by <a href="https://github.com/teacherdotdev/stem-figures" target="_blank" rel="noopener noreferrer">teacher.dev</a>,
      under the Apache License 2.0. See the <a href="/licences">licences page</a>.
    </p>
    <p>Every figure you make here is dedicated to the public domain (CC0 1.0). Use it anywhere, no credit needed.</p>
  </section>
</div>

''' + style)
    priv = app/'src/routes/privacy/+page.svelte'
    t = priv.read_text()
    head = t[:t.index('<Seo')]
    style = t[t.index('<style'):] if '<style' in t else ''
    priv.write_text(head + '''<Seo title="Privacy" description="These figure makers store nothing and send nothing." path="/privacy" />

<div class="page">
  <a class="back" href={`${base}/`}>← All figures</a>
  <h1>Privacy</h1>
  <p class="sub">What we collect, what we don't, and why.</p>

  <section class="card">
    <p>
      These tools use no cookies and no trackers. A figure's settings live in the page address and in your browser,
      and nothing you draw is sent anywhere.
    </p>
  </section>
</div>

''' + style)
    # 7. curio's mark instead of the original logo; no people photo; no search-engine files
    for name in ('logo.svg', 'favicon.svg'): (app/'static'/name).write_text(ICON)
    for junk in ('2026participants.jpg', 'robots.txt'):
        f = app/'static'/junk
        if f.exists(): f.unlink()
    for d in ('examples', 'og'):
        if (app/'static'/d).exists(): shutil.rmtree(app/'static'/d)
print('done')
