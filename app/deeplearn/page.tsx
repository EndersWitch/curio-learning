import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import Bloom from '@/components/Bloom'

export const metadata: Metadata = {
  title: 'Deep Learn',
  description: "Curio's AI tutor breaks down concepts from first principles, in plain language, with real examples, until it actually clicks.",
}

export default function DeepLearnPage() {
  return (
    <div style={{ background: 'var(--paper)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SimpleNav />
      <div className="coming-soon" style={{ flex: 1 }}>
        <div className="cs-bloom"><Bloom size={72} /></div>
        <div className="cs-badge">Coming soon</div>
        <h1 className="cs-title">
          Not just right<br />or wrong.<br /><span className="co">Actually</span> <span className="cy">explained.</span>
        </h1>
        <p className="cs-sub">
          Deep Learn is Curio&apos;s AI tutor. Ask it anything. It breaks down concepts <strong>from first principles</strong>, in
          plain language, with real examples, until it actually clicks.
        </p>
        <div className="chat-preview">
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
        <div className="coming-soon-actions">
          <a href="/subscription" className="cs-cta">Get early access →</a>
          <a href="/" className="cs-soft">← Back home</a>
        </div>
      </div>
      <Footer />
    </div>
  )
}
