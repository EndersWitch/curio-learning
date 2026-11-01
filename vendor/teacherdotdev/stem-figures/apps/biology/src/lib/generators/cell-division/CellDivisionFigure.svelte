<script lang="ts">
  // The Mitosis & Meiosis figure: each phase's cells in its panel, with the
  // chromosome counts and phase name under it, structure labels either side
  // of a single phase, and the maternal and paternal key along the bottom.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import Cell from './Cell.svelte'
  import { EDGE } from './chromosomes'
  import { paletteFor } from './colors'
  import { cellDivisionFigure, textWidth } from './figure'
  import type { CellDivisionSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: CellDivisionSettings; svg?: SVGSVGElement } = $props()

  const figure = $derived(cellDivisionFigure(settings))
  const palette = $derived(paletteFor(settings.ink, settings.cell))
  const fonts = $derived(figure.fonts)
</script>

<FigureFrame
  bind:svg
  width={figure.width}
  height={figure.height}
  label={figure.description}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? figure.answer : ''}
>
  {#each figure.panels as panel, i (i)}
    <g transform="translate({panel.x} {panel.y}) scale({panel.scale})">
      {#each panel.picture.bodies as body, j (j)}
        <Cell {body} {palette} />
      {/each}
    </g>
    {#each panel.counts as count, j (j)}
      <text x={count.x} y={count.y} text-anchor="middle" font-size={fonts.count} fill={palette.ink}>{count.text}</text>
    {/each}
    {#if panel.label}
      {@const l = panel.label}
      {#if l.blank}
        <line x1={l.x - l.width / 2} y1={l.y} x2={l.x + l.width / 2} y2={l.y} stroke={palette.ink} stroke-width="1.3" />
      {:else}
        <text x={l.x} y={l.y} text-anchor="middle" font-size={fonts.phase} font-weight="700" fill={palette.ink}>{l.text}</text>
      {/if}
    {/if}
  {/each}

  <!-- Structure labels: leaders start beside the text's middle, or at the blank line's end. -->
  {#each figure.labels as label (label.structure)}
    {@const left = label.side === 'left'}
    {@const w = label.text ? textWidth(label.text, fonts.label) : 96}
    {@const start = label.text ? { x: label.x + (left ? 5 : -5), y: label.y - fonts.label * 0.32 } : { x: label.x, y: label.y }}
    <g stroke={palette.ink} stroke-width="1.1" fill="none">
      {#each label.points as p, j (j)}
        <line x1={start.x} y1={start.y} x2={p.x} y2={p.y} />
      {/each}
    </g>
    {#each label.points as p, j (j)}
      <circle cx={p.x} cy={p.y} r="1.9" fill={palette.ink} />
    {/each}
    {#if label.text}
      <text x={label.x} y={label.y} text-anchor={left ? 'end' : 'start'} font-size={fonts.label} font-weight={label.text.length === 1 ? 700 : 400} fill={palette.ink}>
        {label.text}
      </text>
    {:else}
      <line x1={label.x} y1={label.y} x2={label.x + (left ? -w : w)} y2={label.y} stroke={palette.ink} stroke-width="1.3" />
    {/if}
  {/each}

  {#each figure.key as entry (entry.homolog)}
    <rect
      x={entry.x}
      y={entry.y - 4.5}
      width="34"
      height="9"
      rx="4.5"
      fill={palette.chromatid(0, entry.homolog)}
      stroke={palette.ink}
      stroke-width={EDGE}
    />
    <text x={entry.x + 42} y={entry.y} dominant-baseline="central" font-size={fonts.key} fill={palette.ink}>{entry.name}</text>
  {/each}
</FigureFrame>
