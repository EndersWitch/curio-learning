<script lang="ts">
  import TitrationCurve from '$lib/generators/titration-curve/TitrationCurve.svelte'
  import { findGenerator } from '$lib/generators/index'
  import GeneratorAbout from '$lib/site/GeneratorAbout.svelte'
  import Seo from '$lib/site/Seo.svelte'
  import { copyFor } from '$lib/site/generatorCopy'
  import { generatorJsonLd } from '$lib/site/structuredData'

  const generator = findGenerator('/titration-curve')!
  const copy = copyFor(generator.id)
  const image = '/og/titration-curve.png'
</script>

<Seo
  title="{generator.name} Generator"
  description={generator.description}
  path={generator.path}
  {image}
  imageAlt={copy.imageAlt}
  jsonLd={generatorJsonLd(generator, copy, image)}
/>
<TitrationCurve />
<GeneratorAbout {generator} {copy} />
