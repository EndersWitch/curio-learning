<script lang="ts">
  // Pedigree's figure on its directory card: its default random family.
  import PedigreeFigure from './PedigreeFigure.svelte'
  import { familyOf, pedigreeSettings } from './settings'

  const settings = pedigreeSettings.defaults
</script>

<PedigreeFigure {settings} family={familyOf(settings)} />
