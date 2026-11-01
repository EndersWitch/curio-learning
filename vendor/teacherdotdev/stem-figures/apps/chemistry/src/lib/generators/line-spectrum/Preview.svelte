<script lang="ts">
  // Line Spectrum's picture on the directory: hydrogen, helium and sodium,
  // and an unknown mixture of two of them.
  import SpectrumFigure from './SpectrumFigure.svelte'
  import { spectrumSettings } from './settings'
</script>

<SpectrumFigure settings={spectrumSettings.defaults} id="preview-line-spectrum" />
