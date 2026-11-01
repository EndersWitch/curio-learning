<script lang="ts">
  // The directory: the site's generators, and those it lists from other
  // sites, searchable across every STEM Figures site.
  import { PREVIEWS } from '$lib/generators/index'
  import { SITE_ID } from '$lib/site/config'
  import Seo from '$lib/site/Seo.svelte'
  import { homeJsonLd } from '$lib/site/structuredData'
  import GeneratorDirectory from '$shared/GeneratorDirectory.svelte'

  const description =
    'Free generators for clean, printable chemistry figures. Make one to fit your lesson, then copy it straight into a test, worksheet or slide.'
</script>

<Seo {description} path="/" jsonLd={homeJsonLd(description)} />

<div class="page">
  <header class="hero">
    <h1>Chemistry figures for your tests and worksheets</h1>
    <p>Make one to fit your lesson, then copy it straight into your document. Free, with no sign-up.</p>
  </header>

  <GeneratorDirectory site={SITE_ID} previews={PREVIEWS} placeholder="Search figures, like “graduated cylinder”" />
</div>

<style>
  .page { max-width: 58rem; margin: 0 auto; padding: 2.5rem 1.25rem 1rem; }
  h1 { font-size: 1.9rem; font-weight: 800; }
  .hero p { max-width: 42rem; margin: 0.55rem 0 0; color: var(--muted); font-size: 1.02rem; }
</style>
