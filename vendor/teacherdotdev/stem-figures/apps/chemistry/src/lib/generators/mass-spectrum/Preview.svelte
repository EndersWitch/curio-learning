<script lang="ts">
  // Mass Spectrum's picture on the directory: magnesium's three isotopes,
  // each with its abundance, with large labels so they read at the card's size.
  import MassSpectrumFigure from './MassSpectrumFigure.svelte'
  import { massSpectrumSettings } from './settings'

  const settings = massSpectrumSettings.tidy({ ...massSpectrumSettings.defaults, labelSize: 'large' })
</script>

<MassSpectrumFigure {settings} id="preview-mass-spectrum" />
