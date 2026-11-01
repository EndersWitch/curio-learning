<svelte:options namespace="svg" />

<script lang="ts">
  // A round watermelon slice seen face-on: dark striped rind, lighter green layer, a pale
  // band, then red flesh with a few faint juicy streaks. No seeds: the seeds are the toppings.
  let { shine = false }: { shine?: boolean } = $props()
</script>

<circle cx="200" cy="200" r="186" fill="#2e7d32" />
<g fill="none" stroke="#1d5a24" stroke-width="10">
  <path d="M380.3 215.8A181 181 0 0 1 374.0 249.9" />
  <path d="M355.6 292.4A181 181 0 0 1 335.1 320.4" />
  <path d="M300.1 350.8A181 181 0 0 1 269.5 367.1" />
  <path d="M224.7 379.3A181 181 0 0 1 190.1 380.7" />
  <path d="M144.5 372.3A181 181 0 0 1 112.6 358.5" />
  <path d="M75.2 331.1A181 181 0 0 1 52.5 304.9" />
  <path d="M30.7 264.0A181 181 0 0 1 21.6 230.5" />
  <path d="M19.7 184.2A181 181 0 0 1 26.0 150.1" />
  <path d="M44.4 107.6A181 181 0 0 1 64.9 79.6" />
  <path d="M99.9 49.2A181 181 0 0 1 130.5 32.9" />
  <path d="M175.3 20.7A181 181 0 0 1 209.9 19.3" />
  <path d="M255.5 27.7A181 181 0 0 1 287.4 41.5" />
  <path d="M324.8 68.9A181 181 0 0 1 347.5 95.1" />
  <path d="M369.3 136.0A181 181 0 0 1 378.4 169.5" />
</g>
<circle cx="200" cy="200" r="176" fill="#8bc34a" />
<circle cx="200" cy="200" r="168" fill="#eaf5c8" />
<!-- Rim shadow: the lower-right crescent between the rind and a circle nudged up-left. -->
<path fill="#2b2b3a" opacity="0.16" d="M268.61 27.12A186 186 0 1 1 16.27 228.98A180 180 0 1 0 268.61 27.12Z" />
<circle cx="203" cy="206" r="159" fill="#2b2b3a" opacity="0.16" />
<circle cx="200" cy="200" r="159" fill="#ef4b4b" class="frosting" />
<g fill="#ff8077" opacity="0.3">
  <ellipse cx="134.9" cy="145.4" rx="55" ry="8" transform="rotate(-140 134.9 145.4)" />
  <ellipse cx="273.7" cy="148.4" rx="52" ry="8" transform="rotate(-35 273.7 148.4)" />
  <ellipse cx="254.6" cy="265.1" rx="55" ry="8" transform="rotate(50 254.6 265.1)" />
  <ellipse cx="126.3" cy="251.6" rx="50" ry="8" transform="rotate(145 126.3 251.6)" />
</g>
<g fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 13 : 10} opacity={shine ? 0.55 : 0.4}>
  <path d="M25.2 153.2A181 181 0 0 1 144.1 27.9" />
  <path d="M43.2 290.5A181 181 0 0 1 25.2 246.8" />
</g>
