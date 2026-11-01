<script lang="ts">
  // Photoelectron Spectrum's figure on its directory card: sodium, with large
  // labels so they read at the card's size.
  import PesFigure from './PesFigure.svelte'
  import { pesSettings } from './settings'

  const settings = pesSettings.tidy({ ...pesSettings.defaults, labelSize: 'large' })
</script>

<PesFigure {settings} />
