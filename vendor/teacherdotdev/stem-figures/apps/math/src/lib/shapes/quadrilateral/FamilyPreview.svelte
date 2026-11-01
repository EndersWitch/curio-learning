<script lang="ts">
  // A quadrilateral generator's picture on the directory: the quadrilateral it
  // opens with, drawn by the same code the generator uses.
  import ShapeFigure from '$lib/shapes/ShapeFigure.svelte'
  import type { Family } from './family.js'
  import { kindOf } from './kinds.js'
  import { buildQuadrilateral } from './layout.js'
  import { readQuadrilateral } from './settings.js'

  let { family }: { family: Family } = $props()

  const figure = $derived.by(() => {
    const settings = family.cleanSettings(family.DEFAULT_SETTINGS)
    const { shape, given } = readQuadrilateral(settings)
    return buildQuadrilateral(settings, shape!, given) // every opening quadrilateral works out
  })
</script>

<ShapeFigure {figure} label={kindOf(family.opens).name} />
