<script lang="ts">
  import VolumeByDisplacement from '$lib/generators/volume-by-displacement/VolumeByDisplacement.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/volume-by-displacement')!
  const copy = copyFor(generator.id)
  const image = '/og/volume-by-displacement.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<VolumeByDisplacement />
<GeneratorAbout {generator} {copy} />
