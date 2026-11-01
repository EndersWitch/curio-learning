<script lang="ts">
  // The Angles Generator's page: its search engine details and the generator.
  import { findGenerator } from '$lib/generators/index.js'
  import Generator from '$lib/generators/angles/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/angles')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
