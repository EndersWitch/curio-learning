<script lang="ts">
  // The marks printed on a volume instrument's glass, running in from its
  // left wall, with numbers beside the major ones.
  import type { Mark } from '$lib/shared/marks'

  interface Props {
    shown: Mark[]
    left: number
    tubeW: number
    yOf: (ml: number) => number
    /** size multiplier for the current zoom (see sizeAt) */
    k: number
    font: number
  }
  let { shown, left, tubeW, yOf, k, font }: Props = $props()

  const tick = $derived({ major: tubeW * 0.46, medium: tubeW * 0.34, minor: tubeW * 0.22 })
</script>

{#each shown as m (m.value)}
  {@const y = yOf(m.value)}
  <line x1={left} x2={left + tick[m.kind]} y1={y} y2={y} stroke="#111" stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
  {#if m.label}
    <text x={left + tick.major + 3 * k} {y} dy="0.35em" font-size={font} fill="#111">{m.label}</text>
  {/if}
{/each}
