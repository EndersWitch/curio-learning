<script lang="ts">
  // The Box Plot Generator's picture on the directory: a real box plot,
  // drawn by the same code the generator uses.
  import BoxPlot from './BoxPlot.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const settings = cleanSettings({ ...DEFAULT_SETTINGS, rows: [{ text: '11, 14, 15, 18, 20, 21, 24, 27, 30, 35, 42' }] })
</script>

<BoxPlot {settings} id="preview-box-plot" />
