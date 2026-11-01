<script lang="ts">
  // The Parallel Lines and Transversal Generator's picture on the directory:
  // the figure it opens with, drawn by the same code the generator uses.
  import { buildLines } from './layout.js'
  import LinesFigure from './LinesFigure.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const figure = buildLines(cleanSettings(DEFAULT_SETTINGS))
</script>

<LinesFigure {figure} />
