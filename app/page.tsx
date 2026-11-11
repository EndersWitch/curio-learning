import type { Metadata } from 'next'
import HomePage from '@/components/HomePage'

// The home page (landing for guests, dashboard when signed in) is a client
// component, so its metadata lives in this server wrapper. The canonical is
// set here, not in the root layout, because layout metadata is inherited by
// every page.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default function Page() {
  return <HomePage />
}
