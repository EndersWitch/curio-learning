<div class="page">
  <a class="back" href={import.meta.env.BASE_URL}>← Back</a>
  <h1>Privacy</h1>
  <p class="sub">What we collect, what we don't, and why.</p>

  <section class="card">
    <p>
      Rounding on a Number Line does not collect personal information from visitors or students.
      We use Cloudflare Web Analytics to anonymously count the number of visits, which helps us
      understand how the tool is being used in classrooms. Cloudflare Web Analytics is cookieless,
      does not fingerprint visitors, and does not track users across other sites; see Cloudflare's
      <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">privacy policy</a>
      for details. We do not share, sell, or otherwise transfer any visitor data to third parties.
    </p>
    <p>
      A drill's settings live entirely in the link the teacher shares, and a student's answers and
      report stay on their screen — nothing is saved or sent anywhere, and it all disappears when
      the page is closed.
    </p>
    <p>
      Questions or concerns? Email
      <a href="mailto:directors@teacher.dev?subject=lines%20privacy">directors@teacher.dev</a>.
    </p>
  </section>
</div>

<style>
  .page { max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.25rem 2rem; }
  .back { display: inline-block; margin-bottom: 1rem; color: var(--blue-dark); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
  .back:hover { text-decoration: underline; }
  h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.25rem; }
  .sub { margin: 0 0 1.5rem; color: var(--muted); }
  .card { padding: 1.25rem 1.5rem; }
  .card p { margin: 0 0 0.9rem; color: #374151; }
  .card p:last-child { margin-bottom: 0; }
  .card a { color: var(--blue-dark); font-weight: 600; text-decoration: none; }
  .card a:hover { text-decoration: underline; }
</style>
