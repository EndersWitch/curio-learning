<script lang="ts">
  // The Microscope Field of View generator's page: its search engine
  // details and the generator.
  import { findGenerator } from '$lib/generators/index'
  import Generator from '$lib/generators/microscope-field-of-view/Generator.svelte'
  import Seo from '$lib/site/Seo.svelte'

  const generator = findGenerator('/microscope-field-of-view')!
</script>

<Seo title={generator.name} description={generator.description} path={generator.path} />
<Generator />
