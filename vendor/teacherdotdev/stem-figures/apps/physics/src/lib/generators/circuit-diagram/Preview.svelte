<script lang="ts">
  // The Circuit Diagram Generator's picture on the directory: its default
  // figure, drawn by the same code the generator uses.
  import CircuitDiagram from './CircuitDiagram.svelte'
  import { circuitSettings } from './settings'
</script>

<CircuitDiagram settings={circuitSettings.defaults} id="preview" />
