<script lang="ts">
  // The Inclined Plane Generator's picture on the directory: its default
  // figure, drawn by the same code the generator uses.
  import Incline from './Incline.svelte'
  import { inclineSettings } from './settings'
</script>

<Incline settings={inclineSettings.defaults} id="preview" />
