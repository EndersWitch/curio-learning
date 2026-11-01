# teacher.dev open-source code in curio

Copied from https://github.com/teacherdotdev (Apache-2.0) on 2026-11-01. Each folder keeps its own LICENSE.

| Folder | Upstream commit | Used how |
| --- | --- | --- |
| `lines` | cloned 2026-11-01 | Built to `public/tools/lines/` (base path patched) |
| `fraction-fun` | cloned 2026-11-01 | Built to `public/tools/fraction-fun/` (base path patched, analytics beacon removed) |
| `algebra-tiles` | cloned 2026-11-01 | Built to `public/tools/algebra-tiles/` (static adapter, base path patched) |
| `stem-figures` | aa64a3668f44 | Source only. Examples and og images left out. Use for self-hosting later |
| `morphology-mash` | 15fb9b1630c4 | Data copied to `lib/data/morphology/` |
| `question-commons` | 50fee56b34fa | Source only. Also installable: `npm i @teacherdotdev/question-commons` |

Changes made to the three built apps: Vite/SvelteKit base path set to `/tools/<name>/`, internal links made base-aware, teacher.dev analytics removed, photos of teacher.dev people removed, Vercel adapter swapped for the static adapter (Algebra Tiles).

To rebuild a tool: `cd vendor/teacherdotdev/<name> && npm install && npm run build`, then copy `dist/` (Algebra Tiles: `build/`) into `public/tools/<name>/`.
