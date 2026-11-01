<script lang="ts">
  import TemperatureReading from '$lib/generators/temperature-reading/TemperatureReading.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/temperature-reading')!
  const copy = copyFor(generator.id)
  const image = '/og/temperature-reading.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<TemperatureReading />
<GeneratorAbout {generator} {copy} />
