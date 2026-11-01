<script lang="ts">
  // The Parallel Lines and Transversal Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators/index.js'
  import Generator from '$lib/generators/parallel-lines/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/parallel-lines')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
