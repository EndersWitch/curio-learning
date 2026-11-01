<script lang="ts">
  // A dotted line level with the bottom of the meniscus, from its middle
  // across to the marks, showing students where to read.
  interface Props {
    x1: number
    x2: number
    y: number
    /** size multiplier for the current zoom (see sizeAt) */
    k: number
  }
  let { x1, x2, y, k }: Props = $props()
</script>

<line {x1} {x2} y1={y} y2={y} stroke="#111" stroke-width={1.6 * k} stroke-linecap="round" stroke-dasharray="0 {3.5 * k}" />
