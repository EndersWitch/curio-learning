<script lang="ts">
  // An Object drawn around its bottom middle, standing up (−y). Place and tilt
  // it with a transform on a surrounding <g>.
  import { objectHeight, objectWidth, type ObjectKind } from './objects'

  let { kind, size, fill, stroke }: { kind: ObjectKind; size: number; fill: string; stroke: string } = $props()

  const h = $derived(objectHeight(kind, size))
  const w = $derived(objectWidth(kind, size))
  const wheel = $derived(h * 0.19)
</script>

{#if kind === 'block'}
  <rect x={-w / 2} y={-h} width={w} height={h} rx="2" {fill} {stroke} stroke-width="2.5" />
{:else if kind === 'ball'}
  <circle cx="0" cy={-h / 2} r={h / 2} {fill} {stroke} stroke-width="2.5" />
{:else}
  <rect x={-w / 2} y={-h} width={w} height={h - wheel * 1.4} rx="4" {fill} {stroke} stroke-width="2.5" />
  {#each [-1, 1] as side}
    <circle cx={side * w * 0.3} cy={-wheel} r={wheel} fill="#fff" {stroke} stroke-width="2.5" />
  {/each}
{/if}
