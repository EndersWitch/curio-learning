<script lang="ts">
  // A measurement drawn on a figure: a thin line with an arrowhead at each end,
  // like the length of a ramp or its height. Its label is drawn separately.
  import type { Segment } from './vector'

  let { m, color }: { m: Segment; color: string } = $props()

  const HEAD = 9
  const heads = $derived.by(() => {
    const len = Math.hypot(m.x2 - m.x1, m.y2 - m.y1) || 1
    const ux = (m.x2 - m.x1) / len
    const uy = (m.y2 - m.y1) / len
    const head = (x: number, y: number, dir: number) => {
      const bx = x - dir * ux * HEAD
      const by = y - dir * uy * HEAD
      return `${x},${y} ${bx - uy * HEAD * 0.38},${by + ux * HEAD * 0.38} ${bx + uy * HEAD * 0.38},${by - ux * HEAD * 0.38}`
    }
    return [head(m.x1, m.y1, -1), head(m.x2, m.y2, 1)]
  })
</script>

<line x1={m.x1} y1={m.y1} x2={m.x2} y2={m.y2} stroke={color} stroke-width="1.5" />
{#each heads as points}<polygon {points} fill={color} />{/each}
