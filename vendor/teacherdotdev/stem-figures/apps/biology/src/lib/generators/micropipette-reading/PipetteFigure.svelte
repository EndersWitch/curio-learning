<script lang="ts">
  // The Micropipette Reading figure for a set of settings: the pipette, with
  // its parts labeled on its left if asked.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import Pipette from './Pipette.svelte'
  import { LABELS, PART_NAMES, anchorOf, partsShown, pipetteLayout, spreadLabels } from './layout'
  import { pipette, volumeText } from './pipette'
  import { digitsText, underLine, type PipetteSettings } from './settings'

  let { settings, svg = $bindable() }: { settings: PipetteSettings; svg?: SVGSVGElement } = $props()

  const p = $derived(pipette(settings.model))
  const at = $derived(pipetteLayout(p, settings.tip))
  const labeled = $derived(settings.parts !== 'none')
  /** where the pipette starts: right of its labels, when they're drawn */
  const shift = $derived(labeled ? LABELS.width : 0)
  const width = $derived(shift + at.width)

  // Labels on the left, each level with its part where there's room, its
  // line running to the part's left edge.
  const textRight = LABELS.width - 30
  const labels = $derived.by(() => {
    if (!labeled) return []
    const parts = partsShown(at)
    const anchors = parts.map((part) => anchorOf(at, part))
    const ys = spreadLabels(anchors.map((a) => a.y), LABELS.gap, 10, at.height - 6)
    return parts.map((part, i) => ({ part, y: ys[i], to: { x: shift + anchors[i].x - 2, y: anchors[i].y } }))
  })

  const label = $derived(`A ${p.name} micropipette set to ${volumeText(p, settings.volume)}: its volume display reads ${digitsText(settings)}, top to bottom`)
</script>

<FigureFrame
  bind:svg
  {width}
  height={at.height}
  {label}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={underLine(settings)}
>
  <g transform="translate({shift} 0)">
    <Pipette {p} {at} volume={settings.volume} color={settings.color} decimalLine={settings.decimalLine} showModel={settings.showModel} />
  </g>
  {#each labels as l (l.part)}
    {#if settings.parts === 'names'}
      <text x={textRight} y={l.y} dy="0.35em" text-anchor="end" font-size={LABELS.font} fill="#111">{PART_NAMES[l.part]}</text>
      <line x1={textRight + 6} y1={l.y} x2={l.to.x} y2={l.to.y} stroke="#111" stroke-width="1.2" />
    {:else}
      <line x1={textRight - 118} y1={l.y + 7} x2={textRight} y2={l.y + 7} stroke="#111" stroke-width="1.2" />
      <line x1={textRight} y1={l.y + 7} x2={l.to.x} y2={l.to.y} stroke="#111" stroke-width="1.2" />
    {/if}
    <circle cx={l.to.x} cy={l.to.y} r="1.8" fill="#111" />
  {/each}
</FigureFrame>
