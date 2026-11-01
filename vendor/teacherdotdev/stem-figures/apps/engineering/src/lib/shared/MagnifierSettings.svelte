<script lang="ts">
  // Choosing what a figure shows (the instrument, a magnifier, or both) and
  // how many numbered marks the magnifier spans.
  import { MAGNIFIER_VIEWS, MAGNIFIER_VIEW_NAMES, type MagnifierView } from './magnify'

  let { view = $bindable(), span = $bindable() }: { view: MagnifierView; span: number } = $props()
</script>

<div class="segmented" role="radiogroup" aria-label="Show">
  {#each MAGNIFIER_VIEWS as v (v)}
    <button type="button" role="radio" aria-checked={view === v} class:on={view === v} onclick={() => (view = v)}>
      {MAGNIFIER_VIEW_NAMES[v]}
    </button>
  {/each}
</div>
{#if view !== 'whole'}
  <p class="field-label">Numbered marks in the magnifier</p>
  <div class="chips" role="radiogroup" aria-label="Numbered marks in the magnifier">
    {#each [1, 2, 3, 4, 5, 6] as n (n)}
      <button type="button" role="radio" aria-checked={span === n} class="chip" class:on={span === n} onclick={() => (span = n)}>{n}</button>
    {/each}
  </div>
{/if}

<style>
  .segmented button { font-size: 0.8rem; }
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .chip { min-width: 2.6rem; }
</style>
