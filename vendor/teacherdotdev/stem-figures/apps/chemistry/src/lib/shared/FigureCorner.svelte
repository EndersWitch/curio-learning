<script lang="ts">
  // Tucks the figure inside it into a corner of the space it's given.
  import type { Snippet } from 'svelte'
  import { setFigureAlign, type FigureAlign } from './figureAlign'

  let { align, children }: { align: FigureAlign; children: Snippet } = $props()
  // svelte-ignore state_referenced_locally
  setFigureAlign(align)
</script>

{@render children()}
