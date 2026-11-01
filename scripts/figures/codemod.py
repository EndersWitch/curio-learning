#!/usr/bin/env python3
"""Make a STEM Figures app (and packages/shared) work under a base path.

Rewrites hard-coded root-relative links and images (href="/x", src="/x") into
`${base}/x` using SvelteKit's $app/paths, and adds the import. Safe to run twice.
"""
import re, sys, pathlib

root = pathlib.Path(sys.argv[1])
ATTR = re.compile(r'''(\s(?:href|src))="(/(?!/)[^"{}]*)"''')
changed = 0

def add_import(text):
    if "from '$app/paths'" in text:
        if re.search(r"import\s*\{[^}]*\bbase\b[^}]*\}\s*from '\$app/paths'", text):
            return text
        return re.sub(r"import\s*\{([^}]*)\}\s*from '\$app/paths'", lambda m: "import { base," + m.group(1) + "} from '$app/paths'", text, count=1)
    m = re.search(r'<script(?![^>]*\bmodule\b)[^>]*>\n?', text)
    if m:
        return text[:m.end()] + "  import { base } from '$app/paths'\n" + text[m.end():]
    return "<script lang=\"ts\">\n  import { base } from '$app/paths'\n</script>\n\n" + text

for p in list(root.rglob('*.svelte')):
    if 'node_modules' in p.parts or '.svelte-kit' in p.parts:
        continue
    t = p.read_text()
    if not ATTR.search(t):
        continue
    new = ATTR.sub(lambda m: f'{m.group(1)}={{`${{base}}{m.group(2)}`}}', t)
    new = add_import(new)
    p.write_text(new)
    changed += 1
print(f'{changed} files changed under {root}')
