<script lang="ts">
  // The Vector Diagram Generator's picture on the directory: three vectors
  // head to tail on a grid with their dashed resultant, drawn by the same code.
  import { newVector, vectorSettings } from './settings'
  import VectorDiagram from './VectorDiagram.svelte'

  const sample = { ...vectorSettings.defaults, vectors: [newVector(0, 4, 15), newVector(1, 3, 80), newVector(2, 2.5, 160)] }
</script>

<VectorDiagram settings={sample} id="preview" />
