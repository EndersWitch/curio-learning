'use client'

import { useEffect } from 'react'

// Fades in any .rv element as it scrolls into view; elements already in the
// viewport on mount reveal immediately. Mount once per page.
export default function RevealObserver() {
  useEffect(() => {
    const ro = new IntersectionObserver(
      (entries) => entries.forEach((x) => { if (x.isIntersecting) x.target.classList.add('in') }),
      { threshold: 0.07, rootMargin: '0px 0px -50px 0px' }
    )
    document.querySelectorAll('.rv').forEach((el) => {
      ro.observe(el)
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight) (el as HTMLElement).classList.add('in')
    })
    return () => ro.disconnect()
  }, [])

  return null
}
