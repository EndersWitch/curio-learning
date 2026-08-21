'use client'

import { useState } from 'react'

interface FaqEntry {
  q: string
  a: string
}

export default function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="faq-section">
      <div className="faq-title">Frequently asked questions</div>
      {items.map((item, i) => (
        <div className={`faq-item${openIndex === i ? ' open' : ''}`} key={i}>
          <div className="faq-q" onClick={() => setOpenIndex(openIndex === i ? null : i)}>
            {item.q}
            <span className="faq-q-arrow">↓</span>
          </div>
          <div className="faq-a">{item.a}</div>
        </div>
      ))}
    </div>
  )
}
