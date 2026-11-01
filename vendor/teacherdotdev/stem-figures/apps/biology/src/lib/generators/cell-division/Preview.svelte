<script lang="ts">
  // Mitosis & Meiosis' picture on the directory: its default figure, the
  // phases of mitosis in order, drawn by the same code the generator uses.
  import CellDivisionFigure from './CellDivisionFigure.svelte'
  import { cellDivisionSettings } from './settings'
</script>

<CellDivisionFigure settings={cellDivisionSettings.defaults} />
