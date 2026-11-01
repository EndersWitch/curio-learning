# Diagrams (STEM Figures), in house

Everything here is served by curio itself, behind the tools key (middleware.ts). Nothing links out.

| What | Where |
| --- | --- |
| The five diagram makers (maths, physics, chemistry, biology, economics) | `public/tools/figures/<site>/`, opened at `/tools/figures/<site>` |
| 422 ready-made figures as SVG, with descriptions | `public/tools/figure-library/` (browse at `/tools/library`; search `INDEX.md` with grep) |
| Upstream source, untouched | `vendor/teacherdotdev/stem-figures` |

Figures are public domain (CC0 1.0). No credit needed. Keep them as SVG, never PNG.

## Using a figure in content

1. Find one: `grep -i "free body" public/tools/figure-library/INDEX.md`.
2. Copy its SVG to `public/figures/` (that folder is public; the library is not) and use `/figures/<name>.svg`.
3. Need different numbers or labels? Take its `open:` address (a generator address with the figure's settings in the query), change the settings, and render it again (below).

## Rendering a figure from an address

```sh
# Run a site locally (once): see "Rebuilding" for how the copy is patched.
cd vendor/teacherdotdev/stem-figures && npm install && cd apps/math && npx vite dev --port 5191
# Then, from the repo root:
npm i -D playwright && npx playwright install chromium
node scripts/figures/render-figure.mjs http://127.0.0.1:5191 "/pie-chart?<settings>" public/figures/my-pie.svg
```

`/tools/figures/<site>/<generator>?<settings>` in the hosted copy takes the same settings, so a figure can also be set up in the browser and its address copied.

## Rebuilding

- `bash scripts/figures/build-hosted.sh` rebuilds the five hosted sites from the vendored source (it copies the source to a temporary folder, applies `host-patch.py` and `codemod.py`, builds, and replaces `public/tools/figures/<site>`).
- `node scripts/figures/render-library.mjs <site> <url> <out>` renders every example of a running site, then `python3 scripts/figures/make-library-index.py <out>` rebuilds `public/tools/figure-library`. The render script resumes where it stopped.
- To take newer upstream code, replace `vendor/teacherdotdev/stem-figures` with a fresh copy and rebuild. `host-patch.py` makes the changes curio needs: base path, static single-page build, curio wording and logo, links kept inside curio, no example galleries.

## Notes for content

- The figures use US conventions in places (miles, "color", dollars, inches). Check units and spelling before using one for SA learners, and change them in the generator where it allows.
