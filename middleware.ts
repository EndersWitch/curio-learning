import { NextResponse, type NextRequest } from 'next/server'

// The hands-on maths tools (/tools/**) and their credits page (/licences) are private
// for now. Anyone without the key gets an ordinary 404, so the pages look like they do
// not exist.
//
//   Open /tools?key=<TOOLS_KEY> once on a device. That sets a cookie for 90 days and the
//   tools (including the frames inside quizzes and cards) work on that device.
//
//   TOOLS_KEY unset            -> closed to everyone (fails closed)
//   TOOLS_ACCESS=everyone      -> open to the public; this is the "launch" switch
//
// Both are Vercel environment variables, like BLOOM_ACCESS for Bloom.

const COOKIE = 'curio-tools'

async function digest(value: string) {
  const bytes = new TextEncoder().encode(`curio-tools:${value}`)
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
}

function notFound() {
  return new NextResponse('Not found', {
    status: 404,
    headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  })
}

export async function middleware(req: NextRequest) {
  if (process.env.TOOLS_ACCESS?.trim().toLowerCase() === 'everyone') return NextResponse.next()

  const key = process.env.TOOLS_KEY?.trim()
  if (!key) return notFound()
  const expected = await digest(key)

  // First visit with the key: set the cookie and go to the same page without it.
  const offered = req.nextUrl.searchParams.get('key')
  if (offered !== null) {
    if ((await digest(offered)) !== expected) return notFound()
    const clean = req.nextUrl.clone()
    clean.searchParams.delete('key')
    const res = NextResponse.redirect(clean)
    res.cookies.set(COOKIE, expected, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 90,
    })
    res.headers.set('Cache-Control', 'no-store')
    return res
  }

  if (req.cookies.get(COOKIE)?.value !== expected) return notFound()

  const res = NextResponse.next()
  res.headers.set('Cache-Control', 'private, no-store')
  res.headers.set('X-Robots-Tag', 'noindex')
  return res
}

export const config = {
  matcher: ['/tools', '/tools/:path*', '/licences'],
}
