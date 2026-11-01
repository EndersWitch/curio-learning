<footer class="no-print">
  <a class="built" href="/tools">
    <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="24" height="24" />
    curio learning
  </a>
  <a href="{import.meta.env.BASE_URL}about">about</a>
  <a href="{import.meta.env.BASE_URL}privacy">privacy</a>
  <a href="/licences">licences</a>
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
