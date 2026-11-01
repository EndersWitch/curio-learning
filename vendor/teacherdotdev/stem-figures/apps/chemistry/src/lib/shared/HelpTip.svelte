<script lang="ts">
  // A question-mark button that shows a short tip on hover or keyboard focus,
  // such as how to type a formula. The tip is fixed to the screen, under the
  // button and kept inside the screen's edges, so a scrolling settings panel
  // can't clip it.
  import type { Snippet } from 'svelte'
  import { CircleHelp } from '@lucide/svelte'

  let { id, label, children }: { id: string; label: string; children: Snippet } = $props()

  /** the gap between the tip and the screen's edges, and below the button */
  const MARGIN = 8
  let button: HTMLButtonElement
  let tip: HTMLSpanElement
  let place = $state({ left: 0, top: 0 })

  function position() {
    const b = button.getBoundingClientRect()
    const width = tip.offsetWidth
    const left = Math.min(b.left, window.innerWidth - MARGIN - width)
    place = { left: Math.max(MARGIN, left), top: b.bottom + 6 }
  }
</script>

<svelte:window onscrollcapture={position} onresize={position} />

<span class="tip" role="presentation" onpointerenter={position} onfocusin={position}>
  <button bind:this={button} type="button" class="tip-btn" aria-label={label} aria-describedby={id}>
    <CircleHelp size={17} aria-hidden="true" />
  </button>
  <span bind:this={tip} {id} role="tooltip" class="tip-text" style:left="{place.left}px" style:top="{place.top}px">{@render children()}</span>
</span>

<style>
  .tip { position: relative; display: inline-flex; }
  .tip-btn { display: inline-grid; place-items: center; width: 1.7rem; height: 1.7rem; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); cursor: help; }
  .tip-btn:hover, .tip-btn:focus-visible { color: var(--blue-dark); background: var(--blue-soft); }
  .tip-text {
    position: fixed; z-index: 20; width: min(17rem, calc(100vw - 16px));
    padding: 0.55rem 0.7rem; border-radius: 8px; background: var(--ink); color: #fff;
    font-size: 0.8rem; font-weight: 500; line-height: 1.4; text-transform: none; letter-spacing: 0; pointer-events: none;
    visibility: hidden; opacity: 0; transition: opacity 0.12s;
  }
  .tip:hover .tip-text, .tip-btn:focus-visible + .tip-text { visibility: visible; opacity: 1; }
</style>
