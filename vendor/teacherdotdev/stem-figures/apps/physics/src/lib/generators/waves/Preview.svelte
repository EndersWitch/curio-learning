<script lang="ts">
  // The Wave Generator's picture on the directory: its default figure, drawn
  // by the same code the generator uses.
  import Wave from './Wave.svelte'
  import { waveSettings } from './settings'
</script>

<Wave settings={waveSettings.defaults} id="preview" />
