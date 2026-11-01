<script lang="ts">
  // Gel Electrophoresis' picture on the directory: its default figure, a
  // crime scene's DNA beside three suspects', drawn by the same code the
  // generator uses.
  import GelFigure from './GelFigure.svelte'
  import { gelSettings } from './settings'
</script>

<GelFigure settings={gelSettings.defaults} />
