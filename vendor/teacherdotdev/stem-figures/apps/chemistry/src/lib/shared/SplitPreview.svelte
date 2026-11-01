<script lang="ts">
  // A directory card preview showing several of a generator's figures,
  // divided by lines. Split vertically, the figures sit side by side, each
  // centered in its own column. Split diagonally (two figures only), the
  // first sits in the top left corner and the second in the bottom right,
  // each in a box `size` of the card across and down (a fraction). Either way
  // each figure is clipped to its own part so they never run into each other.
  import type { Snippet } from 'svelte'
  import FigureCorner from './FigureCorner.svelte'

  interface Props {
    figures: Snippet[]
    split?: 'diagonal' | 'vertical'
    /** each figure's box when split diagonally, as fractions of the card's width and height */
    size?: { width: number; height: number }
  }
  let { figures, split = 'diagonal', size = { width: 0.6, height: 0.62 } }: Props = $props()
</script>

{#if split === 'vertical'}
  <div class="split vertical" style:--columns={figures.length}>
    {#each figures as figure, i (i)}
      <div class="column" class:ruled={i > 0}>
        <FigureCorner align="xMidYMid">{@render figure()}</FigureCorner>
      </div>
    {/each}
  </div>
{:else}
  <div class="split" style:--w="{size.width * 100}%" style:--h="{size.height * 100}%">
    <div class="half first">
      <div class="box"><FigureCorner align="xMinYMin">{@render figures[0]()}</FigureCorner></div>
    </div>
    <div class="half second">
      <div class="box"><FigureCorner align="xMaxYMax">{@render figures[1]()}</FigureCorner></div>
    </div>
    <svg class="line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="100" y1="0" x2="0" y2="100" vector-effect="non-scaling-stroke" />
    </svg>
  </div>
{/if}

<style>
  /* Fills the card's preview edge to edge, over its padding, so the lines
     run from edge to edge. */
  .split { position: relative; align-self: stretch; flex: 1; margin: -0.75rem; }
  .split .column :global(svg),
  .split .box :global(svg) { display: block; width: 100%; height: 100%; max-width: none; }

  .vertical { display: grid; grid-template-columns: repeat(var(--columns), minmax(0, 1fr)); }
  .column { min-width: 0; padding: 0.55rem; overflow: hidden; }
  .ruled { border-left: 1.5px solid var(--border); }

  .half { position: absolute; inset: 0; }
  .first { clip-path: polygon(0 0, 100% 0, 0 100%); }
  .second { clip-path: polygon(100% 0, 100% 100%, 0 100%); }
  .box { position: absolute; width: var(--w); height: var(--h); }
  .first .box { top: 0.55rem; left: 0.55rem; }
  .second .box { right: 0.55rem; bottom: 0.55rem; }
  .split .line { position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; pointer-events: none; }
  .line line { stroke: var(--border); stroke-width: 1.5; }
</style>
