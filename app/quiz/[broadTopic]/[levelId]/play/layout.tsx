import type { Metadata } from 'next'

// The quiz runner is interactive and loads its questions in the browser, so
// its HTML is just a loading state — keep it out of the index. The lesson it
// belongs to (…/learn) is the indexable page.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
