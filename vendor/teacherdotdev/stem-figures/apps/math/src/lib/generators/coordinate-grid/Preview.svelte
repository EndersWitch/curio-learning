<script lang="ts">
  // The Coordinate Grid Generator's picture on the directory: a real grid,
  // drawn by the same code the generator uses.
  import Graph from './Graph.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const settings = cleanSettings({ ...DEFAULT_SETTINGS, xFrom: '-6', xTo: '6', yFrom: '-6', yTo: '6', xEvery: 2, yEvery: 2 })
</script>

<Graph {settings} id="preview-coordinate-grid" />
