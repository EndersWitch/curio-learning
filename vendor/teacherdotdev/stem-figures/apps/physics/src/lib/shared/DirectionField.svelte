<script lang="ts">
  // Which way a vector points, in degrees counterclockwise from the right: a
  // slider and a box, with quick picks for up, down, left and right.
  let { name, value = $bindable() }: { name: string; value: number } = $props()

  const DIRECTIONS = [
    [90, 'Up'],
    [270, 'Down'],
    [180, 'Left'],
    [0, 'Right'],
  ] as const
</script>

<div class="field">
  Direction
  <span class="slider">
    <input type="range" min="0" max="359" bind:value aria-label="{name} direction" />
    <span class="degrees"><input type="number" min="0" max="359" bind:value aria-label="{name} angle in degrees" />°</span>
  </span>
  <div class="segmented" role="group" aria-label="{name} quick directions">
    {#each DIRECTIONS as [angle, label]}
      <button type="button" class:on={value === angle} aria-pressed={value === angle} onclick={() => (value = angle)}>{label}</button>
    {/each}
  </div>
</div>

<style>
  .degrees { display: inline-flex; align-items: center; gap: 0.2rem; color: var(--muted); }
  .degrees input { width: 4.2rem; }
</style>
