<script lang="ts">
  // One cell, or one cell dividing in two, from ./layout.ts: its membrane or
  // wall, cell plate, nuclei, spindle, centrioles and chromosomes, back to front.
  import Chromosomes from './Chromosomes.svelte'
  import type { Palette } from './colors'
  import { ENVELOPE_PIECE, ENVELOPE_START, ENVELOPE_STEP } from './figure'
  import type { Body } from './layout'

  let { body, palette }: { body: Body; palette: Palette } = $props()

  /** The pieces of a nuclear envelope breaking down, as arcs. */
  function pieces(x: number, y: number, r: number) {
    const out: string[] = []
    for (let a = ENVELOPE_START; a < ENVELOPE_START + 360 - ENVELOPE_PIECE / 2; a += ENVELOPE_STEP) {
      const [a1, a2] = [a, a + ENVELOPE_PIECE].map((d) => (d * Math.PI) / 180)
      out.push(`M${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)} A${r} ${r} 0 0 1 ${x + r * Math.cos(a2)} ${y + r * Math.sin(a2)}`)
    }
    return out
  }

  const RAYS = Array.from({ length: 10 }, (_, i) => (i * Math.PI) / 5 + 0.2)
</script>

<g transform="translate(0 {body.dy})">
  <path d={body.outline} fill={body.inner ? palette.wall : palette.cytoplasm} stroke={palette.ink} stroke-width={body.inner ? 1.8 : 2.2} stroke-linejoin="round" />
  {#if body.inner}
    <path d={body.inner} fill={palette.cytoplasm} stroke={palette.ink} stroke-width="1.1" />
  {/if}

  {#if body.plate}
    {@const p = body.plate}
    {#if p.complete}
      <rect x={p.x - 2.2} y={p.y1} width="4.4" height={p.y2 - p.y1} fill={palette.wall} stroke={palette.ink} stroke-width="1.1" />
    {:else}
      {@const count = Math.floor((p.y2 - p.y1) / 7)}
      {#each Array.from({ length: count + 1 }, (_, i) => p.y1 + (i * (p.y2 - p.y1)) / count) as y (y)}
        <circle cx={p.x} cy={y} r="2.7" fill={palette.wall} stroke={palette.ink} stroke-width="1" />
      {/each}
    {/if}
  {/if}

  {#each body.nuclei as n (n.x)}
    {#if n.broken}
      {#each pieces(n.x, n.y, n.r) as d (d)}
        <path {d} fill="none" stroke={palette.ink} stroke-width="1.6" stroke-linecap="round" />
      {/each}
    {:else}
      <circle cx={n.x} cy={n.y} r={n.r} fill={palette.nucleus} stroke={palette.ink} stroke-width="1.6" />
    {/if}
  {/each}
  {#each body.nucleoli as n (n.x)}
    <circle cx={n.x} cy={n.y} r={n.r} fill={palette.nucleolus} />
  {/each}

  <g fill="none" stroke={palette.fiber} stroke-width="1.3" stroke-linecap="round">
    {#each body.fibers as fiber, i (i)}
      <path d={fiber.d} />
    {/each}
  </g>

  {#each body.centrosomes as c, i (i)}
    {#if c.aster}
      <g stroke={palette.fiber} stroke-width="1.2" stroke-linecap="round">
        {#each RAYS as a (a)}
          <line x1={c.x + 12 * Math.cos(a)} y1={c.y + 12 * Math.sin(a)} x2={c.x + 21 * Math.cos(a)} y2={c.y + 21 * Math.sin(a)} />
        {/each}
      </g>
    {/if}
    <!-- a pair of centrioles, short barrels at right angles -->
    <rect x={c.x - 11} y={c.y - 3} width="11" height="6" rx="1.5" fill={palette.ink} />
    <rect x={c.x + 2.5} y={c.y - 6.5} width="6" height="11" rx="1.5" fill={palette.ink} />
  {/each}

  <Chromosomes shapes={body.chromosomes} {palette} />
</g>
