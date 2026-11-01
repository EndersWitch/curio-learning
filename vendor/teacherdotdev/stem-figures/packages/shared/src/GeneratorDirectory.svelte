<script lang="ts">
  // A site's directory: a search box that filters the cards as you type, then
  // the site's generators as small cards with a live preview of their figure,
  // then those it lists from other sites, and a last card for requesting one
  // we don't have. While searching, matches from every other site follow
  // under their site's name. An editor's card says so: it opens a page to
  // draw on, not a generator.
  import { ArrowUpRight, Plus, Search } from '@lucide/svelte'
  import type { Component } from 'svelte'
  import { directory, hrefFrom, SITES, type CatalogEntry, type SiteId } from './catalog'
  import { previewSnapshot } from './catalog/previews'
  import { openRequest } from './request.svelte'

  interface Props {
    site: SiteId
    /** the preview component of each of the site's own generators, by id */
    previews: Record<string, Component>
    /** the search box's placeholder */
    placeholder: string
  }
  let { site, previews, placeholder }: Props = $props()

  let query = $state('')
  const found = $derived(directory(site, query))
  const searching = $derived(!!query.trim())
  // The request card goes last, so with nothing here it follows the other sites' matches.
  const showListed = $derived(found.listed.length > 0 || !found.elsewhere.length)
</script>

<div class="search">
  <Search size={18} aria-hidden="true" class="glass" />
  <input type="search" bind:value={query} {placeholder} aria-label="Search figures" autocomplete="off" />
</div>

{#if searching && !found.listed.length}
  <p class="empty">
    {#if found.elsewhere.length}
      No {SITES[site].name} generator for “{query.trim()}” yet, but our other sites have these.
    {:else}
      No generator for “{query.trim()}” yet.
    {/if}
  </p>
{/if}

{#if showListed}
  <ul class="cards">
    {#each found.listed as g (g.id)}{@render card(g)}{/each}
    {#if !found.elsewhere.length}{@render request()}{/if}
  </ul>
{/if}

{#each found.elsewhere as group, i (group.site)}
  <section class="elsewhere">
    <h2>From {SITES[group.site].name}</h2>
    <ul class="cards">
      {#each group.generators as g (g.id)}{@render card(g)}{/each}
      {#if i === found.elsewhere.length - 1}{@render request()}{/if}
    </ul>
  </section>
{/each}

{#snippet card(g: CatalogEntry)}
  {@const Preview = g.site === site ? previews[g.id] : undefined}
  {@const snapshot = Preview ? undefined : previewSnapshot(g.id)}
  <li>
    <a class="card figure" href={hrefFrom(site, g)}>
      {#if Preview}
        <div class="preview" aria-hidden="true" data-preview={g.id}><Preview /></div>
      {:else}
        <div class="preview snapshot" aria-hidden="true">
          {#if snapshot}<img src={snapshot} alt="" loading="lazy" />{/if}
        </div>
      {/if}
      <div class="text">
        <h3>{g.name}{#if g.kind === 'editor'}<span class="kind">Editor</span>{/if}</h3>
        <p>{g.blurb}</p>
        {#if g.site !== site}
          <span class="from">{SITES[g.site].name}<ArrowUpRight size={13} aria-hidden="true" /></span>
        {/if}
      </div>
    </a>
  </li>
{/snippet}

{#snippet request()}
  <li>
    <button type="button" class="request" onclick={() => openRequest(query)}>
      <span class="plus"><Plus size={20} aria-hidden="true" /></span>
      <span class="request-title">Need a different figure?</span>
      <span class="request-text">Request a generator, and we’ll build it.</span>
    </button>
  </li>
{/snippet}

<style>
  .search { position: relative; max-width: 26rem; margin: 1.5rem 0 1.25rem; }
  .search :global(.glass) { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
  input[type='search'] {
    width: 100%;
    padding: 0.7rem 0.9rem 0.7rem 2.5rem;
    border: 1.5px solid var(--border);
    border-radius: 12px;
    background: #fff;
    color: var(--ink);
    font: inherit;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  input[type='search']:hover { border-color: var(--blue-border); }
  input[type='search']:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

  .empty { margin: 0 0 0.9rem; color: var(--muted); }

  .elsewhere { margin-top: 1.75rem; }
  .elsewhere h2 { margin: 0 0 0.75rem; font-size: 1.05rem; font-weight: 800; }

  .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin: 0; padding: 0; list-style: none; }
  @media (max-width: 760px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 440px) { .cards { grid-template-columns: minmax(0, 1fr); } }
  .cards li { display: flex; }

  .figure { display: flex; flex-direction: column; width: 100%; overflow: hidden; color: inherit; text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
  .figure:hover { border-color: var(--blue-border); transform: translateY(-2px); box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 12px 28px -12px rgba(37, 99, 235, 0.35); }
  .preview { display: flex; justify-content: center; align-items: center; height: 9.5rem; padding: 0.75rem; border-bottom: 1px solid var(--border); background: #fff; }
  .preview :global(svg) { width: auto; height: 100%; max-width: 100%; }
  /* A snapshot is of the whole preview, padding and all. */
  .snapshot { padding: 0; }
  .snapshot img { width: 100%; height: 100%; object-fit: contain; }
  .text { padding: 0.7rem 0.9rem 0.85rem; }
  h3 { font-size: 0.98rem; font-weight: 800; }
  .kind { display: inline-block; margin-left: 0.4rem; padding: 0.1rem 0.45rem; border-radius: 999px; background: var(--blue-soft); color: var(--blue-dark); font-size: 0.7rem; font-weight: 700; letter-spacing: 0.02em; vertical-align: 0.1rem; }
  .text p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.85rem; line-height: 1.35; }
  .from { display: inline-flex; align-items: center; gap: 0.15rem; margin-top: 0.4rem; color: var(--blue-dark); font-size: 0.78rem; font-weight: 700; }

  .request {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    width: 100%;
    min-height: 13rem;
    padding: 1.25rem;
    border: 2px dashed var(--blue-border);
    border-radius: var(--radius);
    background: rgba(255, 255, 255, 0.6);
    color: var(--ink);
    text-align: center;
  }
  .request:hover { background: var(--blue-soft); }
  .plus { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--blue-soft); color: var(--blue-dark); margin-bottom: 0.3rem; }
  .request-title { font-weight: 800; font-size: 0.98rem; }
  .request-text { color: var(--muted); font-size: 0.85rem; }
</style>
