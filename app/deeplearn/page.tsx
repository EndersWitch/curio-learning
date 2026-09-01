import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import Bloom from '@/components/Bloom'

export const metadata: Metadata = {
  title: 'Deep Learn',
  description: "Curio's AI tutor breaks down concepts from first principles, in plain language, with real examples, until it actually clicks.",
}

export default function DeepLearnPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <RevealObserver />

      <section className="spread hero compact">
        <div className="spread-deco o2" style={{ top: '-60px', right: '-40px' }}>
          <Bloom size={300} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '-10%', left: '-50px' }}>
          <Bloom size={220} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>
          <div className="cs-badge">Coming soon</div>
          <p className="spread-tagline">Not just right or wrong.</p>

          <div className="dl-hero-grid">
            <div>
              <h1 className="spread-h">
                <span className="ln">actually</span>
                <span className="ln ac">explained.</span>
              </h1>

              <p className="spread-lede rv">
                Deep Learn is Curio&apos;s AI tutor. Ask it anything. It breaks down concepts{' '}
                <strong>from first principles</strong>, in plain language, with real examples, until it actually clicks.
              </p>

              <div className="dl-hero-actions rv rv-d1">
                <a href="/subscription" className="cs-cta">Get early access &rarr;</a>
                <a href="/" className="cs-soft">&larr; Back home</a>
              </div>
            </div>

            <div className="chat-preview rv rv-d1">
              <div className="dl-chat-msg user">
                <div className="chat-sender">You</div>
                <div className="dl-chat-bubble">Why does photosynthesis matter? I keep forgetting.</div>
              </div>
              <div className="dl-chat-msg ai chat-blur">
                <div className="chat-sender">curio</div>
                <div className="dl-chat-bubble">
                  Let&apos;s build it up from scratch.<br /><br />
                  <strong>Plants are the only living things that make their own food,</strong> using sunlight, water, and CO₂ from the air.<br /><br />
                  The oxygen they release is every breath you&apos;ve ever taken.<br /><br />
                  So when your exam asks &quot;why is it important?&quot; <strong>It&apos;s the foundation of all life on Earth.</strong>
                </div>
              </div>
              <div className="dl-chat-msg user chat-blur">
                <div className="dl-chat-bubble">Oh. That actually makes sense now.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
