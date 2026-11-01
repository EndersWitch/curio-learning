<script lang="ts">
  // A question-mark button that shows a short tip on hover or keyboard focus,
  // such as how to type a label.
  import type { Snippet } from 'svelte'
  import { CircleHelp } from '@lucide/svelte'

  let { id, label, children }: { id: string; label: string; children: Snippet } = $props()
</script>

<span class="tip">
  <button type="button" class="tip-btn" aria-label={label} aria-describedby={id}>
    <CircleHelp size={17} aria-hidden="true" />
  </button>
  <span {id} role="tooltip" class="tip-text">{@render children()}</span>
</span>

<style>
  .tip { position: relative; display: inline-flex; }
  .tip-btn { display: inline-grid; place-items: center; width: 1.7rem; height: 1.7rem; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--muted); cursor: help; }
  .tip-btn:hover, .tip-btn:focus-visible { color: var(--blue-dark); background: var(--blue-soft); }
  .tip-text {
    position: absolute; top: calc(100% + 6px); right: 0; z-index: 20; width: min(17rem, 80vw);
    padding: 0.55rem 0.7rem; border-radius: 8px; background: var(--ink); color: #fff;
    font-size: 0.8rem; font-weight: 500; line-height: 1.4; text-transform: none; letter-spacing: 0; pointer-events: none;
    visibility: hidden; opacity: 0; transition: opacity 0.12s;
  }
  .tip:hover .tip-text, .tip-btn:focus-visible + .tip-text { visibility: visible; opacity: 1; }
</style>
