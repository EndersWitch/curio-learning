<svelte:options namespace="svg" />

<script lang="ts">
  // A cheese hole: a dent, so no drop shadow. Light comes from the upper left, so the
  // upper-left inner wall is in shadow and a pale lip shows on the lower right.
  // `rotation` (random per hole) picks the hole's size, radius 8–10.5, so the holes vary
  // like Swiss cheese; a round hole lit from a fixed side doesn't otherwise turn.
  let { rotation = 0 }: { rotation?: number; toward?: number } = $props()
  const radius = $derived(8 + (((Math.round(rotation) % 6) + 6) % 6) * 0.5)
</script>

<g transform={`scale(${radius / 10.5})`}>
  <circle r="10.5" fill="#fff0c4" />
  <circle cx="-0.5" cy="-0.5" r="9.5" fill="#cc7a0a" />
  <path d="M-6.8 6.6A9.5 9.5 0 1 1 7.8 -5.1A9.5 9.5 0 0 0 -6.8 6.6Z" fill="#2b2b3a" opacity="0.5" />
</g>
