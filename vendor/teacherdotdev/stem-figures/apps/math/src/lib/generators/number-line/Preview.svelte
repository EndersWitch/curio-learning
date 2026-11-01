<script lang="ts">
  // The Number Line Generator's picture on the directory: a real number line,
  // drawn by the same code the generator uses.
  import NumberLine from './NumberLine.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const settings = cleanSettings({ ...DEFAULT_SETTINGS, from: '-5', to: '5', equations: ['-2 < x <= 3'] })
</script>

<NumberLine {settings} id="preview-number-line" />
