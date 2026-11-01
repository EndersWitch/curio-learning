<script lang="ts">
  // Lewis Structures' figures on its directory card: a shaped water molecule
  // and the nitrate ion with its formal charges.
  import SplitPreview from '$lib/shared/SplitPreview.svelte'
  import LewisFigure from './LewisFigure.svelte'
  import { figureOf, lewisSettings } from './settings'

  const water = lewisSettings.tidy({ ...lewisSettings.defaults, shape: 'shaped' })
  const nitrate = lewisSettings.tidy({ ...lewisSettings.defaults, formula: 'NO3-', formalCharges: true })
</script>

{#snippet waterFigure()}<LewisFigure figure={figureOf(water)} />{/snippet}
{#snippet nitrateFigure()}<LewisFigure figure={figureOf(nitrate)} />{/snippet}

<SplitPreview figures={[waterFigure, nitrateFigure]} split="vertical" />
