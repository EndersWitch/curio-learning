import type { Metadata, Viewport } from 'next'
import { Raleway, Merriweather } from 'next/font/google'
import './globals.css'
import AdGate from '@/components/AdGate'
import MobileTabBar from '@/components/MobileTabBar'
import PaymentBanner from '@/components/PaymentBanner'
import { AccountDrawerProvider } from '@/components/AccountDrawerProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import { themeBootScript } from '@/lib/theme'
import { AuthProvider } from '@/lib/auth-context'
import { ADSENSE_CLIENT_ID } from '@/lib/ads'

// Raleway for headings, buttons and UI; Merriweather for running text.
const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
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
    default: 'curio learning · free CAPS practice papers, quizzes and subject guides',
    template: '%s · curio learning',
  },
  description:
    'Free CAPS-aligned practice papers with full memos, English Home Language quizzes for Grades 4 to 7, and subject guides for Grades 4 to 12. More is added all the time.',
  keywords: [
    'CAPS', 'practice papers', 'memos', 'South Africa', 'English Home Language',
    'Grade 4', 'Grade 7', 'quizzes', 'subject guides', 'study',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://www.curiolearning.co.za',
    siteName: 'curio learning',
    title: 'curio learning · free CAPS practice papers, quizzes and subject guides',
    description:
      'Free CAPS-aligned practice papers with full memos, English Home Language quizzes for Grades 4 to 7, and subject guides for Grades 4 to 12.',
  },
  twitter: {
    card: 'summary',
    title: 'curio learning · free CAPS practice papers, quizzes and subject guides',
    description:
      'Free CAPS-aligned practice papers, memos and quizzes for South African learners.',
  },
  // Home-screen install (iOS ignores the manifest icons, so it needs these).
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: { capable: true, title: 'curio', statusBarStyle: 'default' },
  robots: { index: true, follow: true },
  // No site-wide canonical here: metadata is inherited, so a canonical of '/'
  // in this root layout told Google every page was a duplicate of the
  // homepage. Pages that need one set their own.
  other: { 'google-adsense-account': ADSENSE_CLIENT_ID },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${raleway.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <body className="font-heading antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <ThemeProvider>
          <AuthProvider>
            <AccountDrawerProvider>{children}</AccountDrawerProvider>
            <PaymentBanner />
            <MobileTabBar />
            <AdGate />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
