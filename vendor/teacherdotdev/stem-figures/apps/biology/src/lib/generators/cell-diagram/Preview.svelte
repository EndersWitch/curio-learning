<script lang="ts">
  // Cell Diagram's figure on its directory card: the default animal cell,
  // labeled.
  import CellFigure from './CellFigure.svelte'
  import { cellSettings } from './settings'
</script>

<CellFigure settings={cellSettings.defaults} />
