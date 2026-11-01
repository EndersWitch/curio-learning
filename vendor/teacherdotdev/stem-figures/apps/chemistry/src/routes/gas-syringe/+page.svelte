<script lang="ts">
  import GasSyringe from '$lib/generators/gas-syringe/GasSyringe.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/gas-syringe')!
  const copy = copyFor(generator.id)
  const image = '/og/gas-syringe.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<GasSyringe />
<GeneratorAbout {generator} {copy} />
