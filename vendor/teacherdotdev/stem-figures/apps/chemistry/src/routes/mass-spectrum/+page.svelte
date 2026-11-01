<script lang="ts">
  import MassSpectrum from '$lib/generators/mass-spectrum/MassSpectrum.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/mass-spectrum')!
  const copy = copyFor(generator.id)
  const image = '/og/mass-spectrum.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<MassSpectrum />
<GeneratorAbout {generator} {copy} />
