<script lang="ts">
  // The Lewis Structures figure: the structure or its resonance structures in
  // a row, with the chart title above and the answer key under it. With `onselect`, the structure's atoms and bonds can be
  // clicked to pick them for changing.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import StructureDrawing from './StructureDrawing.svelte'
  import { KEY_FONT, layoutFigure, type Row, type Selection } from './figureLayout'
  import type { Figure } from './settings'

  interface Props {
    figure: Figure
    svg?: SVGSVGElement
    selected?: Selection | null
    /** bumped to flash the selection again */
    flash?: number
    onselect?: (selection: Selection) => void
  }
  let { figure, svg = $bindable(), selected = null, flash = 0, onselect }: Props = $props()

  const INK = '#111'
  // As drawn: a changed structure is always one structure in full.
  const settings = $derived(figure.settings)
  const layout = $derived(layoutFigure(settings, figure))
  const SCAFFOLD_WORDS = { full: '', bonds: ', with bonds but no lone electrons', skeleton: ', atoms only' }

  const label = $derived.by(() => {
    const r = figure.resolved
    if (!r.ok) return 'No Lewis structure'
    const alone = r.formula.atoms.length === 1
    const key =
      figure.key.kind === 'mistakes'
        ? `. Mistakes: ${figure.key.mistakes.join(' ') || 'none'}`
        : figure.key.kind === 'structures'
          ? `, with its ${alone ? 'electrons' : 'full structure'} as the answer key`
          : ''
    if (alone) return `A Lewis dot diagram of ${r.name}${settings.scaffold === 'skeleton' ? ', without its electrons' : ''}${key}`
    const what = figure.shown.length > 1 ? `The ${figure.shown.length} resonance structures of ${r.name}` : `A Lewis structure of ${r.name}`
    const dots = settings.bondStyle === 'dots' && settings.scaffold !== 'skeleton' ? ', with bonds drawn as dots' : ''
    return what + SCAFFOLD_WORDS[settings.scaffold] + dots + key
  })
</script>

{#snippet row(r: Row, pick?: (selection: Selection) => void)}
  {#each r.drawings as d, i (i)}
    <g transform="translate({d.x} {d.y})">
      <StructureDrawing drawing={d.item} selected={pick ? selected : null} {flash} onselect={pick} />
    </g>
  {/each}
  {#each r.arrows as a, i (i)}
    <text x={a.x} y={a.y} dy="0.35em" text-anchor="middle" font-size="26" fill={INK}>⟷</text>
  {/each}
{/snippet}

<FigureFrame bind:svg width={layout.width} height={layout.height} {label} title={settings.titleMode === 'text' ? settings.title : ''}>
  {#if layout.main.kind === 'row'}
    <g transform="translate({layout.main.x} 0)">{@render row(layout.main.row, onselect)}</g>
  {:else}
    <text x={layout.width / 2} y={layout.height / 2} dy="0.35em" text-anchor="middle" font-size="16" fill="#666">No structure to draw</text>
  {/if}
  {#if layout.key}
    {@const key = layout.key}
    <text x={key.heading.x} y={key.heading.y} text-anchor={key.lines ? 'start' : 'middle'} font-size={KEY_FONT} font-weight="700" fill={INK}>
      {key.lines ? 'Mistakes' : 'Answer'}
    </text>
    {#if key.row}
      <g transform="translate({key.row.x} {key.row.y})">{@render row(key.row.row)}</g>
    {/if}
    {#each key.lines ?? [] as l, i (i)}
      <text x={l.x} y={l.y} font-size={KEY_FONT} fill={INK} xml:space="preserve">{l.text}</text>
    {/each}
  {/if}
</FigureFrame>
