<script lang="ts">
  // The Punnett Square's picture on the directory: Mendel's Tt × Tt with
  // the tall plants shaded, drawn by the same code the generator uses. The
  // ratios under it would only shrink the square on a card.
  import PunnettFigure from './PunnettFigure.svelte'
  import { punnettSettings } from './settings'

  const sample = { ...punnettSettings.defaults, shade: 'T', genotypeRatio: 'none' as const, phenotypeRatio: 'none' as const }
</script>

<PunnettFigure settings={sample} id="preview" />
