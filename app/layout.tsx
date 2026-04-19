import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Curio — Your study friend.',
  description: 'Exam papers, AI-powered quizzes and deep explanations — built for South African students. Free to start. Always in your corner.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Caveat:wght@600;700&display=swap"
          rel="stylesheet"
        />
        {/* AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2405111123009991"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
