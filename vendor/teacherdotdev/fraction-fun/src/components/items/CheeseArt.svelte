<svelte:options namespace="svg" />

<script lang="ts">
  // A round cheese wheel from above: a pale wax rind round a flat golden face.
  // No holes here: the holes are the toppings.
  let { shine = false }: { shine?: boolean } = $props()
</script>

<!-- Pale wax rind, with the shadow ink on its outer lower right. -->
<circle cx="200" cy="200" r="186" fill="#f5d36a" />
<circle cx="200" cy="200" r="186" fill="#2b2b3a" opacity="0.2" />
<circle cx="196" cy="195" r="179.5" fill="#f5d36a" />
<!-- The face, sitting inside the rind. -->
<circle cx="201.5" cy="203" r="173" fill="#2b2b3a" opacity="0.16" />
<circle cx="200" cy="200" r="172" fill="#ffbb2e" class="frosting" />
<!-- A faint lighter band across the face, then the highlights. -->
<path d="M88 260C120 170 190 112 286 96" fill="none" stroke="#fff" stroke-linecap="round" stroke-width="44" opacity="0.12" />
<path d="M24 168A178 178 0 0 1 112 46" fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 8 : 6} opacity={shine ? 0.65 : 0.5} />
<path d="M66 170C76 132 102 102 136 86" fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 13 : 10} opacity={shine ? 0.5 : 0.35} />
<path d="M300 310C318 292 330 272 336 250" fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 10 : 8} opacity={shine ? 0.3 : 0.2} />
