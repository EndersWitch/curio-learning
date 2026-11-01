<script lang="ts">
  // Picks how one end of an axis finishes, like the line end caps in Figma: a
  // button showing the current cap that drops down a list of the others. The
  // list is fixed-position so the scrolling settings column can't clip it, and
  // opens upward when there isn't room below.
  import { tick } from 'svelte'
  import { ChevronDown } from '@lucide/svelte'
  import type { Cap } from './caps'

  // options: { cap id: display name }, e.g. { triangle: 'Triangle arrow', none: 'None' }
  let {
    value = $bindable(), options, label, direction,
  }: { value: Cap; options: Record<Cap, string>; label: string; direction: keyof typeof ANGLE } = $props()

  const ANGLE = { right: 0, up: -90, left: 180, down: 90 }
  let open = $state(false)
  let root = $state<HTMLElement>()
  let trigger = $state<HTMLButtonElement>()
  let menu = $state<HTMLElement>()
  let pos = $state({ left: 0, top: 0, width: 0 })

  const GAP = 4
  const EDGE = 8 // keep this far from the window edges

  async function show() {
    const r = trigger!.getBoundingClientRect()
    pos = { left: r.left, top: r.bottom + GAP, width: r.width }
    open = true
    await tick()
    const h = menu!.offsetHeight
    const w = menu!.offsetWidth
    const fitsBelow = r.bottom + GAP + h <= window.innerHeight - EDGE
    const top = fitsBelow || r.top - GAP - h < EDGE ? Math.min(r.bottom + GAP, window.innerHeight - EDGE - h) : r.top - GAP - h
    pos = { ...pos, top: Math.max(EDGE, top), left: Math.max(EDGE, Math.min(r.left, window.innerWidth - EDGE - w)) }
    ;(menu!.querySelector<HTMLElement>('[aria-selected=true]') ?? menu!.querySelector('button'))?.focus()
  }
  function hide(refocus = true) {
    open = false
    if (refocus) trigger?.focus()
  }
  function pick(v: Cap) {
    value = v
    hide()
  }
  function onmenukey(event: KeyboardEvent) {
    const items = Array.from(menu!.querySelectorAll('button'))
    const i = items.indexOf(document.activeElement as HTMLButtonElement)
    if (event.key === 'ArrowDown') items[(i + 1) % items.length].focus()
    else if (event.key === 'ArrowUp') items[(i - 1 + items.length) % items.length].focus()
    else if (event.key === 'Escape' || event.key === 'Tab') hide(event.key === 'Escape')
    else return
    if (event.key !== 'Tab') event.preventDefault()
  }
  function onpointerdown(event: PointerEvent) {
    if (open && !root!.contains(event.target as Node)) hide(false)
  }
</script>

<svelte:window {onpointerdown} onresize={() => open && hide(false)} onscrollcapture={() => open && hide(false)} />

{#snippet capIcon(c: Cap)}
  <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
    <g transform="rotate({ANGLE[direction]} 10 10)" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="3" y1="10" x2={c === 'triangle' ? 12 : 16.5} y2="10" />
      {#if c === 'triangle'}<path d="M11,5.5 L17.5,10 L11,14.5 z" stroke-width="1" />
      {:else if c === 'line'}<path d="M12,5.5 L16.5,10 L12,14.5" fill="none" />
      {:else if c === 'circle'}<circle cx="15.5" cy="10" r="3" stroke="none" />{/if}
    </g>
  </svg>
{/snippet}

<div class="cap-picker" bind:this={root}>
  <button
    bind:this={trigger}
    type="button"
    class="trigger"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label="{label}: {options[value]}"
    onclick={() => (open ? hide() : show())}
  >
    {@render capIcon(value)}
    <span class="name">{options[value]}</span>
    <ChevronDown size={15} aria-hidden="true" />
  </button>
  {#if open}
    <div
      bind:this={menu}
      class="menu"
      role="listbox"
      tabindex="-1"
      aria-label={label}
      style="left: {pos.left}px; top: {pos.top}px; min-width: {pos.width}px"
      onkeydown={onmenukey}
    >
      {#each Object.entries(options) as [v, name]}
        <button type="button" role="option" aria-selected={value === v} class:on={value === v} onclick={() => pick(v as Cap)}>
          {@render capIcon(v as Cap)}
          {name}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .trigger {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    width: 100%;
    padding: 0.4rem 0.55rem;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: #fff;
    color: var(--ink);
    font-size: 0.9rem;
    font-weight: 400;
  }
  .trigger:hover, .trigger[aria-expanded='true'] { border-color: var(--blue-border); }
  .trigger:focus-visible { outline: none; border-color: var(--blue); }
  .name { flex: 1; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trigger :global(.lucide) { color: var(--muted); flex: none; }
  .menu {
    position: fixed;
    z-index: 60;
    display: flex;
    flex-direction: column;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 12px 32px -8px rgb(17 24 39 / 25%);
  }
  .menu button {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.4rem 0.6rem;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--ink);
    font-size: 0.9rem;
    text-align: left;
    white-space: nowrap;
  }
  .menu button:hover, .menu button:focus-visible { outline: none; background: var(--blue-soft); }
  .menu button.on { color: var(--blue-dark); font-weight: 600; }
</style>
