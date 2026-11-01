#!/usr/bin/env python3
"""Combine the per-site output of render-library.mjs into public/tools/figure-library.

  python3 scripts/figures/make-library-index.py <render-output-dir>

Copies the SVGs, writes index.json (read by the /tools/library page) and INDEX.md (for searching with grep).
"""
import json, os, shutil, sys

src = sys.argv[1]
dst = 'public/tools/figure-library'
shutil.rmtree(dst, ignore_errors=True)
os.makedirs(dst)
allx = []
for site in ['math', 'physics', 'chemistry', 'biology', 'economics']:
    if not os.path.isdir(f'{src}/{site}'):
        continue
    for g in sorted(os.listdir(f'{src}/{site}')):
        p = f'{src}/{site}/{g}'
        if os.path.isdir(p):
            shutil.copytree(p, f'{dst}/{site}/{g}')
    for e in json.load(open(f'{src}/{site}/index.json')):
        e['file'] = f"/tools/figure-library/{site}/{e['generator']}/{e['slug']}.svg"
        e['open'] = f"/tools/figures/{site}{e['edit']}"
        del e['edit']
        allx.append(e)
allx.sort(key=lambda e: (e['site'], e['generator'], e['slug']))
json.dump(allx, open(f'{dst}/index.json', 'w'), ensure_ascii=False, separators=(',', ':'))
L = ['# Figure library', '', f"{len(allx)} ready-made figures, each an SVG. `file` is the path under `public`; `open` is the address of the generator with that figure's settings (change them and render again).", '',
     'Search: `grep -i "pie chart" public/tools/figure-library/INDEX.md`', '']
cur = None
for e in allx:
    k = (e['site'], e['generator'])
    if k != cur:
        L += ['', f"## {e['site']} / {e['generator']}", '']
        cur = k
    L.append(f"- **{e['title']}** — {e['description']}  \n  file: `{e['file'].replace('/tools/figure-library/', 'public/tools/figure-library/')}`  \n  open: `{e['open']}`")
open(f'{dst}/INDEX.md', 'w').write('\n'.join(L) + '\n')
print(len(allx), 'figures')
