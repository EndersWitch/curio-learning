<script lang="ts">
  // A 3D shape generator's picture on the directory: the shape it opens with,
  // drawn by the same code the generator uses.
  import { buildShape } from './layout.js'
  import { settingsFor, type Kind } from './settings.js'
  import Shape3D from './Shape3D.svelte'
  import { readShape } from './solve.js'

  let { kind }: { kind: Kind } = $props()

  const figure = $derived.by(() => {
    const { DEFAULT_SETTINGS, cleanSettings } = settingsFor(kind)
    const settings = cleanSettings(DEFAULT_SETTINGS)
    const read = readShape(settings)
    return buildShape(settings, { ...read, values: read.values! }) // every opening shape makes one
  })
</script>

<Shape3D {figure} />
