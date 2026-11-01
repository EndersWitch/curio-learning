<script lang="ts">
  // The button after a measure, showing what's written at that part of a
  // shape. It opens a small popup to choose the label (its measure, typed
  // text, or nothing) and markings: congruence ticks or arcs, and parallel
  // arrows on a side that takes them. Fixed-position like RowStyle's popup,
  // so the scrolling settings column can't clip it.
  import { tick } from 'svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import { pretty, type LabelMode } from './parts.js'

  // mode: auto | measure | text | none, where auto shows the measure only when
  // it's given. measure: how the measure reads (null when it can't be shown,
  // with `unavailable` saying why; `note` says where it comes from). marks: congruence ticks or arcs, 0–3, or
  // undefined for a part that takes none. arrows: parallel arrows, 0–3, or undefined for a part that takes none.
  let {
    name, id, given, measure, note = '', unavailable = '', markKind = 'ticks',
    mode = $bindable(), text = $bindable(), marks = $bindable(), arrows = $bindable(),
  }: {
    name: string; id: string; given: boolean; measure: string | null; note?: string; unavailable?: string; markKind?: 'ticks' | 'arcs'
    mode: LabelMode; text: string; marks?: number; arrows?: number
  } = $props()

  const shown = $derived(mode === 'auto' ? (given ? 'measure' : 'none') : mode)
  const preview = $derived(
    shown === 'measure' ? measure : shown === 'text' ? pretty(text) : '',
  )

  const MODES = [['measure', 'Measure'], ['text', 'Text'], ['none', 'None']] as const

  let open = $state(false)
  let root = $state<HTMLElement>()
  let trigger = $state<HTMLButtonElement>()
  let panel = $state<HTMLElement>()
  let pos = $state({ left: 0, top: 0 })
  const GAP = 6
  const EDGE = 8

  async function show() {
    open = true
    await tick()
    place()
    panel!.querySelector<HTMLElement>('[aria-checked=true]')?.focus()
  }
  function place() {
    const r = trigger!.getBoundingClientRect()
    const h = panel!.offsetHeight
    const w = panel!.offsetWidth
    const below = r.bottom + GAP + h <= window.innerHeight - EDGE
    pos = {
      top: Math.max(EDGE, below ? r.bottom + GAP : r.top - GAP - h),
      left: Math.max(EDGE, Math.min(r.right - w, window.innerWidth - EDGE - w)),
    }
  }
  function hide(refocus = true) {
    open = false
    if (refocus) trigger?.focus()
  }
  function onpointerdown(event: PointerEvent) {
    if (open && !root!.contains(event.target as Node)) hide(false)
  }
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      hide()
    }
  }
  async function choose(value: LabelMode) {
    mode = value
    await tick()
    if (open) place()
    if (value === 'text') panel?.querySelector('textarea')?.focus()
  }
</script>

<svelte:window {onpointerdown} onresize={() => open && hide(false)} onscrollcapture={(e) => open && !panel?.contains(e.target as Node) && hide(false)} />

{#snippet markIcon(n: number)}
  <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">
    {#if markKind === 'ticks'}
      <line x1="2" y1="8" x2="26" y2="8" stroke-width="1.4" />
      {#each Array(n) as _, i}<line x1={14 + (i - (n - 1) / 2) * 4.5} y1="3" x2={14 + (i - (n - 1) / 2) * 4.5} y2="13" />{/each}
    {:else}
      <path d="M4,14 L26,14 M4,14 L22,2" stroke-width="1.4" />
      {#each Array(n) as _, i}
        {@const r = 10 + i * 3.5}
        <path d="M{4 + r},14 A{r},{r} 0 0 0 {4 + r * 0.832},{14 - r * 0.555}" />
      {/each}
    {/if}
    {#if n === 0}<line x1="9" y1="3" x2="19" y2="13" stroke-width="1.4" opacity="0.5" />{/if}
  </svg>
{/snippet}

{#snippet arrowIcon(n: number)}
  <svg viewBox="0 0 28 16" width="28" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
    <line x1="2" y1="8" x2="26" y2="8" stroke-width="1.4" />
    {#each Array(n) as _, i}
      {@const x = 14 + (i - (n - 1) / 2) * 5}
      <polyline points="{x - 2.5},4 {x + 1.5},8 {x - 2.5},12" />
    {/each}
    {#if n === 0}<line x1="9" y1="3" x2="19" y2="13" stroke-width="1.4" opacity="0.5" />{/if}
  </svg>
{/snippet}

<div class="part-label" bind:this={root}>
  <button
    bind:this={trigger}
    type="button"
    class="trigger"
    class:empty={!preview}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-label="Label for {name}: {preview || 'none'}"
    data-tip={open ? undefined : 'Label'}
    onclick={() => (open ? hide() : show())}
  >
    <span class="text">{preview || 'None'}</span>
    {#if marks}<span class="marks">{markKind === 'ticks' ? '|'.repeat(marks) : '◠'.repeat(marks)}</span>{/if}
    {#if arrows}<span class="marks">{'›'.repeat(arrows)}</span>{/if}
  </button>

  {#if open}
    <div bind:this={panel} class="panel" role="dialog" tabindex="-1" aria-label="Label for {name}" style="left: {pos.left}px; top: {pos.top}px" {onkeydown}>
      <div class="group">
        <span class="name" id="{id}-mode">Label at {name}</span>
        <div class="segmented" role="radiogroup" aria-labelledby="{id}-mode">
          {#each MODES as [value, title]}
            <button type="button" role="radio" aria-checked={shown === value} class:on={shown === value} onclick={() => choose(value)}>{title}</button>
          {/each}
        </div>
        {#if shown === 'text'}
          <MathInput id="{id}-text" aria-label="Label text for {name}" placeholder="x" bind:value={text} />
        {:else if shown === 'measure'}
          <p class="note">{measure ? note : unavailable}</p>
        {/if}
      </div>

      {#if marks !== undefined}
        <div class="group">
          <span class="name" id="{id}-marks">{markKind === 'ticks' ? 'Congruence ticks' : 'Congruence arcs'}</span>
          <div class="segmented" role="radiogroup" aria-labelledby="{id}-marks">
            {#each [0, 1, 2, 3] as n}
              <button type="button" role="radio" aria-checked={marks === n} aria-label={n ? `${n}` : 'None'} title={n ? `${n}` : 'None'} class:on={marks === n} onclick={() => (marks = n)}>
                {@render markIcon(n)}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      {#if arrows !== undefined}
        <div class="group">
          <span class="name" id="{id}-arrows">Parallel arrows</span>
          <div class="segmented" role="radiogroup" aria-labelledby="{id}-arrows">
            {#each [0, 1, 2, 3] as n}
              <button type="button" role="radio" aria-checked={arrows === n} aria-label={n ? `${n}` : 'None'} title={n ? `${n}` : 'None'} class:on={arrows === n} onclick={() => (arrows = n)}>
                {@render arrowIcon(n)}
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .part-label { display: flex; align-self: stretch; }
  .trigger {
    display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem;
    width: 5.2rem; padding: 0 0.45rem; border: 1.5px solid var(--border); border-radius: 10px; background: #fff;
    font-family: 'Times New Roman', Times, serif; font-size: 1.02rem; color: var(--ink);
  }
  .trigger:hover, .trigger[aria-expanded='true'] { border-color: var(--blue-border); background: var(--blue-soft); }
  .trigger.empty .text { font-family: system-ui, sans-serif; font-size: 0.8rem; font-weight: 600; color: var(--muted); }
  .text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .marks { font-size: 0.75rem; color: var(--muted); letter-spacing: -0.05em; }
  .panel {
    position: fixed; z-index: 60; display: flex; flex-direction: column; gap: 0.7rem; width: 16rem;
    padding: 0.75rem; border: 1px solid var(--border); border-radius: 12px; background: #fff;
    box-shadow: 0 12px 32px -8px rgb(17 24 39 / 25%);
  }
  .group { display: flex; flex-direction: column; gap: 0.4rem; }
  .name { font-size: 0.75rem; font-weight: 700; color: var(--muted); }
  .segmented button { flex: 1; display: inline-grid; place-items: center; padding: 0.3rem 0.4rem; }
  .note { margin: 0; font-size: 0.82rem; color: var(--muted); }
</style>
