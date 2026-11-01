<!-- The teacher.dev footer, shared with the other teacher.dev tools so the
     whole set feels like one project. -->
<footer class="no-print">
  <a class="built" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
    <img src="/logo.svg" alt="" width="24" height="24" />
    Built by teacher.dev
  </a>
  <a href="{import.meta.env.BASE_URL}about">about</a>
  <a href="{import.meta.env.BASE_URL}privacy">privacy</a>
</footer>

<style>
  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem 1.25rem;
    padding: 1.5rem 1.25rem 2rem;
    font-size: 0.9rem;
    text-align: center;
  }
  a { color: var(--muted); text-decoration: none; }
  a:hover { color: var(--blue-dark); }
  .built { display: inline-flex; align-items: center; gap: 0.5rem; }
</style>
