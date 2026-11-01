<svelte:options namespace="svg" />

<script lang="ts">
  // One black watermelon seed: a teardrop whose point faces the melon's centre.
  let { rotation = 0, toward = 0 }: { rotation?: number; toward?: number } = $props()
  const SEED = 'M0 -9C2.7 -5.8 5.5 -1.8 5.5 3.5A5.5 5.5 0 0 1 -5.5 3.5C-5.5 -1.8 -2.7 -5.8 0 -9Z'
  // The point is drawn toward −y; `toward` is measured from +x, so add 90°.
  const turn = $derived(toward + 90 + ((rotation % 20) - 10))
</script>

<g transform="translate(1 2.5)"><g transform={`rotate(${turn})`}><path d={SEED} fill="#2b2b3a" opacity="0.22" /></g></g>
<g transform={`rotate(${turn})`}>
  <path d={SEED} fill="#2a2230" />
  <ellipse cx="-2" cy="2.2" rx="1.2" ry="2.3" fill="#fff" opacity="0.6" />
</g>
