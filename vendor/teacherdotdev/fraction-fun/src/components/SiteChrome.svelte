<!--
  The teacher.dev finishing touches, fixed in the corners so they never take room
  from the activity: the teacher.dev menu (credit, About, Privacy) top left, and
  help bottom left. On a scrolling page they scroll away with it instead.
-->
<script lang="ts">
  import BrandMenu from './BrandMenu.svelte'
  import HelpButton from './HelpButton.svelte'

  let { scrolls = false }: { scrolls?: boolean } = $props()
</script>

<BrandMenu {scrolls} />
<HelpButton {scrolls} />
