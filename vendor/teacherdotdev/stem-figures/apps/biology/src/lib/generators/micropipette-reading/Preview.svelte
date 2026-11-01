<script lang="ts">
  // Micropipette Reading's picture on the directory: its default figure,
  // drawn by the same code the generator uses.
  import PipetteFigure from './PipetteFigure.svelte'
  import { pipetteSettings } from './settings'
</script>

<PipetteFigure settings={pipetteSettings.defaults} />
