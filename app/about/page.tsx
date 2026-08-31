import type { Metadata } from 'next'
import SimpleNav from '@/components/SimpleNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import Bloom from '@/components/Bloom'
import { ArrowRight } from '@/components/icons'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Curio Learning is a free, CAPS-aligned exam prep platform for Grade 4–12 students in South Africa. Here’s who we are and why we built it.',
}

export default function AboutPage() {
  return (
    <div className="about-page">
      <SimpleNav />
      <RevealObserver />

      {/* ── HERO — who we are ── */}
      <section className="about-spread hero">
        <div className="about-deco o2" style={{ top: '-70px', right: '-40px' }}>
          <Bloom size={340} />
        </div>
        <div className="about-deco o1" style={{ bottom: '4%', left: '-60px' }}>
          <Bloom size={260} />
        </div>
        <div className="about-deco o3" style={{ top: '38%', right: '18%' }}>
          <Bloom size={54} />
        </div>

        <div className="about-inner">
          <div className="about-kicker">
            <span className="about-kicker-line" />
            Curio Learning
          </div>
          <p className="about-tagline">Free, CAPS-aligned exam prep for Grade 4–12 &mdash; built in South Africa, for South African students.</p>

          <h1 className="about-h">
            <span className="ln">who</span>
            <span className="ln ac">we</span>
            <span className="ln">are</span>
          </h1>

          <p className="about-lede rv">
            Curio turns real past papers into <strong>quizzes that mark themselves</strong>, so studying
            feels less like a chore and more like a game you&apos;re actually winning.
          </p>

          <a href="/subjects" className="about-cta-corner">
            Start free
            <ArrowRight size={18} style={{ transform: 'rotate(-45deg)' }} />
          </a>
        </div>
      </section>

      {/* ── NUMBERS — just the facts ── */}
      <section className="about-spread">
        <div className="about-deco o2" style={{ bottom: '-60px', right: '-30px' }}>
          <Bloom size={220} />
        </div>

        <div className="about-inner">
          <div className="about-kicker">
            <span className="about-kicker-line" />
            Curio Learning
          </div>
          <h2 className="about-h rv">
            <span className="ln">just</span>
            <span className="ln">the</span>
            <span className="ln ac">facts</span>
          </h2>

          <div className="about-stats">
            <div className="about-stat c1 rv rv-d1">
              <div className="about-stat-val">R0</div>
              <div className="about-stat-label">to start. Every past paper and memo is free &mdash; no account required, no strings attached.</div>
            </div>
            <div className="about-stat c2 rv rv-d2">
              <div className="about-stat-val">Gr 4&ndash;12</div>
              <div className="about-stat-label">Every core CAPS subject, mapped grade by grade.</div>
            </div>
            <div className="about-stat c3 rv rv-d3">
              <div className="about-stat-val">24/7</div>
              <div className="about-stat-label">Practice on your own schedule &mdash; no timetable, no waiting on marking.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="about-spread">
        <div className="about-deco o1" style={{ top: '10%', left: '2%' }}>
          <Bloom size={180} />
        </div>

        <div className="about-inner">
          <div className="about-kicker">
            <span className="about-kicker-line" />
            Curio Learning
          </div>

          <p className="about-blurb-head rv">
            Real past papers turned into practice that actually sticks:
          </p>
          <div className="about-blurb-cols rv rv-d1">
            <p>Past papers &amp; memos, topic-by-topic quizzes, subject guides mapped to the curriculum.</p>
            <p>Instant marking, streaks that build the habit, progress you can actually see.</p>
          </div>

          <h2 className="about-h rv rv-d2">
            <span className="ln">what</span>
            <span className="ln ac">we</span>
            <span className="ln">do</span>
          </h2>
        </div>
      </section>

      {/* ── WHY IT WORKS ── */}
      <section className="about-spread">
        <div className="about-deco o2" style={{ top: '-40px', right: '6%' }}>
          <Bloom size={70} />
        </div>
        <div className="about-deco o1" style={{ top: '20px', right: '2%' }}>
          <Bloom size={130} />
        </div>

        <div className="about-inner">
          <h2 className="about-h rv">
            <span className="ln">why</span>
            <span className="ln ac">it</span>
            <span className="ln">works</span>
          </h2>

          <div className="about-pairs rv rv-d1">
            <div className="about-pair">
              <span className="about-pair-k">Every paper</span>
              <span className="about-pair-v">checked against the real CAPS curriculum, not guessed at.</span>
            </div>
            <div className="about-pair">
              <span className="about-pair-k">Every quiz</span>
              <span className="about-pair-v">marked the second you answer, with an explanation either way.</span>
            </div>
          </div>

          <div className="about-punch rv rv-d2">
            <span className="ac">practice</span>&nbsp;over guesswork.
            <ArrowRight size={30} />
          </div>
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ── */}
      <section className="about-spread">
        <div className="about-deco o1" style={{ bottom: '-50px', left: '-40px' }}>
          <Bloom size={240} />
        </div>

        <div className="about-inner">
          <h2 className="about-h rv">
            <span className="ln">what</span>
            <span className="ln ac">we</span>
            <span className="ln">believe</span>
          </h2>

          <div className="about-values">
            <div className="about-value rv rv-d1">
              <div className="about-value-badge"><Bloom size={28} /></div>
              <div className="about-value-title">Access</div>
              <div className="about-value-desc">Good study material shouldn&apos;t depend on where you live or what your family can afford.</div>
            </div>
            <div className="about-value rv rv-d2">
              <div className="about-value-badge"><Bloom size={28} /></div>
              <div className="about-value-title">Curiosity</div>
              <div className="about-value-desc">Learning sticks when it feels like discovery &mdash; not another chore before bed.</div>
            </div>
            <div className="about-value rv rv-d3">
              <div className="about-value-badge"><Bloom size={28} /></div>
              <div className="about-value-title">Care</div>
              <div className="about-value-desc">Every question and every mark is checked by people who take getting it right seriously.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA ── */}
      <section className="about-spread dark">
        <div className="about-deco o2" style={{ top: '-60px', right: '-40px' }}>
          <Bloom size={280} />
        </div>
        <div className="about-deco o1" style={{ bottom: '-10%', left: '4%' }}>
          <Bloom size={160} />
        </div>

        <div className="about-inner">
          <div className="about-kicker">
            <span className="about-kicker-line" />
            Curio Learning
          </div>

          <h2 className="about-h">
            <span className="ln">let&apos;s</span>
            <span className="ln">start</span>
            <span className="ln ac">learning</span>
          </h2>

          <div className="about-closing-row">
            <p className="about-closing-sub">
              Free forever for past papers and quizzes. Upgrade to Premium whenever you want
              AI-marked essays and deeper practice.
            </p>
            <div className="about-closing-actions">
              <a href="/papers" className="about-closing-cta">
                Explore free papers
                <ArrowRight size={18} />
              </a>
              <a href="/login" className="about-closing-ghost">or sign up free &rarr;</a>
            </div>
          </div>

          <div className="about-closing-url">curiolearning.co.za</div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
