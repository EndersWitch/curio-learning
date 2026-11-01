<script lang="ts">
  // The Length Reading Generator's page: its search engine details, the
  // generator (the same one Chemistry Figures has) and its About drawer.
  import { ogImage } from '$lib/examples/examples'
  import { findGenerator } from '$lib/generators/index.js'
  import LengthReading from '$lib/generators/length-reading/LengthReading.svelte'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/length-reading')!
  const copy = copyFor(generator.id)
  const image = ogImage(generator.id)
</script>

<Seo
  title={generator.name}
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<LengthReading />
<GeneratorAbout {generator} {copy} />
