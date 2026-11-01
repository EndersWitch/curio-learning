<script lang="ts">
  import HeatingCoolingCurve from '$lib/generators/heating-cooling-curve/HeatingCoolingCurve.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/heating-cooling-curve')!
  const copy = copyFor(generator.id)
  const image = '/og/heating-cooling-curve.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<HeatingCoolingCurve />
<GeneratorAbout {generator} {copy} />
