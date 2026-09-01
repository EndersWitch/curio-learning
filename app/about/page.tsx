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
    <div className="poster-page">
      <SimpleNav />
      <RevealObserver />

      {/* ── HERO — who we are ── */}
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
            Curio Learning
          </div>
          <p className="spread-tagline">Free, CAPS-aligned exam prep for Grade 4–12 &mdash; built in South Africa, for South African students.</p>

          <h1 className="spread-h">
            <span className="ln">who</span>
            <span className="ln ac">we</span>
            <span className="ln">are</span>
          </h1>

          <p className="spread-lede rv">
            Curio turns real past papers into <strong>quizzes that mark themselves</strong>, so studying
            feels less like a chore and more like a game you&apos;re actually winning.
          </p>

          <a href="/subjects" className="spread-cta-corner">
            Start free
            <ArrowRight size={18} style={{ transform: 'rotate(-45deg)' }} />
          </a>
        </div>
      </section>

      {/* ── NUMBERS — just the facts ── */}
      <section className="spread">
        <div className="spread-deco o2" style={{ bottom: '-60px', right: '-30px' }}>
          <Bloom size={220} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>
          <h2 className="spread-h rv">
            <span className="ln">just</span>
            <span className="ln">the</span>
            <span className="ln ac">facts</span>
          </h2>

          <div className="spread-stats">
            <div className="spread-stat c1 rv rv-d1">
              <div className="spread-stat-val">R0</div>
              <div className="spread-stat-label">to start. Every past paper and memo is free &mdash; no account required, no strings attached.</div>
            </div>
            <div className="spread-stat c2 rv rv-d2">
              <div className="spread-stat-val">Gr 4&ndash;12</div>
              <div className="spread-stat-label">Every core CAPS subject, mapped grade by grade.</div>
            </div>
            <div className="spread-stat c3 rv rv-d3">
              <div className="spread-stat-val">24/7</div>
              <div className="spread-stat-label">Practice on your own schedule &mdash; no timetable, no waiting on marking.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE DO ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ top: '10%', left: '2%' }}>
          <Bloom size={180} />
        </div>

        <div className="spread-inner">
          <div className="spread-kicker">
            <span className="spread-kicker-line" />
            Curio Learning
          </div>

          <p className="spread-blurb-head rv">
            Real past papers turned into practice that actually sticks:
          </p>
          <div className="spread-blurb-cols rv rv-d1">
            <p>Past papers &amp; memos, topic-by-topic quizzes, subject guides mapped to the curriculum.</p>
            <p>Instant marking, streaks that build the habit, progress you can actually see.</p>
          </div>

          <h2 className="spread-h rv rv-d2">
            <span className="ln">what</span>
            <span className="ln ac">we</span>
            <span className="ln">do</span>
          </h2>
        </div>
      </section>

      {/* ── WHY IT WORKS ── */}
      <section className="spread">
        <div className="spread-deco o2" style={{ top: '-40px', right: '6%' }}>
          <Bloom size={70} />
        </div>
        <div className="spread-deco o1" style={{ top: '20px', right: '2%' }}>
          <Bloom size={130} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">why</span>
            <span className="ln ac">it</span>
            <span className="ln">works</span>
          </h2>

          <div className="spread-pairs rv rv-d1">
            <div className="spread-pair">
              <span className="spread-pair-k">Every paper</span>
              <span className="spread-pair-v">checked against the real CAPS curriculum, not guessed at.</span>
            </div>
            <div className="spread-pair">
              <span className="spread-pair-k">Every quiz</span>
              <span className="spread-pair-v">marked the second you answer, with an explanation either way.</span>
            </div>
          </div>

          <div className="spread-punch rv rv-d2">
            <span className="ac">practice</span>&nbsp;over guesswork.
            <ArrowRight size={30} />
          </div>
        </div>
      </section>

      {/* ── WHAT WE BELIEVE ── */}
      <section className="spread">
        <div className="spread-deco o1" style={{ bottom: '-50px', left: '-40px' }}>
          <Bloom size={240} />
        </div>

        <div className="spread-inner">
          <h2 className="spread-h rv">
            <span className="ln">what</span>
            <span className="ln ac">we</span>
            <span className="ln">believe</span>
          </h2>

          <div className="spread-values">
            <div className="spread-value rv rv-d1">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Access</div>
              <div className="spread-value-desc">Good study material shouldn&apos;t depend on where you live or what your family can afford.</div>
            </div>
            <div className="spread-value rv rv-d2">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Curiosity</div>
              <div className="spread-value-desc">Learning sticks when it feels like discovery &mdash; not another chore before bed.</div>
            </div>
            <div className="spread-value rv rv-d3">
              <div className="spread-value-badge"><Bloom size={28} /></div>
              <div className="spread-value-title">Care</div>
              <div className="spread-value-desc">Every question and every mark is checked by people who take getting it right seriously.</div>
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
            Curio Learning
          </div>

          <h2 className="spread-h">
            <span className="ln">let&apos;s</span>
            <span className="ln">start</span>
            <span className="ln ac">learning</span>
          </h2>

          <div className="spread-closing-row">
            <p className="spread-closing-sub">
              Free forever for past papers and quizzes. Upgrade to Premium whenever you want
              AI-marked essays and deeper practice.
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
