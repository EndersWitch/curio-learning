<script lang="ts">
  // Linking to an exact figure: how a figure's settings travel in its
  // address, and every generator's parameters with example links. Made from
  // each generator's linking.ts (see $lib/linking), so it stays current.
  import { exampleHref, paramRows } from '$lib/linking/define'
  import { LINKED, LINKING_PATH, sectionId } from '$lib/linking/index'
  import Seo from '$lib/site/Seo.svelte'
  import { SITE_NAME, SITE_URL } from '$lib/site/config'

  const first = LINKED[0]
  const firstHref = exampleHref(first.generator.path, first.linking, first.linking.examples[0])
</script>

<Seo
  title="Link to an Exact Figure"
  description="Every {SITE_NAME} figure has its own link. The URL parameters for all {LINKED.length} generators, with example links that open a finished figure."
  path={LINKING_PATH}
/>

<div class="page">
  <a class="back" href="/">← All figures</a>
  <h1>Link to an exact figure</h1>
  <p class="sub">Every figure has its own address. Share it, bookmark it, or build one.</p>

  <section class="card">
    <h2>For teachers</h2>
    <p>
      Every generator keeps its settings in the page’s address. Change a setting and the address changes with it,
      so the address always opens the figure you see. Copy it with the <b>Share link</b> button above the figure (or
      from the address bar) and anyone who opens it, whether a colleague, your students or you next year, gets the same
      figure, ready to download as a PNG or SVG, copy or print.
    </p>
    <p>
      For example, <a href={firstHref}>this link</a> opens {first.linking.examples[0].shows.charAt(0).toLowerCase() + first.linking.examples[0].shows.slice(1)}
    </p>
    <p>Nothing is saved on our servers: the link itself holds the settings.</p>
  </section>

  <section class="card">
    <h2>Building a link</h2>
    <p>For developers, and for AI assistants writing a link for a teacher:</p>
    <ul>
      <li>
        A link is a generator’s address, then <code>?</code>, then its parameters joined by <code>&amp;</code>:
        <code class="url">{SITE_URL}/volume-reading?instrument=buret&amp;reading=23.47</code>
      </li>
      <li>Give only what differs from the defaults. Anything left out takes its default.</li>
      <li>
        A value the page doesn’t understand is ignored, and numbers are kept in range and rounded to what the
        instrument can show, so a link always opens a figure.
      </li>
      <li>On/off parameters are <code>1</code> or <code>0</code>. Choices are the exact lowercase words listed below.</li>
      <li>
        Encode values as in any URL: a space as <code>+</code> or <code>%20</code>, a plus sign as <code>%2B</code>, and
        JSON values percent-encoded.
      </li>
      <li>
        The same reference as plain text: <a href="/llms.txt">/llms.txt</a> (a summary) and
        <a href="/llms-full.txt">/llms-full.txt</a> (every parameter).
      </li>
    </ul>
  </section>

  <nav class="card contents" aria-label="Generators">
    <h2>Generators</h2>
    <ul>
      {#each LINKED as { generator } (generator.id)}
        <li><a href="#{sectionId(generator)}">{generator.name}</a></li>
      {/each}
    </ul>
  </nav>

  {#each LINKED as { generator, linking } (generator.id)}
    <section class="card generator" id={sectionId(generator)} aria-labelledby="{sectionId(generator)}-name">
      <div class="head">
        <h2 id="{sectionId(generator)}-name">{generator.name}</h2>
        <a class="open" href={generator.path}>Open {generator.name} →</a>
      </div>
      <p class="address"><code>{SITE_URL}{generator.path}</code></p>
      <p>{linking.summary}</p>

      <h3>Example links</h3>
      <ul class="examples">
        {#each linking.examples as ex (ex.shows)}
          {@const href = exampleHref(generator.path, linking, ex)}
          <li>
            <a {href}>{ex.shows}</a>
            <code class="url">{SITE_URL}{href}</code>
          </li>
        {/each}
      </ul>

      <h3>How the parameters fit together</h3>
      <ul>
        {#each linking.notes as note (note)}<li>{note}</li>{/each}
      </ul>

      <h3>Parameters</h3>
      <table>
        <thead>
          <tr><th scope="col">Parameter</th><th scope="col">What it does</th><th scope="col">Values</th><th scope="col">Default</th></tr>
        </thead>
        <tbody>
          {#each paramRows(linking) as row (row.name)}
            <tr>
              <th scope="row"><code>{row.name}</code></th>
              <td data-label="What it does">
                {row.what}
                {#if row.when}<span class="when">Used when {row.when}.</span>{/if}
              </td>
              <td data-label="Values">{row.allowed}</td>
              <td data-label="Default"><code>{row.default}</code></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/each}
</div>

<style>
  .page { max-width: 62rem; margin: 0 auto; padding: 1.5rem 1.25rem 2rem; }
  .back { display: inline-block; margin-bottom: 1rem; color: var(--blue-dark); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
  .back:hover { text-decoration: underline; }
  h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.25rem; }
  .sub { margin: 0 0 1.5rem; color: var(--muted); }
  .card { padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
  .card h2 { font-size: 1.15rem; font-weight: 800; margin-bottom: 0.5rem; }
  .card h3 { margin: 1.25rem 0 0.5rem; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .card p { margin: 0 0 0.75rem; color: #374151; overflow-wrap: break-word; }
  .card p:last-child { margin-bottom: 0; }
  .card a { color: var(--blue-dark); font-weight: 600; text-decoration: none; }
  .card a:hover { text-decoration: underline; }
  ul { margin: 0; padding-left: 1.25rem; color: #374151; }
  li { overflow-wrap: anywhere; }
  li + li { margin-top: 0.4rem; }
  code { font-family: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace; font-size: 0.86em; background: var(--bg); border-radius: 5px; padding: 0.05rem 0.3rem; overflow-wrap: anywhere; }
  code.url { display: block; margin-top: 0.25rem; padding: 0.35rem 0.5rem; color: var(--muted); overflow-wrap: anywhere; }

  .contents ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 0.4rem 1rem; padding: 0; list-style: none; }
  .contents li + li { margin-top: 0; }

  .generator { scroll-margin-top: calc(var(--topbar-h) + 1rem); }
  .head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.25rem 1rem; }
  .open { font-size: 0.95rem; }
  .address { margin-bottom: 0.75rem; }
  .examples li + li { margin-top: 0.7rem; }

  table { width: 100%; border-collapse: collapse; font-size: 0.88rem; color: #374151; }
  th, td { padding: 0.5rem 0.6rem; text-align: left; vertical-align: top; border-top: 1px solid var(--border); }
  thead th { border-top: 0; font-size: 0.78rem; font-weight: 700; color: var(--muted); }
  tbody th { font-weight: 400; white-space: nowrap; }
  td { overflow-wrap: anywhere; }
  .when { display: block; margin-top: 0.2rem; color: var(--muted); font-size: 0.82rem; }

  /* Phones: each parameter as a small block rather than a table row. */
  @media (max-width: 640px) {
    .card { padding: 1rem; }
    table, tbody, tr, th, td { display: block; }
    thead { display: none; }
    tr { padding: 0.6rem 0; border-top: 1px solid var(--border); }
    tbody th, td { padding: 0.15rem 0; border: 0; }
    td::before { content: attr(data-label) ': '; font-weight: 700; color: var(--muted); }
  }
</style>
