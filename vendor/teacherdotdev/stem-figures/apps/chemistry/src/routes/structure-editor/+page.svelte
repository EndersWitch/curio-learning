<script lang="ts">
  import StructureEditor from '$lib/editors/structure-editor/StructureEditor.svelte'
  import { findGenerator } from '$lib/generators/index'
  import Seo from '$lib/site/Seo.svelte'

  const editor = findGenerator('/structure-editor')!
</script>

<Seo title={editor.name} description={editor.description} path={editor.path} />
<StructureEditor name={editor.name} />
