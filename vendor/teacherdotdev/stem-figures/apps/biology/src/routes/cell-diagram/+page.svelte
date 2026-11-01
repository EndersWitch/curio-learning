<script lang="ts">
  // The Cell Diagram's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators/index'
  import Generator from '$lib/generators/cell-diagram/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/cell-diagram')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
