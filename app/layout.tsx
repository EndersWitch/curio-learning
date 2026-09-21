import type { Metadata, Viewport } from 'next'
import { Fraunces, Work_Sans } from 'next/font/google'
import './globals.css'
import AdGate from '@/components/AdGate'
import MobileTabBar from '@/components/MobileTabBar'
import { AccountDrawerProvider } from '@/components/AccountDrawerProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { themeBootScript } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth-context'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

const workSans = Work_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-worksans',
  display: 'swap',
})

// viewportFit 'cover' lets the layout use the full screen on notched phones
// (the bottom tab bar pads itself with env(safe-area-inset-bottom)). Zoom is
// deliberately left enabled for accessibility.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F0E2' },
    { media: '(prefers-color-scheme: dark)', color: '#1B1611' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.curiolearning.co.za'),
  title: {
    default: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    template: '%s · curio learning',
  },
  description:
    'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners, Grades 4–12. Practise smarter with curio learning.',
  keywords: [
    'CAPS', 'exam papers', 'practice papers', 'memos', 'South Africa',
    'Grade 4', 'Grade 12', 'quizzes', 'study', 'DBE',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.curiolearning.co.za',
    siteName: 'curio learning',
    title: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    description:
      'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners, Grades 4–12.',
  },
  twitter: {
    card: 'summary',
    title: 'curio learning · CAPS-aligned exam prep for Grades 4–12',
    description:
      'Free CAPS-aligned exam papers, memos and interactive quizzes for South African learners.',
  },
  // Home-screen install (iOS ignores the manifest icons, so it needs these).
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'curio', statusBarStyle: 'default' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <ThemeProvider>
          <AuthProvider>
            <AccountDrawerProvider>{children}</AccountDrawerProvider>
            <MobileTabBar />
            <AdGate />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
