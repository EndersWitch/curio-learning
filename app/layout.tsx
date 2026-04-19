import type { Metadata } from 'next'
import { Poppins, DM_Sans } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'curio learning',
  description: 'CAPS-aligned exam prep for Grades 4–12',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${dmSans.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
