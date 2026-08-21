import Bloom from '@/components/Bloom'

// Lightweight nav for static/legal-style pages (contact, privacy, terms,
// deeplearn) — logo + section links + a plain "back home" link. No auth
// state, unlike QuizNav, since these pages don't need the account dropdown.
export default function SimpleNav() {
  return (
    <nav className="simple-nav">
      <a href="/" className="nav-logo">
        <Bloom size={24} />
        curio
      </a>
      <ul className="simple-nav-links">
        <li><a href="/papers">Papers</a></li>
        <li><a href="/quiz">Quiz</a></li>
        <li><a href="/subjects">Subjects</a></li>
        <li><a href="/subscription">Subscription</a></li>
      </ul>
      <a href="/" className="nav-back">← Home</a>
    </nav>
  )
}
