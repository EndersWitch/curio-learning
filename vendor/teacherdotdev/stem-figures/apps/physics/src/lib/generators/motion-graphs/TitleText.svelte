<script lang="ts">
  // A title on a graph, in the grid's bold sans serif, with the subscripts and
  // superscripts a physics label can have: "Acceleration (m/s^2)" is drawn
  // with a raised 2. Turned to read upward with `rotate`.
  import { SANS } from '$shared/graph/grid'
  import { labelRuns } from '$lib/shared/label'
  import type { Title } from './figure'

  let { title: t, size, color }: { title: Title; size: number; color: string } = $props()

  const SMALL = 0.7
  // How far a subscript drops and a superscript rises, as FigureLabel sets them.
  const DROP = { sub: 0.3, super: -0.45 } as const

  // Each run moves off the baseline and back again, so the dy values chain.
  const spans = $derived.by(() => {
    let offset = 0
    return labelRuns(t.text).map((run) => {
      const target = run.shift ? DROP[run.shift] * size : 0
      const dy = target - offset
      offset = target
      return { ...run, dy }
    })
  })
</script>

<text
  x={t.x}
  y={t.y}
  text-anchor={t.anchor}
  dominant-baseline={t.rotate ? 'central' : undefined}
  transform={t.rotate ? `rotate(-90 ${t.x} ${t.y})` : undefined}
  font-family={SANS}
  font-size={size}
  font-weight="bold"
  fill={color}
>
  {#each spans as s}<tspan dy={s.dy || undefined} font-size={s.shift ? size * SMALL : undefined}>{s.text}</tspan>{/each}
</text>
