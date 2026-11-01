<script lang="ts">
  // The Vector Diagram figure, as a self-contained SVG that prints crisply
  // and exports cleanly. Mirror is applied to the angles (see vd.ts), so
  // nothing here is flipped and every label reads normally.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { palette } from '$lib/shared/figure'
  import { LABEL_SIZE } from '$lib/shared/layout'
  import { arrow, type Segment } from '$lib/shared/vector'
  import type { VectorSettings } from './settings'
  import { buildVectorDiagram } from './vd'

  let { settings, id = 'v' }: { settings: VectorSettings; id?: string } = $props()

  const fig = $derived(buildVectorDiagram(settings))
  const p = $derived(palette(settings.color))
  const baseline = LABEL_SIZE * 0.35
  const GRID = '#d1d5db'

  // An axis has a head at each end, and its line stops inside both so each head comes to a sharp point.
  const AXIS_HEAD = 11
  function axisArrow(a: Segment) {
    const ahead = arrow(a, AXIS_HEAD)
    const back = arrow({ x1: a.x2, y1: a.y2, x2: a.x1, y2: a.y1 }, AXIS_HEAD)
    return { line: { x1: back.shaft.x2, y1: back.shaft.y2, x2: ahead.shaft.x2, y2: ahead.shaft.y2 }, heads: [ahead.head, back.head] }
  }
  const axes = $derived(fig.axes ? [axisArrow(fig.axes.x), axisArrow(fig.axes.y)] : [])
  const points = (head: { x: number; y: number }[]) => head.map((q) => `${q.x},${q.y}`).join(' ')

  const description = $derived(
    `A vector diagram of ${settings.vectors.length} vector${settings.vectors.length === 1 ? '' : 's'} added head to tail${settings.grid ? ' on a grid' : ''}`,
  )
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-vector-diagram"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />

  {#each fig.grid as g}<line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={GRID} stroke-width="1" />{/each}

  {#each axes as a}
    <line x1={a.line.x1} y1={a.line.y1} x2={a.line.x2} y2={a.line.y2} stroke={p.ink} stroke-width="1.5" />
    {#each a.heads as head}<polygon points={points(head)} fill={p.ink} />{/each}
  {/each}

  {#each fig.components as c}
    <VectorArrow v={c.x} color={p.component} style="component" halo={false} />
    <VectorArrow v={c.y} color={p.component} style="component" halo={false} />
  {/each}

  {#each fig.marks as m}
    {#if m.ref.x1 !== m.ref.x2 || m.ref.y1 !== m.ref.y2}
      <line x1={m.ref.x1} y1={m.ref.y1} x2={m.ref.x2} y2={m.ref.y2} stroke={p.ink} stroke-width="1.3" stroke-dasharray="6 4" />
    {/if}
    <path
      d="M{m.arc.from.x},{m.arc.from.y} A{m.arc.r},{m.arc.r} 0 0 {m.arc.sweep} {m.arc.to.x},{m.arc.to.y}"
      fill="none"
      stroke={p.ink}
      stroke-width="1.5"
    />
  {/each}

  <!-- No white outline: one arrow's would cut into the head of the arrow before it. -->
  {#each fig.arrows as a}<VectorArrow v={a.v} color={p.vector} style={a.style === 'dashed' ? 'motion' : 'force'} halo={false} />{/each}

  {#if fig.axes}
    <FigureLabel label={{ mode: 'text', text: 'x' }} x={fig.axes.xLabelAt.x} y={fig.axes.xLabelAt.y + baseline} size={LABEL_SIZE} color={p.ink} />
    <FigureLabel label={{ mode: 'text', text: 'y' }} x={fig.axes.yLabelAt.x} y={fig.axes.yLabelAt.y + baseline} size={LABEL_SIZE} color={p.ink} />
  {/if}
  {#each fig.marks as m}
    <FigureLabel label={m.label} x={m.labelAt.x} y={m.labelAt.y + baseline} size={LABEL_SIZE} color={p.ink} />
  {/each}
  {#each fig.components as c}
    <FigureLabel label={c.xLabel} x={c.xLabelAt.x} y={c.xLabelAt.y + baseline} size={LABEL_SIZE} color={p.component} />
    <FigureLabel label={c.yLabel} x={c.yLabelAt.x} y={c.yLabelAt.y + baseline} size={LABEL_SIZE} color={p.component} />
  {/each}
  {#each fig.arrows as a}
    <FigureLabel label={a.label} x={a.labelAt.x} y={a.labelAt.y + baseline} size={LABEL_SIZE} color={p.vector} />
  {/each}
</svg>
