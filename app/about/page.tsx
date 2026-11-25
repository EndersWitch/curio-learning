import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import Bloom from '@/components/Bloom'
import { ArrowRight } from '@/components/icons'

export const metadata: Metadata = {
  title: 'About Me',
  description: 'Hi, I’m Josh. I’m a tutor, and I built curio learning because I kept running out of good, complete study material to teach from. Test papers and memos are free, always.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="poster-page">
      <SimpleNav />
      <RevealObserver />

      {/* ── HERO: who I am ── */}
      <section className="spread hero">
        <div className="spread-deco o2" style={{ top: '-70px', right: '-40px' }}>
          <Bloom size={340} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '4%', left: '-60px' }}>
          <Bloom size={260} />
        </div>
        <div className="spread-deco o3" style={{ top: '38%', right: '18%' }}>
          <Bloom size={54} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            curio learning
          </div>
          <p className="spread-tagline">A tutor&apos;s project, built in South Africa for South African learners.</p>

          <h1 className="spread-h">
            <span className="ln">hi, i&apos;m</span>
            <span className="ln ac">josh</span>
          </h1>

          <p className="spread-lede rv">
            I&apos;m a tutor. I built curio learning because I kept <strong>running out of good things to teach from</strong>,
            and I figured other parents, tutors and learners were running out too.
          </p>

          <a href="/subjects" className="spread-cta-corner">
            Start free
            <ArrowRight size={18} style={{ transform: 'rotate(-45deg)' }} />
          </a>
        </div>
      </section>

      {/* ── WHERE IT STARTED ── */}
      <section className="spread">
        <div className="spread-deco o2" style={{ bottom: '-60px', right: '-30px' }}>
          <Bloom size={220} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            curio learning
          </div>

          <p className="spread-blurb-head rv">
            I tutored a lot of kids, and I kept hitting the same two walls.
          </p>
          <div className="spread-blurb-cols rv rv-d1">
            <p>There weren&apos;t many exam papers online. Not nearly enough for a kid to practise properly.</p>
            <p>The ones I did find never covered everything my students needed. So I&apos;d patch the gaps myself, again and again.</p>
          </div>

          <h2 className="spread-h rv rv-d2">
            <span className="ln">where</span>
            <span className="ln ac">it</span>
            <span className="ln">started</span>
          </h2>
        </div>
      </section>

      {/* ── WHAT A KID NEEDS ── */}
      <section className="spread">
        <div className="spread-deco o2" style={{ top: '-40px', right: '6%' }}>
          <Bloom size={70} />
        </div>
        <div className="spread-deco o1" style={{ top: '20px', right: '2%' }}>
          <Bloom size={130} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">what</span>
            <span className="ln ac">a kid</span>
            <span className="ln">needs</span>
          </h2>

          <p className="spread-lede rv">
            Three things, in this order. Skip any one of them and the exam turns into a guessing game.
          </p>

          <div className="spread-pairs rv rv-d1">
            <div className="spread-pair">
              <span className="spread-pair-k">Learn it</span>
              <span className="spread-pair-v">Study the work as well as you can, with the rules and topics taught properly.</span>
            </div>
            <div className="spread-pair">
              <span className="spread-pair-k">Test it</span>
              <span className="spread-pair-v">Find out what actually stuck by putting yourself under test conditions.</span>
            </div>
            <div className="spread-pair">
              <span className="spread-pair-k">See the marking</span>
              <span className="spread-pair-v">Understand how each question would have been marked, and where the marks went.</span>
            </div>
          </div>

          <div className="spread-punch rv rv-d2">
            <span className="ac">practice</span>&nbsp;over guesswork.
            <ArrowRight size={30} />
          </div>
        </div>
      </section>

      {/* ── NOT ANOTHER BORING TEST ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ top: '10%', left: '2%' }}>
          <Bloom size={180} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            curio learning
          </div>

          <h2 className="spread-h rv">
            <span className="ln">not</span>
            <span className="ln ac">another</span>
            <span className="ln">boring test</span>
          </h2>

          <div className="spread-blurb-cols rv rv-d1">
            <p>
              I watched plenty of kids get bored of hour-long, pen-and-paper tests that all feel the same.
              Some will do almost anything to avoid something that feels boring.
            </p>
            <p>
              So I&apos;m making curio learning as interactive and approachable as I can, with something for every
              kind of learner. Not just the ones who already love sitting down with a paper.
            </p>
          </div>
        </div>
      </section>

      {/* ── BUILT BY ONE PERSON ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ bottom: '-50px', left: '-40px' }}>
          <Bloom size={240} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">built</span>
            <span className="ln ac">by one</span>
            <span className="ln">person</span>
          </h2>

          <div className="spread-blurb-cols rv rv-d1">
            <p>
              I&apos;m not a developer. I&apos;m learning how to build this as I go, and it has been a headache and a joy
              in about equal measure.
            </p>
            <p>
              I&apos;ve learnt to work in small pieces instead of trying to fit a whole app into one week. I&apos;ve learnt
              what people want, what they don&apos;t, and what makes them come back. Every day I learn something new,
              and I&apos;m grateful for that.
            </p>
          </div>
        </div>
      </section>

      {/* ── WHAT I BELIEVE ── */}
      <section className="spread">
        <div className="spread-deco o2" style={{ top: '-40px', right: '-20px' }}>
          <Bloom size={200} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">what</span>
            <span className="ln ac">i</span>
            <span className="ln">believe</span>
          </h2>

          <div className="spread-values">
            <div className="spread-value rv rv-d1">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Access</div>
              <div className="spread-value-desc">Not everyone can reach the top 1% of education. Those learners deserve the best I can give them, so test papers and memos are free, and always will be.</div>
            </div>
            <div className="spread-value rv rv-d2">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Curiosity</div>
              <div className="spread-value-desc">Learning sticks when it feels like discovery, not another chore before bed.</div>
            </div>
            <div className="spread-value rv rv-d3">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Getting it right</div>
              <div className="spread-value-desc">Everything here follows CAPS, and I&apos;d like to work towards IEB one day. Kids should learn the rules once, correctly, instead of piecing them together from sources that disagree.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE FAMILY ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ bottom: '-40px', right: '4%' }}>
          <Bloom size={150} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">more from</span>
            <span className="ln ac">curio</span>
          </h2>

          <div className="spread-pairs rv rv-d1">
            <div className="spread-pair">
              <span className="spread-pair-k">Bloom</span>
              <span className="spread-pair-v">An AI tutor that explains the work properly, step by step.</span>
            </div>
            <div className="spread-pair">
              <span className="spread-pair-k">Whizz</span>
              <span className="spread-pair-v">Build your own test from whatever you&apos;re being tested on, then see how it would be marked.</span>
            </div>
            <div className="spread-pair">
              <span className="spread-pair-k">Millie</span>
              <span className="spread-pair-v">A parent organiser for school messages, on its way.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="spread dark">
        <div className="spread-deco o2" style={{ top: '-60px', right: '-40px' }}>
          <Bloom size={280} />
        </div>
        <div className="spread-deco o1" style={{ bottom: '-10%', left: '4%' }}>
          <Bloom size={160} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            curio learning
          </div>

          <h2 className="spread-h">
            <span className="ln">let&apos;s</span>
            <span className="ln">start</span>
            <span className="ln ac">learning</span>
          </h2>

          <div className="spread-closing-row">
            <p className="spread-closing-sub">
              Test papers and memos are free, and they always will be. Premium is there if you want every quiz level
              and no ads, and it helps me keep building.
            </p>
            <div className="spread-closing-actions">
              <a href="/papers" className="spread-closing-cta">
                Explore free papers
                <ArrowRight size={18} />
              </a>
              <a href="/login" className="spread-closing-ghost">or sign up free &rarr;</a>
            </div>
          </div>

          <div className="spread-closing-url">curiolearning.co.za</div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
