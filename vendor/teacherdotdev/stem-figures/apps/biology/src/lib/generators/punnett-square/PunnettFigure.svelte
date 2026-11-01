<script lang="ts">
  // The Punnett square figure for a set of settings: the square with its
  // parents and gametes, any shading and its key, and the summary lines,
  // in black and white so it photocopies as it looks. `id` keeps the
  // shading patterns apart when two figures share a page.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import { genotypeKey } from './genetics'
  import { punnettLayout, type Pattern } from './layout'
  import RichText from './RichText.svelte'
  import { squareOf, type PunnettSettings } from './settings'
  import { plainAlleles } from './text'

  let { settings, id = 'punnett', svg = $bindable() }: { settings: PunnettSettings; id?: string; svg?: SVGSVGElement } = $props()

  const sq = $derived(squareOf(settings))
  const layout = $derived(punnettLayout(settings, sq))
  const g = $derived(layout.grid)
  const side = $derived(g.n * g.cell)

  const fillOf = (p: Pattern | undefined) => (!p || p === 'white' ? '#fff' : p === 'gray' ? '#d9d9d9' : `url(#${id}-${p})`)
  const patterned = (p: Pattern | undefined) => !!p && p !== 'white' && p !== 'gray'

  const label = $derived(
    `A Punnett square crossing ${sq.parents.map((p) => p.map(plainAlleles).join('')).join(' and ')}: ` +
      sq.cells.flat().map(genotypeKey).join(', ').replace(/[\^{}]/g, ''),
  )
</script>

<FigureFrame bind:svg width={layout.width} height={layout.height} {label}>
  {#if layout.patterns.some(patterned)}
    <defs>
      <pattern id="{id}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="9" height="9" fill="#fff" />
        <line x1="0" y1="0" x2="0" y2="9" stroke="#777" stroke-width="1.8" />
      </pattern>
      <pattern id="{id}-dots" width="9" height="9" patternUnits="userSpaceOnUse">
        <rect width="9" height="9" fill="#fff" />
        <circle cx="4.5" cy="4.5" r="1.6" fill="#666" />
      </pattern>
      <pattern id="{id}-cross" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="9" height="9" fill="#fff" />
        <path d="M0 0V9M0 0H9" stroke="#6b6b6b" stroke-width="1.4" />
      </pattern>
    </defs>
  {/if}

  {#each layout.heading as line, i (i)}<RichText {line} />{/each}

  {#each layout.cells as c (c.row * g.n + c.column)}
    {#if c.fill}<rect x={c.x} y={c.y} width={g.cell} height={g.cell} fill={fillOf(c.fill)} />{/if}
  {/each}
  <g fill="none" stroke="#111" stroke-linecap="square">
    {#each { length: g.n - 1 } as _, i (i)}
      <line x1={g.x + (i + 1) * g.cell} y1={g.y} x2={g.x + (i + 1) * g.cell} y2={g.y + side} stroke-width="1.5" />
      <line x1={g.x} y1={g.y + (i + 1) * g.cell} x2={g.x + side} y2={g.y + (i + 1) * g.cell} stroke-width="1.5" />
    {/each}
    <rect x={g.x} y={g.y} width={side} height={side} stroke-width="2.5" />
  </g>
  {#each layout.cells as c (c.row * g.n + c.column)}
    {#each c.lines as line, i (i)}<RichText {line} halo={patterned(c.fill)} />{/each}
  {/each}

  {#each layout.text as line, i (i)}<RichText {line} />{/each}
  {#each layout.blanks as b, i (i)}
    <line x1={b.x1} y1={b.y} x2={b.x2} y2={b.y} stroke="#111" stroke-width="1.3" />
  {/each}

  {#each layout.key as entry, i (i)}
    <rect x={entry.x} y={entry.y} width={entry.size} height={entry.size} fill={fillOf(entry.fill)} stroke="#111" stroke-width="1.3" />
    <RichText line={entry.label} />
  {/each}
</FigureFrame>
