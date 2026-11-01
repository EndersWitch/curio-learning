<script lang="ts">
  // The Regular Polygon Generator's picture on the directory: the hexagon it
  // opens with, drawn by the same code the generator uses.
  import ShapeFigure from '$lib/shapes/ShapeFigure.svelte'
  import { buildPolygon } from './layout.js'
  import { DEFAULT_SETTINGS, cleanSettings, readPolygon } from './settings.js'

  const settings = cleanSettings(DEFAULT_SETTINGS)
  const figure = buildPolygon(settings, readPolygon(settings).polygon!) // the opening polygon always reads
</script>

<ShapeFigure {figure} label="Regular hexagon" />
