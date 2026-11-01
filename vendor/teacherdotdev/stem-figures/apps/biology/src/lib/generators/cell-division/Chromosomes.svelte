<script lang="ts">
  // Chromosomes: each chromatid a thick line with a dark edge, in one piece
  // or, after crossing over, two, by whose DNA each part is. Each
  // condensed chromosome gets a dot at its centromere.
  import { EDGE, pathOf, type ChromosomeShape } from './chromosomes'
  import type { Palette } from './colors'

  let { shapes, palette }: { shapes: ChromosomeShape[]; palette: Palette } = $props()
</script>

{#each shapes as shape, i (i)}
  {#each shape.chromatids as c, j (j)}
    {@const edge = c.look === 'thread' ? EDGE * 0.7 : EDGE}
    {@const pair = c.chromatid.pair}
    {@const whole = c.chromatid.tip === c.chromatid.homolog}
    {@const last = c.points[c.points.length - 1]}
    <path d={pathOf(c.points)} fill="none" stroke={palette.ink} stroke-width={c.width + 2 * edge} stroke-linecap="round" stroke-linejoin="round" />
    {#if whole}
      <path d={pathOf(c.points)} fill="none" stroke={palette.chromatid(pair, c.chromatid.homolog)} stroke-width={c.width} stroke-linecap="round" stroke-linejoin="round" />
    {:else}
      <path
        d={pathOf(c.points.slice(0, c.split + 1))}
        fill="none"
        stroke={palette.chromatid(pair, c.chromatid.homolog)}
        stroke-width={c.width}
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d={pathOf(c.points.slice(c.split))} fill="none" stroke={palette.chromatid(pair, c.chromatid.tip)} stroke-width={c.width} stroke-linejoin="round" />
      <circle cx={last.x} cy={last.y} r={c.width / 2} fill={palette.chromatid(pair, c.chromatid.tip)} />
    {/if}
  {/each}
  {#if shape.chromatids[0].look === 'condensed'}
    <!-- a separated chromatid's centromere is smaller, at the point of its V -->
    <circle cx={shape.centromere.x} cy={shape.centromere.y} r={shape.chromatids.length === 2 ? 3 : 2.3} fill={palette.ink} stroke="#fff" stroke-width="1" />
  {/if}
{/each}
