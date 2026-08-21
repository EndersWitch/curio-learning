import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import { SubjectPapersGrid, SubjectPapersSidebar } from '@/components/subjects/SubjectPapers'
import { ALL_SUBJECTS, getSubjectPage } from '@/lib/subjectsData'

interface Props {
  params: { grade: string; subject: string }
}

function parseGradeParam(gradeParam: string): number | null {
  const m = /^grade-(\d+)$/.exec(gradeParam)
  return m ? Number(m[1]) : null
}

export function generateStaticParams() {
  return ALL_SUBJECTS.map((s) => ({ grade: `grade-${s.grade}`, subject: s.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const grade = parseGradeParam(params.grade)
  const subject = grade ? getSubjectPage(grade, params.subject) : undefined
  if (!subject) return {}
  return {
    title: subject.title,
    description: subject.description,
  }
}

export default function SubjectGuidePage({ params }: Props) {
  const grade = parseGradeParam(params.grade)
  const subject = grade ? getSubjectPage(grade, params.subject) : undefined
  if (!subject) notFound()

  return (
    <div style={{ background: 'var(--paper)' }}>
      <QuizNav />
      <RevealObserver />
      <div className="page-wrap">
        <div className="subject-hero">
          <div className="hero-inner">
            <div className="breadcrumb">
              <a href="/">Home</a>
              <span className="breadcrumb-sep">›</span>
              <a href="/subjects">Subjects</a>
              <span className="breadcrumb-sep">›</span>
              <a href={`/subjects/grade-${subject.grade}`}>Grade {subject.grade}</a>
              <span className="breadcrumb-sep">›</span>
              <span>{subject.subjectTitle}</span>
            </div>
            <div className={`phase-badge ${subject.phaseClass}`}>
              <span className="phase-dot" />
              {subject.phaseLabel}
            </div>
            <div className="subject-title-row">
              <h1 className="subject-title">{subject.subjectTitle}</h1>
              <span className="subject-tagline">{subject.tagline}</span>
            </div>
            <div className="subject-meta">
              <span className="meta-pill cy">Grade {subject.grade}</span>
              <span className="meta-pill">CAPS Aligned</span>
              <span className="meta-pill co">Free Papers + Memos</span>
            </div>
            {subject.otherGrades.length > 0 && (
              <div className="grade-selector">
                <span className="grade-selector-note">Other grades:</span>
                {subject.otherGrades.map((g) => (
                  <a key={g.grade} href={`/subjects/grade-${g.grade}/${g.slug}`} className="grade-pill">
                    Grade {g.grade}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="content-area">
          <main>
            <div className="rv">
              <div className="section-eyebrow">Overview</div>
              <div className="section-title">What to expect in Grade {subject.grade}</div>
              <div className="what-to-expect">
                <p className="expect-intro" dangerouslySetInnerHTML={{ __html: subject.expectIntro }} />
                <div className="expect-grid">
                  {subject.expectItems.map((item) => (
                    <div className="expect-item" key={item.label}>
                      <div className="expect-item-label">{item.label}</div>
                      <div className="expect-item-val">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rv rv-d1">
              <div className="section-eyebrow">CAPS curriculum</div>
              <div className="section-title">Term-by-term breakdown</div>
              <div className="term-grid">
                {subject.termCards.map((term) => (
                  <div className={`term-card ${term.key}`} key={term.key}>
                    <div className="term-label">{term.label}</div>
                    <div className="term-heading">{term.heading}</div>
                    <ul className="term-topics">
                      {term.topics.map((topic, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: topic }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="weighting-section rv rv-d1">
              <div className="section-eyebrow">Assessment</div>
              <div className="section-title">How marks are split</div>
              <div className="weighting-bars">
                {subject.weightingBars.map((bar) => (
                  <div className="wbar" key={bar.label}>
                    <span className="wbar-label">{bar.label}</span>
                    <div className="wbar-track">
                      <div className="wbar-fill" style={{ width: `${bar.pct}%` }} />
                    </div>
                    <span className="wbar-pct">{bar.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="skills-section rv rv-d2">
              <div className="section-eyebrow">Key skills</div>
              <div className="section-title">What a strong Grade {subject.grade} student can do</div>
              <div className="skills-grid">
                {subject.skillChips.map((skill, i) => (
                  <span className="skill-chip" key={i}>{skill}</span>
                ))}
              </div>
            </div>

            <div className="papers-section rv rv-d2">
              <div className="section-eyebrow">Practice materials</div>
              <div className="section-title">Grade {subject.grade} papers &amp; memos</div>
              <SubjectPapersGrid subjectKey={subject.papersSubjectKey} grade={subject.grade} />
            </div>

            <div className="tips-section rv rv-d3">
              <div className="section-eyebrow">Study smarter</div>
              <div className="section-title">Tips for Grade {subject.grade}</div>
              <div className="tips-list">
                {subject.tips.map((tip, i) => (
                  <div className="tip-item" key={i}>
                    <span className="tip-icon" dangerouslySetInnerHTML={{ __html: tip.iconSvg }} />
                    <p className="tip-text" dangerouslySetInnerHTML={{ __html: tip.text }} />
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside className="sidebar">
            <div className="premium-card rv">
              <div className="premium-eyebrow">Curio Premium</div>
              <div className="premium-title">AI-powered practice</div>
              <div className="premium-desc">
                Instant explanations, adaptive quizzes and personalised feedback — built for Grade {subject.grade} CAPS.
              </div>
              <div className="premium-feats">
                <span className="premium-feat">AI Quizzes</span>
                <span className="premium-feat">Deep Learn</span>
                <span className="premium-feat">Writing Feedback</span>
              </div>
              <a href="/login?tab=signup" className="premium-cta">Start free trial →</a>
              <p className="premium-price">R49/month · 7-day free trial</p>
            </div>

            <div className="sidebar-card rv rv-d1">
              <div className="sidebar-card-head">
                <span className="sidebar-card-title">Grade {subject.grade} Papers</span>
                <a href="/papers" className="sidebar-card-link">View all →</a>
              </div>
              <div className="sidebar-card-body">
                <SubjectPapersSidebar subjectKey={subject.papersSubjectKey} grade={subject.grade} />
              </div>
            </div>

            {subject.relatedSubjects.length > 0 && (
              <div className="sidebar-card rv rv-d2">
                <div className="sidebar-card-head">
                  <span className="sidebar-card-title">Other Grade {subject.grade} subjects</span>
                </div>
                <div className="sidebar-card-body">
                  <div className="related-list">
                    {subject.relatedSubjects.map((rel) => (
                      <a key={rel.slug} href={`/subjects/grade-${subject.grade}/${rel.slug}`} className="related-item">
                        <span className={`related-item-dot ${rel.dot}`} />
                        {rel.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <Footer />
      </div>
    </div>
  )
}
