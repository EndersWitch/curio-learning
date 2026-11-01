<script lang="ts">
  // Volume by Displacement's figure on its directory card.
  import DisplacementFigure from './DisplacementFigure.svelte'
  import { displacementSettings } from './settings'
</script>

<DisplacementFigure settings={displacementSettings.defaults} />
