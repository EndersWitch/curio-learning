'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { sb } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Check, FileText, PenLine, Brain } from '@/components/icons'

const PAYSTACK_KEY = 'pk_live_6540061572fe506bdb52063847dedb801c38765b'
const PLAN_CODE = 'PLN_rgv78ij4cj0ky3d'

declare global {
  interface Window {
    PaystackPop?: { setup: (config: Record<string, unknown>) => { openIframe: () => void } }
  }
}

const FEATURES = [
  'Everything free: all papers + memos',
  'AI-powered quiz mode',
  'Deep Learn explanations',
  'Custom test generator',
  'Progress tracking & streaks',
  'Topic-sorted question sets',
  'No ads',
]

function CheckIcon() {
  return <span className="feat-chk"><Check size={11} /></span>
}

export default function SubscriptionClient() {
  const { user, loading, refreshUser } = useAuth()
  const [ready, setReady] = useState(false)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [slotsLeft, setSlotsLeft] = useState<number | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeLabel, setSubscribeLabel] = useState('Subscribe for R49/month →')
  const [subscribeDone, setSubscribeDone] = useState(false)
  const [toast, setToastMsg] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) { window.location.href = '/login'; return }
    load()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id])

  async function load() {
    if (!user) return

    const { data } = await sb.from('profiles').select('subscription_started_at').eq('id', user.id).single()
    setStartedAt(data?.subscription_started_at ?? null)

    if (!user.isPremium) {
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
            setSubscribeLabel('Subscribe for R49/month →')
          }
        }, 5000)
      },
      onClose: () => {
        setSubscribing(false)
        setSubscribeDone(false)
        setSubscribeLabel('Subscribe for R49/month →')
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

      {ready && user && (
        <div style={{ paddingTop: '60px' }}>
          {!user.isPremium ? (
            <div>
              <section className="hero-free">
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

                <div className="subpc-card">
                  <div className="subpc-top">
                    <div className="subpc-tier">Premium</div>
                    <div className="subpc-trial-tag">Cancel anytime</div>
                  </div>
                  <div className="price-display">
                    <div className="price-big"><sup>R</sup>49<sub>/mo</sub></div>
                    <div className="price-note">Lock in <strong>founder pricing</strong> before it rises to R99.</div>
                  </div>
                  <ul className="feat-list">
                    {FEATURES.map((f) => (
                      <li className="feat-item" key={f}><CheckIcon />{f}</li>
                    ))}
                  </ul>
                  <button
                    className="btn-sub"
                    disabled={subscribing}
                    onClick={startUpgrade}
                    style={subscribeDone ? { background: 'var(--rust10)', color: 'var(--rust)' } : undefined}
                  >
                    {subscribeLabel}
                  </button>
                  <p className="sub-footnote">
                    Cancel anytime · No hidden fees · ZAR incl. VAT<br />
                    Already subscribed? <a href="#" onClick={(e) => { e.preventDefault(); window.location.reload() }}>Refresh page</a>
                  </p>
                </div>
              </section>

              <div className="compare-wrap">
                <div className="compare-label">Free vs Premium</div>
                <div className="compare-grid">
                  <div className="cg-col">
                    <div className="cg-tier">Free · Forever</div>
                    <div className="cg-price">R0</div>
                    <div className="ci"><div className="ci-dot" />Full paper library</div>
                    <div className="ci"><div className="ci-dot" />PDF downloads</div>
                    <div className="ci"><div className="ci-dot" />Full memos</div>
                    <div className="ci"><div className="ci-dot" />All grades &amp; subjects</div>
                    <div className="ci dim"><div className="ci-dot g" />AI Quiz mode</div>
                    <div className="ci dim"><div className="ci-dot g" />Deep Learn</div>
                    <div className="ci dim"><div className="ci-dot g" />Custom tests</div>
                  </div>
                  <div className="cg-col hot">
                    <div className="cg-tier">Premium</div>
                    <div className="cg-price">R49 <span>/month</span></div>
                    <div className="ci"><div className="ci-dot" />Everything in Free</div>
                    <div className="ci"><div className="ci-dot" />AI Quiz mode</div>
                    <div className="ci"><div className="ci-dot" />Deep Learn</div>
                    <div className="ci"><div className="ci-dot" />Custom test generator</div>
                    <div className="ci"><div className="ci-dot" />Progress &amp; streaks</div>
                    <div className="ci"><div className="ci-dot" />Topic question sets</div>
                    <div className="ci"><div className="ci-dot" />No ads</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <section className="premium-hero">
                <div className="prem-badge"><div className="prem-badge-dot" /><span className="prem-badge-text">Premium · Active</span></div>
                <h1 className="prem-title">You&apos;re in, {firstName}.</h1>
                <p className="prem-sub">Full access to everything curio has to offer. Let&apos;s get to work.</p>
                <div className="quick-grid">
                  <a href="/papers" className="qa"><span className="qa-icon"><FileText size={22} /></span><span className="qa-lbl">Papers</span></a>
                  <a href="/quiz" className="qa"><span className="qa-icon"><PenLine size={22} /></span><span className="qa-lbl">Quiz</span></a>
                  <a href="/deeplearn" className="qa"><span className="qa-icon"><Brain size={22} /></span><span className="qa-lbl">Deep Learn</span></a>
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
