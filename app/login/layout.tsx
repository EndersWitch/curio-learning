import type { Metadata } from 'next'

// The page itself is a client component, so its metadata lives here. A login
// form isn't content worth indexing (and isn't eligible for ads).
export const metadata: Metadata = {
  title: 'Log in',
  robots: { index: false, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
