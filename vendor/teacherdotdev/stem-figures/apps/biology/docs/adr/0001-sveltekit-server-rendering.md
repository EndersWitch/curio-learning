# SvelteKit with server-rendered generator pages

Biology Figures moved from a single-page Vite app to SvelteKit on Vercel, even though every figure could be drawn entirely in the browser. Teachers mostly arrive by searching for a generator ("Punnett square generator"), so each page needs its own real HTML title and description. A generator page is rendered on the server for each visit, because its settings live in the query string: a shared link then arrives already showing that exact figure, with no flash of the default one. The directory, About and Privacy pages have no settings and are prerendered.

## Considered Options

- **Single-page app with titles set from JavaScript**: simplest, but every URL serves the same HTML until scripts run, which is weaker for search.
- **Prerender every page**: static and free, but a shared link first shows the default figure and then swaps to the linked one.

## Consequences

Generator code must render without a browser (no `window` or `localStorage` at load; read the address through SvelteKit). Server rendering also makes per-figure link preview images possible later.
