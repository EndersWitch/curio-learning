<script lang="ts">
  // A magnifier: `scene` drawn again, enlarged so the `source` circle of it
  // fills the `target` circle. With `marked`, the source circle is outlined
  // on the drawing (drawn with its top left at `origin`) and joined to the
  // magnifier by two lines. `scene(zoom)` draws the instrument in its own
  // units at that magnification.
  import type { Snippet } from 'svelte'
  import { outerTangents, type Circle } from './magnify'

  interface Props {
    source: Circle
    target: Circle
    marked: boolean
    origin?: { x: number; y: number }
    scene: Snippet<[number]>
  }
  let { source, target, marked, origin = { x: 0, y: 0 }, scene }: Props = $props()
  const clipId = $props.id()

  const zoom = $derived(target.r / source.r)
  const onDrawing = $derived({ x: source.x + origin.x, y: source.y + origin.y, r: source.r })
  const lines = $derived(marked ? outerTangents(onDrawing, target) : [])
</script>

{#if marked}
  <circle cx={onDrawing.x} cy={onDrawing.y} r={source.r} fill="none" stroke="#111" stroke-width="1.5" />
  {#each lines as [x1, y1, x2, y2]}
    <line {x1} {y1} {x2} {y2} stroke="#111" stroke-width="1.2" stroke-dasharray="5 4" />
  {/each}
{/if}
<clipPath id={clipId}><circle cx={target.x} cy={target.y} r={target.r} /></clipPath>
<g clip-path="url(#{clipId})">
  <circle cx={target.x} cy={target.y} r={target.r} fill="#fff" />
  <g transform="translate({target.x} {target.y}) scale({zoom}) translate({-source.x} {-source.y})">
    {@render scene(zoom)}
  </g>
</g>
<circle cx={target.x} cy={target.y} r={target.r} fill="none" stroke="#111" stroke-width="3" />
