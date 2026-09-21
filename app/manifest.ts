import type { MetadataRoute } from 'next'

// Lets phones "Add to Home Screen" and launch curio like an app (no browser
// chrome). Colours match the light paper theme; the page itself still follows
// the user's saved light/dark preference once it loads.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'curio learning',
    short_name: 'curio',
    description: 'CAPS-aligned exam papers, memos and interactive quizzes for South African learners, Grades 4–12.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F6F0E2',
    theme_color: '#F6F0E2',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
