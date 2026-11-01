<script lang="ts">
  // How one end of a line finishes, picked the way Figma picks end points: a
  // small button showing the end as it's drawn, with a chevron, that opens a
  // list of every cap. `side` says which end it is, so the cap is drawn at
  // the left (start) or right (end) of its picture.
  import { ChevronDown } from '@lucide/svelte'
  import { CAPS, type Cap } from './settings.js'

  let { value = $bindable(), side, label }: { value: Cap; side: 'start' | 'end'; label: string } = $props()

  let open = $state(false)
  let root = $state<HTMLElement>()
  const choose = (cap: Cap) => ((value = cap), (open = false))
  function onpointerdown(event: PointerEvent) {
    if (open && !root?.contains(event.target as Node)) open = false
  }
  function onkeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      event.stopPropagation()
      open = false
    }
  }
</script>

<svelte:window onpointerdowncapture={onpointerdown} />

{#snippet capIcon(cap: Cap)}
  {@const flip = side === 'start'}
  <svg viewBox="0 0 34 14" width="34" height="14" aria-hidden="true" style={flip ? 'transform: scaleX(-1)' : undefined}>
    <line x1="2" y1="7" x2={cap === 'circle' ? 28 : 31} y2="7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    {#if cap === 'triangle'}<polygon points="33,7 26,3.2 26,10.8" fill="currentColor" />{/if}
    {#if cap === 'line'}<polyline points="26,3 32,7 26,11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />{/if}
    {#if cap === 'circle'}<circle cx="29" cy="7" r="3" fill="currentColor" />{/if}
  </svg>
{/snippet}

<div class="cap" bind:this={root} {onkeydown} role="presentation">
  <button type="button" class="trigger" aria-haspopup="listbox" aria-expanded={open} aria-label="{label}: {CAPS[value]}" onclick={() => (open = !open)}>
    {@render capIcon(value)}
    <ChevronDown size={14} />
  </button>
  {#if open}
    <div class="menu" role="listbox" aria-label={label}>
      {#each Object.entries(CAPS) as [cap, name] (cap)}
        <button type="button" role="option" aria-selected={value === cap} class:on={value === cap} onclick={() => choose(cap as Cap)}>
          {@render capIcon(cap as Cap)}<span>{name}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .cap { position: relative; flex: 1; min-width: 0; }
  .trigger {
    display: flex; align-items: center; justify-content: space-between; gap: 0.35rem; width: 100%; height: 2.2rem; padding: 0 0.5rem;
    border: 1.5px solid var(--border); border-radius: 9px; background: #fff; color: var(--ink);
  }
  .trigger:hover, .trigger[aria-expanded='true'] { border-color: var(--blue-border); background: var(--blue-soft); }
  .trigger :global(svg:last-child) { color: var(--muted); flex: none; }
  .menu {
    position: absolute; z-index: 5; top: calc(100% + 4px); left: 0; min-width: 100%; display: flex; flex-direction: column; padding: 4px;
    border: 1px solid var(--border); border-radius: 10px; background: #fff; box-shadow: 0 10px 24px -8px rgb(17 24 39 / 25%);
  }
  .menu button {
    display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.5rem; border: 0; border-radius: 7px;
    background: none; color: var(--ink); font-size: 0.82rem; text-align: left; white-space: nowrap;
  }
  .menu button:hover { background: var(--bg); }
  .menu button.on { background: var(--blue-soft); color: var(--blue); }
</style>
