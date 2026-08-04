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
      // Clean URLs → static HTML files in /public
      { source: '/papers', destination: '/papers.html' },
      { source: '/subscription', destination: '/subscription.html' },
      { source: '/contact', destination: '/contact.html' },
      { source: '/privacy', destination: '/privacy.html' },
      { source: '/terms', destination: '/terms.html' },
      { source: '/deeplearn', destination: '/deeplearn.html' },
      { source: '/admin', destination: '/admin.html' },
      { source: '/formatter', destination: '/formatter.html' },
      { source: '/quiz-formatter', destination: '/quiz-formatter.html' },
      { source: '/subjects', destination: '/subjects/index.html' },
      { source: '/subjects/grade-:num(\\d+)', destination: '/subjects/grade-:num/index.html' },
      { source: '/subjects/grade-:num(\\d+)/:subject', destination: '/subjects/grade-:num/:subject.html' },
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
