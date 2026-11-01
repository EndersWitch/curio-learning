<svelte:options namespace="svg" />

<script lang="ts">
  // One chocolate chip from above: a chunky dark drop with a soft point and a glint.
  // It looks right at any turn, so `toward` is not needed.
  let { rotation = 0 }: { rotation?: number; toward?: number } = $props()
</script>

<g transform={`translate(1 2.5) rotate(${rotation})`}><path d="M0 -9.4C3 -6.1 8.1 -2.5 8.1 1.4A8.1 8.1 0 0 1 -8.1 1.4C-8.1 -2.5 -3 -6.1 0 -9.4Z" fill="#2b2b3a" opacity="0.22" /></g>
<g transform={`rotate(${rotation})`}>
  <path d="M0 -9.4C3 -6.1 8.1 -2.5 8.1 1.4A8.1 8.1 0 0 1 -8.1 1.4C-8.1 -2.5 -3 -6.1 0 -9.4Z" fill="#4a2a17" />
  <path d="M-4.7 -0.3C-4.3 -2.7 -2.8 -4.6 -1.3 -6" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity="0.6" />
</g>
