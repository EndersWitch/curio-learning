# teacher.dev open-source code in curio

Copied from https://github.com/teacherdotdev (Apache-2.0) on 2026-11-01. Each folder keeps its own LICENSE.

| Folder | Upstream commit | Used how |
| --- | --- | --- |
| `lines` | cloned 2026-11-01 | Built to `public/tools/lines/` (base path patched) |
| `fraction-fun` | cloned 2026-11-01 | Built to `public/tools/fraction-fun/` (base path patched, analytics beacon removed) |
| `algebra-tiles` | cloned 2026-11-01 | Built to `public/tools/algebra-tiles/` (static adapter, base path patched) |
| `stem-figures` | aa64a3668f44 | Untouched upstream source (example PNGs left out). Built to `public/tools/figures/<site>/` by `scripts/figures/build-hosted.sh` |
| `morphology-mash` | 15fb9b1630c4 | Data copied to `lib/data/morphology/` |
| `question-commons` | 50fee56b34fa | Source only. Also installable: `npm i @teacherdotdev/question-commons` |

Changes made to the three built apps: base path `/tools/<name>/` with base-aware links, curio colours and branding, teacher.dev analytics and photos of their people removed, support email changed to curio's, `?embed=1` mode that hides the page chrome, and a `postMessage` to the host page when the learner finishes (`src/lib/curio.*`). Algebra Tiles also swaps the Vercel adapter for the static adapter. See `/THIRD_PARTY_NOTICES.md`.

To rebuild a tool: `cd vendor/teacherdotdev/<name> && npm install && npm run build`, then copy `dist/` (Algebra Tiles: `build/`) into `public/tools/<name>/`.
