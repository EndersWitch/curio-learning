import type { Metadata } from 'next'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import { getGradeIndex } from '@/lib/subjectsData'

export const metadata: Metadata = {
  title: 'Browse by Subject & Grade | CAPS Study Materials | Curio Learning',
  description: 'Find CAPS-aligned study materials for every grade and subject, from Grade 4 to Grade 12. Free papers, memos and AI-powered explanations.',
}

const PHASES = [
  { key: 'int', tag: 'Intermediate Phase', grades: [4, 5, 6] },
  { key: 'sen', tag: 'Senior Phase', grades: [7, 8, 9] },
  { key: 'fet', tag: 'FET Phase', grades: [10, 11, 12] },
] as const

export default function SubjectsHubPage() {
  return (
    <div style={{ background: 'var(--paper)' }}>
      <QuizNav />
      <RevealObserver />
      <div className="page-wrap">
        <div className="hub-wrap">
          <div className="hub-eyebrow">CAPS-aligned · Grade 4 to 12</div>
          <h1 className="hub-title">Pick your grade.</h1>
          <p className="hub-sub">
            Find detailed study guides, term-by-term breakdowns and free practice papers for every CAPS subject. Select your grade to get started.
          </p>

          {PHASES.map((phase, pi) => {
            const gradeCounts = phase.grades.map((g) => ({ grade: g, count: getGradeIndex(g)?.subjectCards.length ?? 0 }))
            const totalRange = `Grade ${phase.grades[0]} – ${phase.grades[phase.grades.length - 1]}`
            const maxCount = Math.max(...gradeCounts.map((g) => g.count))
            return (
              <div className={`phase-section rv${pi > 0 ? ` rv-d${pi}` : ''}`} id={phase.key} key={phase.key}>
                <div className="phase-heading">
                  <span className={`phase-tag ${phase.key}`}>{phase.tag}</span>
                  <div className="phase-rule" />
                  <span style={{ fontSize: '.65rem', color: 'var(--ink35)' }}>{totalRange} · {maxCount} subjects</span>
                </div>
                <div className="grade-cards">
                  {gradeCounts.map(({ grade, count }) => (
                    <a key={grade} href={`/subjects/grade-${grade}`} className={`grade-card ${phase.key}`}>
                      <div className="grade-card-num">{grade}</div>
                      <div className="grade-card-label">Grade {grade}</div>
                      <div className="grade-card-subj">{count} subjects</div>
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Footer />
      </div>
    </div>
  )
}
