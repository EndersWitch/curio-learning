<script lang="ts">
  // The Pulley Generator's picture on the directory: its default figure,
  // drawn by the same code the generator uses.
  import Pulley from './Pulley.svelte'
  import { pulleySettings } from './settings'
</script>

<Pulley settings={pulleySettings.defaults} id="preview" />
