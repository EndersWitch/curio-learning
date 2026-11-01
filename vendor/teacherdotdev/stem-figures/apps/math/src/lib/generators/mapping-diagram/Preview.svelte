<script lang="ts">
  // The Mapping Diagram Generator's picture on the directory: y = x² on a few
  // inputs, drawn by the same code the generator uses.
  import MappingDiagram from './MappingDiagram.svelte'
  import { DEFAULT_SETTINGS, cleanSettings } from './settings.js'

  const square = (x: string) => String(Number(x.replace('−', '-')) ** 2)
  const inputs = ['−2', '−1', '0', '1', '2']
  const settings = cleanSettings({
    ...DEFAULT_SETTINGS,
    inputs: inputs.join(', '),
    outputs: '0, 1, 4',
    arrows: inputs.map((x) => ({ from: x, to: square(x) })),
  })
</script>

<MappingDiagram {settings} id="preview-mapping-diagram" />
