// Pictures of each generator's directory preview, for showing it on sites
// other than its own (a site can only draw its own generators' previews).
// Retake them after changing a preview, from the monorepo root:
//   node scripts/snapshot-previews.mjs <the site's directory URL>

const files = import.meta.glob<string>('./previews/*.png', { eager: true, query: '?url', import: 'default' })

export const previewSnapshot = (id: string): string | undefined => files[`./previews/${id}.png`]
