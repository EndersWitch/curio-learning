<script lang="ts">
  // The Coil and Magnet Generator's picture on the directory: its default
  // figure, drawn by the same code the generator uses.
  import CoilMagnet from './CoilMagnet.svelte'
  import { coilSettings } from './settings'
</script>

<CoilMagnet settings={coilSettings.defaults} id="preview" />
