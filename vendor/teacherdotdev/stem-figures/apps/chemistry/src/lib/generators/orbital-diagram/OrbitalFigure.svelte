<script lang="ts">
  // The Orbital Diagram figure: the symbol on the left, then the noble gas
  // core and each sublevel's orbitals with their electrons as arrows, labeled
  // under them, in rows or stacked by energy, and the configuration line
  // under it all. It draws whatever
  // diagram it's given, right or wrong.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import type { OrbitalFill } from './diagram'
  import {
    CONFIG_SIZE,
    CORE_SIZE,
    LABEL_BASELINE,
    LABEL_SIZE,
    ORBITAL,
    SUPERSCRIPT,
    SYMBOL_SIZE,
    labelBlankWidth,
    layoutFigure,
    orbitalOffsets,
    type Run,
  } from './layout'
  import { answerLines, configRuns, drawnDiagram, figureLabel, symbolRuns, type OrbitalSettings } from './settings'

  let { settings: s, svg = $bindable() }: { settings: OrbitalSettings; svg?: SVGSVGElement } = $props()

  const diagram = $derived(drawnDiagram(s))
  const answer = $derived(s.answerKey ? answerLines(s) : [])
  const layout = $derived(
    layoutFigure(diagram, {
      style: s.orbitals,
      arrangement: s.arrangement,
      labels: s.labels,
      symbol: s.symbol,
      symbolRuns: symbolRuns(s),
      configLine: s.configLine,
      configRuns: configRuns(s),
      answer,
    }),
  )
  const orbitalsOf = $derived(Object.fromEntries(diagram.sublevels.map((sub) => [sub.name, sub.orbitals])))

  const INK = '#111'
  const STROKE = 2
  const TIP = 6
  const HEAD = 7

  /** An electron's arrow at `x` inside an orbital: up or down, with a full
   *  head or a half head (the barb on the left going up, the right going down). */
  function arrow(x: number, spin: string) {
    const top = TIP
    const bottom = ORBITAL - TIP
    const [from, to, back] = spin === 'u' ? [bottom, top, HEAD] : [top, bottom, -HEAD]
    const shaft = `M${x} ${from}L${x} ${to}`
    if (s.arrows === 'half') return `${shaft}L${x + (spin === 'u' ? -1 : 1) * (HEAD - 2)} ${to + back}`
    return `${shaft}M${x - (HEAD - 2)} ${to + back}L${x} ${to}L${x + HEAD - 2} ${to + back}`
  }

  /** The arrows in one orbital: a lone electron in the middle, two side by
   *  side. An up and down pair with half heads sits closer, since both barbs
   *  point out; any other pair has a barb pointing at the other arrow. */
  function arrows(fill: OrbitalFill) {
    if (fill.length === 1) return [arrow(ORBITAL / 2, fill)]
    const out = s.arrows === 'half' && fill === 'ud' ? 0.1 : 0.18
    return [...fill].map((spin, i) => arrow(ORBITAL * (0.5 + (i ? out : -out)), spin))
  }
</script>

<!-- one line, so no spaces creep in between the pieces -->
{#snippet runs(list: Run[], size: number)}{#each list as run, i (i)}<tspan font-size={run.sup ? size * SUPERSCRIPT : size} dy={run.sup ? -size * 0.38 : i > 0 && list[i - 1].sup ? size * 0.38 : 0}>{run.text}</tspan>{/each}{/snippet}

<FigureFrame
  bind:svg
  width={layout.width}
  height={layout.height}
  label={figureLabel(s)}
  title={s.titleMode === 'text' ? s.title : ''}
  answerKey={answer.join('\n')}
>
  {#if layout.symbol}
    {#if s.symbol === 'text'}
      <text x={layout.symbol.x} y={layout.symbol.y} font-weight="700" fill={INK}>{@render runs(symbolRuns(s), SYMBOL_SIZE)}</text>
    {:else}
      <line x1={layout.symbol.x} x2={layout.symbol.x + layout.symbol.width} y1={layout.symbol.y + 2} y2={layout.symbol.y + 2} stroke={INK} stroke-width="1.5" />
    {/if}
  {/if}
  {#if layout.core && diagram.core}
    <text x={layout.core.x} y={layout.core.y + ORBITAL / 2 + CORE_SIZE * 0.36} font-size={CORE_SIZE} fill={INK}>[{diagram.core}]</text>
  {/if}
  {#each layout.sublevels as sub (sub.name)}
    {@const offsets = orbitalOffsets(orbitalsOf[sub.name].length, s.orbitals)}
    <g transform="translate({sub.x} {sub.y})">
      {#each orbitalsOf[sub.name] as fill, i (i)}
        <g transform="translate({offsets[i]} 0)">
          {#if s.orbitals === 'squares'}
            <rect x="0" y="0" width={ORBITAL} height={ORBITAL} fill="none" stroke={INK} stroke-width="1.5" />
          {:else}
            <line x1="0" x2={ORBITAL} y1={ORBITAL} y2={ORBITAL} stroke={INK} stroke-width="2" />
          {/if}
          {#each arrows(fill) as d, j (j)}
            <path {d} fill="none" stroke={INK} stroke-width={STROKE} stroke-linecap="round" stroke-linejoin="round" />
          {/each}
        </g>
      {/each}
      {#if s.labels === 'text'}
        <text x={sub.width / 2} y={LABEL_BASELINE} text-anchor="middle" font-size={LABEL_SIZE} fill={INK}>{sub.name}</text>
      {:else if s.labels === 'blank'}
        {@const w = labelBlankWidth(sub.width)}
        <line x1={(sub.width - w) / 2} x2={(sub.width + w) / 2} y1={LABEL_BASELINE + 2} y2={LABEL_BASELINE + 2} stroke={INK} stroke-width="1.2" />
      {/if}
    </g>
  {/each}
  {#if layout.config}
    {#if s.configLine === 'text'}
      <text x={layout.config.x} y={layout.config.y} fill={INK}>{@render runs(configRuns(s), CONFIG_SIZE)}</text>
    {:else}
      <line x1={layout.config.x} x2={layout.config.x + layout.config.width} y1={layout.config.y + 2} y2={layout.config.y + 2} stroke={INK} stroke-width="1.2" />
    {/if}
  {/if}
</FigureFrame>
