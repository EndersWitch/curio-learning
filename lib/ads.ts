// AdSense publisher ID — used by the <meta name="google-adsense-account">
// tag in app/layout.tsx (site verification that doesn't depend on JS) and by
// components/AdGate.tsx (the Auto Ads script itself). Must match public/ads.txt.
export const ADSENSE_CLIENT_ID = 'ca-pub-2405111123009991'

// Screens with no publisher content of their own (login, checkout, a
// "coming soon" page) can't carry Google-served ads under AdSense policy, and
// the live quiz is all tap targets, which invites accidental clicks.
export function isAdFreePath(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname === '/subscription' ||
    pathname === '/deeplearn' ||
    /^\/quiz\/[^/]+\/[^/]+\/play\/?$/.test(pathname)
  )
}
