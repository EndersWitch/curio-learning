# Family search from site manifests

Status: proposed. For now the directory only links to each figure site.

Teachers should be able to search every generator in the family from STEM Figures ("graduated cylinder", "free body diagram", "number line") and land on the right one. Each figure site already keeps a `GENERATORS` list in `src/lib/generators/index.ts` (name, path, blurb, description, keywords, preview) that drives its own directory, search and sitemap, so that list is the source of truth for search too.

## Decision

1. **Each figure site publishes a manifest.** A prerendered `/generators.json` endpoint, built from its `GENERATORS` list: `id`, `name`, `path`, `blurb`, `description` and `keywords`, plus the site's name and URL. Later, a prerendered `/previews/<id>.svg` of each generator's preview for the cards. This is a few lines per site, and the site stays independent.
2. **STEM Figures reads every manifest at build time.** A prerendered load fetches the five manifests, merges them into one list and ships it with the page. Search runs in the browser with the same every-word-starts-a-word match the figure sites use, and each result links to `https://<site><path>`. If a site's manifest can't be fetched, the build keeps going and that site shows as a plain link card, as it does now.
3. **Each figure site's deploy rebuilds STEM Figures.** Its GitHub workflow calls a Vercel deploy hook for STEM Figures after a push to `main`, so a new generator shows up in family search without anyone touching this repo. A daily scheduled rebuild covers anything missed.

## Considered Options

- **Shared package or monorepo holding every generator list**: one import, but it couples five independent repos and their release cycles, and the lists pull in each site's Svelte preview components.
- **Browser fetches the manifests on each visit**: always fresh, but it needs CORS on every site, makes five requests before results appear, and gives search engines nothing to index.
- **Hosted search service (Algolia, a vector database, an LLM)**: handles vague queries like "something for Newton's second law", but it adds cost, keys and a backend for what will be tens of generators for a while. Keywords already cover most of those queries. If they stop being enough, embeddings can be computed at build time from the same manifests without changing this design.

## Consequences

A generator's `keywords` now matter beyond its own site, so they should cover how teachers across subjects would search for it. The manifest's fields become a contract between repos: add fields freely, but don't rename or remove them without updating STEM Figures.
