import raw from '@/lib/data/subjects.json'

export interface TermCard {
  key: string
  label: string
  heading: string
  topics: string[]
}

export interface WeightingBar {
  label: string
  pct: number
  color: string
}

export interface Tip {
  iconSvg: string
  text: string
}

export interface RelatedSubject {
  slug: string
  dot: string
  label: string
}

export interface SubjectPage {
  grade: number
  slug: string
  title: string
  description: string
  phaseClass: 'intermediate' | 'senior' | 'fet'
  phaseLabel: string
  subjectTitle: string
  tagline: string
  otherGrades: { grade: number; slug: string }[]
  expectIntro: string
  expectItems: { label: string; value: string }[]
  termCards: TermCard[]
  weightingBars: WeightingBar[]
  skillChips: string[]
  tips: Tip[]
  relatedSubjects: RelatedSubject[]
  papersSubjectKey: string | null
  hubName: string
  hubDescription: string
  hasPapers: boolean
}

export interface SubjectCard {
  slug: string
  hasPapers: boolean
  name: string
  hubDescription: string
}

export interface GradeIndex {
  grade: number
  title: string
  description: string
  phaseTag: string
  heroTitle: string
  heroSub: string
  subjectCards: SubjectCard[]
}

interface SubjectsDataFile {
  subjects: SubjectPage[]
  gradeIndexes: GradeIndex[]
}

const data = raw as SubjectsDataFile

export const ALL_SUBJECTS: SubjectPage[] = data.subjects
export const ALL_GRADE_INDEXES: GradeIndex[] = data.gradeIndexes

export function getSubjectPage(grade: number, slug: string): SubjectPage | undefined {
  return ALL_SUBJECTS.find((s) => s.grade === grade && s.slug === slug)
}

export function getGradeIndex(grade: number): GradeIndex | undefined {
  return ALL_GRADE_INDEXES.find((g) => g.grade === grade)
}

export function phaseFor(grade: number): { key: 'intermediate' | 'senior' | 'fet'; label: string } {
  if (grade <= 6) return { key: 'intermediate', label: 'Intermediate Phase' }
  if (grade <= 9) return { key: 'senior', label: 'Senior Phase' }
  return { key: 'fet', label: 'FET Phase' }
}

export const ALL_GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12]
