<script lang="ts">
  // Mitosis & Meiosis' page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators/index'
  import Generator from '$lib/generators/cell-division/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/cell-division')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
