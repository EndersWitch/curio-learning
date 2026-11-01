/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      // Clean URLs → static HTML files in /public (internal tools only)
      { source: '/admin', destination: '/admin.html' },
      { source: '/formatter', destination: '/formatter.html' },
      { source: '/quiz-formatter', destination: '/quiz-formatter.html' },
      // Self-hosted maths tools (built from teacher.dev's open-source apps, see
      // vendor/teacherdotdev). Each is a single-page app that reads its own URL,
      // so every path inside it serves the same index.html.
      { source: '/tools/lines', destination: '/tools/lines/index.html' },
      { source: '/tools/lines/:path*', destination: '/tools/lines/index.html' },
      { source: '/tools/fraction-fun', destination: '/tools/fraction-fun/index.html' },
      { source: '/tools/fraction-fun/teacher', destination: '/tools/fraction-fun/index.html' },
      // STEM Figures diagram makers, built as single-page apps (scripts/figures/build-hosted.sh).
      { source: '/tools/figures/:site(math|physics|chemistry|biology|economics)', destination: '/tools/figures/:site/index.html' },
      { source: '/tools/figures/:site(math|physics|chemistry|biology|economics)/:path*', destination: '/tools/figures/:site/index.html' },
      { source: '/tools/algebra-tiles', destination: '/tools/algebra-tiles/index.html' },
      { source: '/tools/algebra-tiles/:page(about|privacy|factor|multiply|solve|play)', destination: '/tools/algebra-tiles/:page.html' },
      // Everything else (subjects, papers, subscription, contact, privacy,
      // terms, deeplearn) is now a real Next.js route (app/**).
    ]
  },
  async redirects() {
    return [
      // Legacy .html links that floated around old pages → real routes
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/login.html', destination: '/login', permanent: true },
      { source: '/quiz.html', destination: '/quiz', permanent: true },
      // Profile is now an overlay drawer on the home page, not its own page
      { source: '/profile', destination: '/?account=1', permanent: false },
      { source: '/profile.html', destination: '/?account=1', permanent: false },
    ]
  },
}

module.exports = nextConfig
