<script lang="ts">
  import OrbitalDiagram from '$lib/generators/orbital-diagram/OrbitalDiagram.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/orbital-diagram')!
  const copy = copyFor(generator.id)
  const image = '/og/orbital-diagram.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<OrbitalDiagram />
<GeneratorAbout {generator} {copy} />
