import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import QuizNav from '@/components/quiz/QuizNav'
import Footer from '@/components/Footer'
import RevealObserver from '@/components/RevealObserver'
import { ALL_GRADES, getGradeIndex } from '@/lib/subjectsData'

interface Props {
  params: { grade: string }
}

function parseGradeParam(gradeParam: string): number | null {
  const m = /^grade-(\d+)$/.exec(gradeParam)
  return m ? Number(m[1]) : null
}

export function generateStaticParams() {
  return ALL_GRADES.map((g) => ({ grade: `grade-${g}` }))
}

export function generateMetadata({ params }: Props): Metadata {
  const grade = parseGradeParam(params.grade)
  const idx = grade ? getGradeIndex(grade) : undefined
  if (!idx) return {}
  return { title: idx.title, description: idx.description }
}

export default function GradeSubjectsPage({ params }: Props) {
  const grade = parseGradeParam(params.grade)
  const idx = grade ? getGradeIndex(grade) : undefined
  if (!idx) notFound()

  const otherGrades = ALL_GRADES.filter((g) => g !== grade)

  return (
    <div style={{ background: 'var(--paper)' }}>
      <QuizNav />
      <RevealObserver />
      <div className="page-wrap">
        <div className="hub-wrap">
          <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
            <a href="/">Home</a>
            <span className="breadcrumb-sep">›</span>
            <a href="/subjects">Subjects</a>
            <span className="breadcrumb-sep">›</span>
            <span>Grade {idx.grade}</span>
          </div>
          <div className="hub-eyebrow">{idx.phaseTag}</div>
          <h1 className="hub-title" dangerouslySetInnerHTML={{ __html: idx.heroTitle }} />
          <p className="hub-sub">{idx.heroSub}</p>
          <div className="grade-nav">
            <span className="grade-nav-note">Other grades:</span>
            {otherGrades.map((g) => (
              <a key={g} href={`/subjects/grade-${g}`} className="gnav-pill">Grade {g}</a>
            ))}
          </div>

          <div className="subj-grid">
            {idx.subjectCards.map((card, i) => {
              const delayStep = Math.min(3, Math.floor(i / 3))
              const delayClass = delayStep > 0 ? ` rv-d${delayStep}` : ''
              return (
                <a
                  key={card.slug}
                  href={`/subjects/grade-${idx.grade}/${card.slug}`}
                  className={`subj-card rv${delayClass}${card.hasPapers ? ' has-papers' : ''}`}
                >
                  <div className="subj-card-name">{card.name}</div>
                  <div className="subj-card-desc">{card.hubDescription}</div>
                  <span className="subj-card-arrow">View guide →</span>
                </a>
              )
            })}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}
