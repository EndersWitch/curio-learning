<script lang="ts">
  import ParticleDiagram from '$lib/generators/particle-diagram/ParticleDiagram.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/particle-diagram')!
  const copy = copyFor(generator.id)
  const image = '/og/particle-diagram.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<ParticleDiagram />
<GeneratorAbout {generator} {copy} />
