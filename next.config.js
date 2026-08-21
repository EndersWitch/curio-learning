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
