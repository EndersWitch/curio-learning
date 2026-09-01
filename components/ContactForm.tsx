'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'ok' | 'err'

export default function ContactForm() {
  const [status, setStatus] = useState<Status>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const form = e.currentTarget
    const payload = {
      name: (form.elements.namedItem('name') as HTMLInputElement).value,
      email: (form.elements.namedItem('email') as HTMLInputElement).value,
      phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
      message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
    }
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || '')
      setStatus('ok')
      form.reset()
    } catch (err) {
      setErrMsg(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong sending your message. Please email hello@curiolearning.co.za directly."
      )
      setStatus('err')
    }
  }

  return (
    <div className="contact-form-wrap">
      <div className="contact-form-title">Send us a message</div>

      {status === 'ok' ? (
        <div className="alert ok show">
          Thanks &mdash; your message is on its way. We&apos;ll get back to you within 1&ndash;2 business days.
        </div>
      ) : (
        <form className="contact-form" onSubmit={handleSubmit}>
          {status === 'err' && <div className="alert err show">{errMsg}</div>}

          <div className="field">
            <label className="field-label" htmlFor="cf-name">Name</label>
            <input className="field-input" id="cf-name" name="name" type="text" required />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cf-email">Email</label>
            <input className="field-input" id="cf-email" name="email" type="email" required />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cf-phone">Phone (optional)</label>
            <input className="field-input" id="cf-phone" name="phone" type="tel" />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="cf-message">Message</label>
            <textarea className="field-input" id="cf-message" name="message" rows={5} required />
          </div>

          <button className="btn-submit" type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </form>
      )}
    </div>
  )
}
