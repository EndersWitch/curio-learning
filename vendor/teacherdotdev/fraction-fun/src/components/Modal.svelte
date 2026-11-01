<!--
  A small modal card for the site chrome (help, about, privacy). Escape, a press
  on the backdrop and the close button all close it; Tab stays inside; focus goes
  back to `returnTo` (or whatever was focused before) when it closes.
-->
<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { scale } from 'svelte/transition'

  let {
    title,
    onclose,
    closeLabel = 'Close',
    returnTo,
    children,
  }: {
    title: string
    onclose: () => void
    /** What the close button is called for screen readers. */
    closeLabel?: string
    /** Where focus goes on close, when the opener itself is gone by then (a menu item). */
    returnTo?: HTMLElement | null
    children: Snippet
  } = $props()

  const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`
  let panel: HTMLDivElement

  onMount(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.focus()
    // The app listens on the window for Enter, Space and the arrow keys to drive the
    // activity. Catching keys on the way down stops them reaching it behind the dialog,
    // while the keys' own default actions (pressing a focused button or link) still happen.
    window.addEventListener('keydown', onkeydown, true)
    return () => {
      window.removeEventListener('keydown', onkeydown, true)
      ;(returnTo ?? previous)?.focus()
    }
  })

  function onkeydown(event: KeyboardEvent) {
    event.stopPropagation()
    if (event.key === 'Escape') {
      event.preventDefault()
      onclose()
      return
    }
    if (event.key !== 'Tab') return
    const focusable = [
      ...panel.querySelectorAll<HTMLElement>('button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'),
    ].filter((el) => el.offsetParent !== null)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const inside = panel.contains(document.activeElement) && document.activeElement !== panel
    if (event.shiftKey && (!inside || document.activeElement === first)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
      event.preventDefault()
      first.focus()
    }
  }
</script>

<div
  class="backdrop"
  role="presentation"
  onmousedown={(event) => {
    if (event.target === event.currentTarget) onclose()
  }}
>
  <div
    bind:this={panel}
    class="card"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    tabindex="-1"
    transition:scale={{ start: 0.92, duration: 180 }}
  >
    <header>
      <h2 id={titleId}>{title}</h2>
      <button type="button" class="close" onclick={onclose} aria-label={closeLabel}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </header>
    <div class="body">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: grid;
    place-items: center;
    padding: 16px;
    background: #2b2b3a66;
    user-select: text;
    -webkit-user-select: text;
  }

  .card {
    width: 100%;
    max-width: 460px;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 24px;
    background: #fff;
    box-shadow: 0 12px 40px #2b2b3a33;
    color: var(--ink);
    font-family: var(--font);
    outline: none;
  }

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 8px 8px 22px;
    border-bottom: 2px solid var(--bg);
  }

  h2 {
    flex: 1;
    margin: 0;
    font: 700 24px/1.2 var(--font);
  }

  .close {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    cursor: pointer;
  }

  .close:hover {
    background: var(--bg);
  }

  .close svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: var(--ink-soft);
    stroke-width: 2.4;
    stroke-linecap: round;
  }

  .body {
    min-height: 0;
    overflow-y: auto;
    padding: 18px 22px 22px;
    font: 400 17px/1.5 var(--font-text);
    color: var(--ink-soft);
  }

  .body :global(p) {
    margin: 0 0 12px;
  }

  .body :global(p:last-child) {
    margin-bottom: 0;
  }

  .body :global(a) {
    color: var(--accent);
    font-weight: 700;
    text-underline-offset: 3px;
  }
</style>
