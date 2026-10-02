import type { Paper } from '@/lib/content'
import { prettySlug } from '@/lib/quizUrls'

// Rendered on the server by the subject guide page (which fetches the papers
// and only shows these when the subject has some), so the paper list is part
// of the page's HTML.

export function SubjectPapersGrid({ papers }: { papers: Paper[] }) {
  return (
    <div className="subjpapers-grid">
      {papers.map((p) => (
        <div className="subjpaper-card" key={p.id}>
          <div className="subjpaper-title">{p.title}</div>
          <div className="subjpaper-meta">Grade {p.grade} · {p.topic || (p.section_type ? prettySlug(p.section_type) : '')}</div>
          <div className="subjpaper-footer">
            <span className="subjpaper-badge">{p.has_memo ? 'Free + Memo' : 'Free'}</span>
            <a href={p.file_url} target="_blank" rel="noopener noreferrer" className="subjpaper-btn">Open ↗</a>
          </div>
        </div>
      ))}
    </div>
  )
}

export function SubjectPapersSidebar({ papers }: { papers: Paper[] }) {
  return (
    <>
      {papers.slice(0, 5).map((p) => (
        <div className="paper-row" key={p.id}>
          <div className="paper-info">
            <div className="paper-title">{p.title}</div>
            <div className="paper-meta">{p.section_type ? prettySlug(p.section_type) : ''}</div>
          </div>
          <span className="paper-badge">Free</span>
        </div>
      ))}
    </>
  )
}
