import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import FaqAccordion from '@/components/FaqAccordion'
import RevealObserver from '@/components/RevealObserver'
import Bloom from '@/components/Bloom'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Curio Learning team — general enquiries, technical support, billing and privacy requests.',
}

const CARDS = [
  {
    featured: true,
    title: 'General enquiries',
    desc: "Questions about Curio, how it works, content, or anything else? Drop us an email and we'll respond within 1–2 business days.",
    email: 'hello@curiolearning.co.za',
    icon: <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    icon2: <path d="m3 7 9 6 9-6" />,
  },
  {
    title: 'Technical support',
    desc: "Something not working? A bug, a broken page, or a login issue? Let us know and we'll fix it as quickly as possible.",
    email: 'support@curiolearning.co.za',
    icon: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.8 2.8-2-2z" />,
  },
  {
    title: 'Billing & subscriptions',
    desc: "Questions about your Premium subscription, payment issues, or refund requests. We're here to help.",
    email: 'hello@curiolearning.co.za',
    icon: <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>,
  },
  {
    title: 'Schools & educators',
    desc: "Interested in Curio for your school or classroom? We'd love to chat about how we can support your learners.",
    email: 'hello@curiolearning.co.za',
    icon: <>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" />
    </>,
  },
  {
    title: 'Privacy & data requests',
    desc: 'To exercise your rights under POPIA, including access, correction, or deletion of your personal data, contact us directly.',
    email: 'hello@curiolearning.co.za',
    icon: <>
      <rect x="4.5" y="11" width="15" height="10" rx="2" />
      <path d="M7.5 11V7.5a4.5 4.5 0 0 1 9 0V11" />
    </>,
  },
  {
    title: 'Content & corrections',
    desc: 'Spotted an error in a paper, question, or memo? We take accuracy seriously. Please let us know.',
    email: 'hello@curiolearning.co.za',
    icon: <>
      <path d="M13 4 20 11 9 22H2v-7z" />
      <path d="M11.5 5.5 18.5 12.5" />
    </>,
  },
]

const FAQ = [
  { q: 'Are exam papers really free?', a: "Yes, always. Exam papers and memos on Curio are free for every student, no account required, no strings attached. We believe access to good study material shouldn't depend on who you are or where you come from." },
  { q: 'How do I cancel my Premium subscription?', a: "You can cancel anytime from your account settings. Your Premium access continues until the end of your current billing period. We don't do any lock-in. If you cancel, you cancel." },
  { q: 'Can I get a refund?', a: "Refunds are considered on a case-by-case basis. If you've had a billing issue or weren't able to access the features you paid for, email us at hello@curiolearning.co.za and we'll make it right." },
  { q: 'What data do you collect about my child?', a: 'We collect only what’s necessary: name, email address, and grade. We never sell data, we never share it with advertisers, and we comply with POPIA. See our Privacy Policy for full details.' },
  { q: 'Which grades and subjects does Curio cover?', a: "We're building toward full coverage of Grade 4 to Grade 12, all CAPS subjects. We're adding content continuously. If you'd like a specific subject or grade prioritised, let us know at hello@curiolearning.co.za." },
  { q: 'How do I report a mistake in a paper or answer?', a: 'Email us at hello@curiolearning.co.za with the paper name, question number, and what you believe is incorrect. We review every report and update the content if needed.' },
]

export default function ContactPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <RevealObserver />

      {/* ── HERO — let's talk ── */}
      <section className="spread hero compact">
        <div className="spread-deco o2" style={{ top: '-60px', right: '-30px' }}>
          <Bloom size={280} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '-40px', left: '-50px' }}>
          <Bloom size={220} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>
          <p className="spread-tagline">We&apos;re a small team, but we care about every message that lands in this inbox.</p>

          <h1 className="spread-h">
            <span className="ln">let&apos;s</span>
            <span className="ln ac">talk</span>
          </h1>

          <p className="spread-lede rv">
            Questions about Curio, a bug you spotted, or a subscription issue &mdash; pick a category below
            and drop us a line. We usually reply within <strong>1&ndash;2 business days</strong>.
          </p>
        </div>
      </section>

      {/* ── CARDS ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ top: '4%', right: '3%' }}>
          <Bloom size={160} />
        </div>

        <div className="spread-inner">
          <p className="spread-blurb-head rv">
            Pick the inbox that fits, and we&apos;ll take it from there:
          </p>

          <div className="contact-grid rv rv-d1">
            {CARDS.map((card) => (
              <div className={`contact-card${card.featured ? ' featured' : ''}`} key={card.title}>
                <div className="contact-card-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    {card.icon}
                  </svg>
                </div>
                <div className="contact-card-title">{card.title}</div>
                <div className="contact-card-desc">{card.desc}</div>
                <a href={`mailto:${card.email}`} className="contact-card-link">{card.email} &rarr;</a>
              </div>
            ))}
          </div>

          <div className="response-note rv rv-d2">
            <strong>Based in South Africa.</strong> We typically respond within 1&ndash;2 business days (Monday to Friday, 08:00&ndash;17:00 SAST). For urgent issues, include &quot;URGENT&quot; in your subject line.
          </div>

          <h2 className="spread-h rv rv-d2" style={{ marginTop: '4rem' }}>
            <span className="ln">get</span>
            <span className="ln ac">help</span>
          </h2>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ bottom: '-30px', left: '2%' }}>
          <Bloom size={190} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>
          <h2 className="spread-h rv">
            <span className="ln">still</span>
            <span className="ln ac">curious?</span>
          </h2>

          <div className="rv rv-d1" style={{ marginTop: '3rem', maxWidth: 700 }}>
            <FaqAccordion items={FAQ} />
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="spread dark">
        <div className="spread-deco o2" style={{ top: '-50px', right: '-30px' }}>
          <Bloom size={240} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '-10%', left: '4%' }}>
          <Bloom size={150} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>

          <h2 className="spread-h">
            <span className="ln">reach</span>
            <span className="ln ac">out</span>
          </h2>

          <div className="spread-closing-row">
            <p className="spread-closing-sub">
              Every message reaches a real person on the Curio team &mdash; usually within 1&ndash;2 business days.
            </p>
            <div className="spread-closing-actions">
              <a href="mailto:hello@curiolearning.co.za" className="spread-closing-cta">
                Email us
              </a>
            </div>
          </div>

          <div className="spread-closing-url">curiolearning.co.za</div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
