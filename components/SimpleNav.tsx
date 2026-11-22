import Bloom from '@/components/Bloom'

// Lightweight nav for static/legal-style pages (contact, privacy, terms,
// terms) — logo + section links + a plain "back home" link. No auth
// state, unlike QuizNav, since these pages don't need the account dropdown.
export default function SimpleNav() {
  return (
    <nav className="simple-nav">
      <a href="/" className="nav-logo">
        <Bloom size={32} />
        curio
      </a>
      <ul className="simple-nav-links">
        <li><a href="/papers">Papers</a></li>
        <li><a href="/quiz">Quiz</a></li>
        <li><a href="/whizz">Whizz</a></li>
        <li><a href="/bloom">Bloom</a></li>
        <li><a href="/subjects">Subjects</a></li>
        <li><a href="/subscription">Plans</a></li>
      </ul>
      <a href="/" className="nav-back">← Home</a>
    </nav>
  )
}
