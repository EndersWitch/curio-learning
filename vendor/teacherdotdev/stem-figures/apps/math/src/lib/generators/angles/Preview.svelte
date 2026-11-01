<script lang="ts">
  // The Angles Generator's picture on the directory: the figure it opens
  // with, drawn by the same code the generator uses.
  import LinesFigure from '../parallel-lines/LinesFigure.svelte'
  import { buildAngles } from './layout.js'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const figure = buildAngles(cleanSettings(DEFAULT_SETTINGS))
</script>

<LinesFigure {figure} label="Angles" />
