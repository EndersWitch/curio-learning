<script lang="ts">
  // On every page: the Engineering Figures name (back to the directory), a note that
  // it's part of the STEM Figures family with links to the other figure sites, the
  // current generator's name, and the teacher.dev credit linking out to teacher.dev.
  import { ChevronRight } from '@lucide/svelte'
  import { page } from '$app/state'
  import { findGenerator } from '$lib/generators/index'
  import { FAMILY, SISTER_SITES, SITE_NAME } from './config'

  const current = $derived(findGenerator(page.url.pathname))
</script>

<header class="topbar no-print">
  <div class="left">
    <a class="home" href="/">
      <img src="/favicon.svg" alt="" width="28" height="28" />
      <span>{SITE_NAME}</span>
    </a>
    <!-- No noreferrer on these, so the other sites can see the visit came from here. -->
    <nav class="family" aria-label="{FAMILY.name} family">
      <span>Part of the <a href={FAMILY.url} rel="noopener">{FAMILY.name}</a> family:</span>
      {#each SISTER_SITES as site (site.url)}
        <a class="sister" href={site.url} rel="noopener">{site.name}</a>
      {/each}
    </nav>
    {#if current}
      <ChevronRight size={16} aria-hidden="true" class="sep" />
      <span class="current" aria-current="page">{current.name}</span>
    {/if}
  </div>
  <a class="built" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
    <img src="/logo.svg" alt="" width="22" height="22" />
    <span>Built by teacher.dev</span>
  </a>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: var(--topbar-h);
    padding: 0 1.25rem;
    background: #fff;
    border-bottom: 1px solid var(--border);
  }
  .left { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
  .home { display: inline-flex; align-items: center; gap: 0.55rem; color: var(--ink); text-decoration: none; font-weight: 800; font-size: 1.1rem; white-space: nowrap; }
  .family { display: flex; align-items: center; gap: 0.75rem; flex: none; margin-left: 0.5rem; padding-left: 1rem; border-left: 1px solid var(--border); color: var(--muted); font-size: 0.85rem; white-space: nowrap; }
  .family a { color: var(--muted); font-weight: 600; text-decoration: none; }
  .family a:hover { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
  .left :global(.sep) { color: var(--muted); flex: none; margin-left: 0.5rem; }
  .current { color: var(--muted); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .built { display: inline-flex; align-items: center; gap: 0.5rem; flex: none; color: var(--muted); font-size: 0.9rem; text-decoration: none; white-space: nowrap; }
  .built:hover span { text-decoration: underline; text-underline-offset: 3px; }
  /* The family links go before the generator's name gets squeezed; the footer
     still has them. */
  @media (max-width: 1000px) {
    .family { display: none; }
  }
  /* Phones keep the site name and drop the generator's name, which the page shows anyway. */
  @media (max-width: 640px) {
    .left :global(.sep), .current { display: none; }
  }
  @media (max-width: 380px) {
    .built span { display: none; }
  }
</style>
