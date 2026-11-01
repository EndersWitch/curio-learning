<script lang="ts">
  // The Spring Scale Generator's picture on the directory: its default figure
  // with a magnifier, drawn by the same code the generator uses.
  import SpringScaleFigure from './SpringScaleFigure.svelte'
  import { springScaleSettings } from './settings'
</script>

<SpringScaleFigure settings={springScaleSettings.defaults} />
