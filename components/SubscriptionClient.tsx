'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Check, FileText, PenLine, Brain } from '@/components/icons'
import Bloom from '@/components/Bloom'

const PAYSTACK_KEY = 'pk_live_6540061572fe506bdb52063847dedb801c38765b'
const PLAN_CODE = 'PLN_rgv78ij4cj0ky3d'

declare global {
  interface Window {
    PaystackPop?: { setup: (config: Record<string, unknown>) => { openIframe: () => void } }
  }
}

const PLAN_ROWS = [
  { label: 'Full past paper library', free: true, pro: true },
  { label: 'Download papers as PDF', free: true, pro: true },
  { label: 'Full marking memos', free: true, pro: true },
  { label: 'All grades & subjects', free: true, pro: true },
  { label: 'AI-powered quiz mode', free: false, pro: true },
  { label: 'Deep Learn explanations', free: false, pro: true },
  { label: 'Custom test generator', free: false, pro: true },
  { label: 'Progress tracking & streaks', free: false, pro: true },
  { label: 'Topic-sorted question sets', free: false, pro: true },
  { label: 'No ads', free: false, pro: true },
]

export default function SubscriptionClient() {
  const { user, loading, refreshUser } = useAuth()
  const [ready, setReady] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [slotsLeft, setSlotsLeft] = useState<number | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeLabel, setSubscribeLabel] = useState('Subscribe →')
  const [subscribeDone, setSubscribeDone] = useState(false)
  const [toast, setToastMsg] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loading) return
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id])

  async function load() {
    if (user) {
      const { data } = await sb.from('profiles').select('subscription_started_at').eq('id', user.id).single()
      setStartedAt(data?.subscription_started_at ?? null)
    }

    if (!user?.isPremium) {
      const { data: slots } = await sb.from('founder_slots').select('total, claimed').eq('id', 1).single()
      if (slots) {
        const remaining = slots.total - slots.claimed
        if (remaining > 0) setSlotsLeft(remaining)
      }
    }

    setReady(true)
  }

  function showToast(msg: string, dur = 3500) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), dur)
  }

  function startUpgrade() {
    if (!user || !window.PaystackPop) return
    setSubscribing(true)
    setSubscribeLabel('Opening checkout…')

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: user.email,
      plan: PLAN_CODE,
      currency: 'ZAR',
      ref: 'curio_' + Date.now(),
      metadata: { user_id: user.id, custom_fields: [{ display_name: 'User ID', variable_name: 'user_id', value: user.id }] },
      callback: () => {
        setSubscribeLabel('Payment confirmed. Activating…')
        setSubscribeDone(true)
        let tries = 0
        pollRef.current = setInterval(async () => {
          tries++
          const { data } = await sb.from('profiles').select('is_premium').eq('id', user.id).single()
          if (data?.is_premium) {
            if (pollRef.current) clearInterval(pollRef.current)
            await refreshUser()
            window.location.reload()
            return
          }
          if (tries > 12) {
            if (pollRef.current) clearInterval(pollRef.current)
            setSubscribing(false)
            setSubscribeDone(false)
            setSubscribeLabel('Subscribe →')
          }
        }, 5000)
      },
      onClose: () => {
        setSubscribing(false)
        setSubscribeDone(false)
        setSubscribeLabel('Subscribe →')
      },
    })
    handler.openIframe()
  }

  function cancelSub() {
    if (!user) return
    if (!confirm('Cancel your Premium subscription?\n\nYou keep Premium access until the end of your current billing period.')) return
    const subject = encodeURIComponent('Cancel subscription')
    const body = encodeURIComponent(`Please cancel my Curio Premium subscription.\nAccount email: ${user.email}`)
    window.location.href = `mailto:hello@curiolearning.co.za?subject=${subject}&body=${body}`
    showToast('Email opened. We will cancel within 24 hours.')
  }

  const firstName = (user?.fullName || '').split(' ')[0] || 'there'

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <div className={`sub-loading-screen${ready ? ' gone' : ''}`} aria-hidden={ready}>
        <svg className="sub-loading-bloom" width="44" height="44" viewBox="0 0 64 64" fill="none">
          <g fill="none" stroke="var(--rust)" strokeWidth="2" strokeLinejoin="round">
            <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(0 32 32)" />
            <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(72 32 32)" />
            <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(144 32 32)" />
            <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(216 32 32)" />
            <path d="M32,32 C20,30 20,12 32,4 C44,12 44,30 32,32 Z" transform="rotate(288 32 32)" />
          </g>
          <circle cx="32" cy="32" r="4.5" fill="var(--ochre)" />
        </svg>
      </div>

      {ready && (
        <div style={{ paddingTop: '60px' }}>
          {!(user && user.isPremium) ? (
            <div>
              <section className="hero-free">
                <div className="spread-deco o1" style={{ top: '-40px', right: '4%' }}>
                  <Bloom size={220} />
                </div>
                <div className="spread-deco o1" style={{ bottom: '-30px', left: '4%' }}>
                  <Bloom size={160} />
                </div>
                <div className="sub-eyebrow">curio premium</div>
                <h1 className="sub-hero-title">Papers get you started.<br /><span className="cy">This gets you through it.</span></h1>
                <p className="sub-hero-sub">
                  Papers are always free. Premium gives you the AI tools that actually make a difference: <strong>quizzes, deep explanations and personalised feedback.</strong>
                </p>

                {slotsLeft !== null && (
                  <div className="founder-badge">
                    <span className="fb-text">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2c1 3-2 4.5-2 7.5a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5a6 6 0 1 1-12 0c0-4 3-5.5 3-9 0-1.2.5-2.2 1-3z" />
                      </svg>
                      Founder pricing, only <span className="fb-count">{slotsLeft}</span> spots left
                    </span>
                  </div>
                )}
              </section>

              <div className="sub-ledger-wrap">
                <div className="report-card">
                  <div className="report-head">
                    <span className="report-head-label">What you get</span>
                    <span className="report-head-cell">Free</span>
                    <span className="report-head-cell premium">
                      Premium
                      <span className="report-mark">our pick</span>
                    </span>
                  </div>
                  {PLAN_ROWS.map((row) => (
                    <div className="report-row" key={row.label}>
                      <span className="report-row-label">{row.label}</span>
                      <span className={`report-row-cell${row.free ? ' on' : ''}`}>{row.free ? <Check size={14} /> : '—'}</span>
                      <span className={`report-row-cell premium${row.pro ? ' on' : ''}`}>{row.pro ? <Check size={14} /> : '—'}</span>
                    </div>
                  ))}
                  <div className="report-foot">
                    <span className="report-foot-label" />
                    <div className="report-foot-cell">
                      <div className="report-price"><sup>R</sup>0</div>
                      <div className="report-price-sub">forever</div>
                      {!user && <a href="/login?tab=signup" className="report-cta report-cta-free">Get started free</a>}
                    </div>
                    <div className="report-foot-cell">
                      <div className="report-price"><sup>R</sup>49<small>/mo</small></div>
                      <div className="report-price-sub">founder pricing</div>
                      {user ? (
                        <button
                          className="report-cta report-cta-pro"
                          disabled={subscribing}
                          onClick={startUpgrade}
                          style={subscribeDone ? { background: 'var(--rust10)', color: 'var(--rust)' } : undefined}
                        >
                          {subscribeLabel}
                        </button>
                      ) : (
                        <a href="/login?tab=signup" className="report-cta report-cta-pro">Subscribe →</a>
                      )}
                    </div>
                  </div>
                </div>
                <p className="sub-footnote">
                  Cancel anytime · No hidden fees · ZAR incl. VAT
                  {user && (
                    <>
                      <br />
                      Already subscribed? <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload() }}>Refresh page</a>
                    </>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <section className="premium-hero">
                <div className="spread-deco o1" style={{ top: '-30px', right: '6%' }}>
                  <Bloom size={180} />
                </div>
                <div className="prem-badge"><div className="prem-badge-dot" /><span className="prem-badge-text">Premium · Active</span></div>
                <h1 className="prem-title">You&apos;re in, {firstName}.</h1>
                <p className="prem-sub">Full access to everything curio has to offer. Let&apos;s get to work.</p>
                <div className="quick-grid">
                  <a href="/papers" className="premqa"><span className="premqa-icon"><FileText size={22} /></span><span className="premqa-lbl">Papers</span></a>
                  <a href="/quiz" className="premqa"><span className="premqa-icon"><PenLine size={22} /></span><span className="premqa-lbl">Quiz</span></a>
                  <a href="/deeplearn" className="premqa"><span className="premqa-icon"><Brain size={22} /></span><span className="premqa-lbl">Deep Learn</span></a>
                </div>
              </section>

              <div className="mem-section">
                <div className="mem-card">
                  <div className="mem-card-head">
                    <div>
                      <div className="mem-plan-label">Your plan</div>
                      <div className="mem-plan-name">
                        Curio Premium
                        {user.isFounder && (
                          <span className="founder-pill">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
                              <path d="M12 2c1 3-2 4.5-2 7.5a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5a6 6 0 1 1-12 0c0-4 3-5.5 3-9 0-1.2.5-2.2 1-3z" />
                            </svg>
                            Founder
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mem-status"><div className="mem-status-dot" />Active</div>
                  </div>
                  <div className="mem-body">
                    <div className="mem-row"><span className="mem-row-k">Amount</span><span className="mem-row-v good">R49 / month</span></div>
                    <div className="mem-row"><span className="mem-row-k">Billing</span><span className="mem-row-v">Monthly · auto-renews</span></div>
                    <div className="mem-row">
                      <span className="mem-row-k">Member since</span>
                      <span className="mem-row-v">
                        {startedAt ? new Date(startedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </span>
                    </div>
                    <div className="mem-row"><span className="mem-row-k">AI Quizzes</span><span className="mem-row-v good">Active</span></div>
                    <div className="mem-row"><span className="mem-row-k">Deep Learn</span><span className="mem-row-v good">Active</span></div>
                    <div className="mem-row"><span className="mem-row-k">Custom tests</span><span className="mem-row-v good">Active</span></div>
                  </div>
                  <div className="mem-foot">
                    <button className="btn-cancel" onClick={cancelSub}>Cancel subscription</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className={`sub-toast${toast ? ' show' : ''}`}>{toast}</div>
    </>
  )
}
