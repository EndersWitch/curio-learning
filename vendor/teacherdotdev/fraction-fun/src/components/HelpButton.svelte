<!-- The "?" at the bottom left: a way to reach us from every screen. -->
<script lang="ts">
  import { ownKeys } from '../lib/ownKeys'
  import Modal from './Modal.svelte'

  let open = $state(false)

  /** On a scrolling page: scroll away with the content instead of staying put. */
  let { scrolls = false }: { scrolls?: boolean } = $props()
</script>

<button type="button" class="help" class:scrolls aria-label="Help" aria-haspopup="dialog" onclick={() => (open = true)} {@attach ownKeys}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" />
    <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2.9c0 1.8-2.6 2.4-2.6 4" />
    <path d="M12 17.4h.01" stroke-width="3" />
  </svg>
</button>

{#if open}
  <Modal title="Need a hand?" closeLabel="Close help" onclose={() => (open = false)}>
    <p>
      If you’re running into trouble or have suggestions, email us at
      <a href="mailto:support@teacher.dev?subject=Fraction%20Fun">support@teacher.dev</a>.
    </p>
  </Modal>
{/if}

<style>
  .help.scrolls {
    position: absolute;
  }

  .help {
    position: fixed;
    left: 12px;
    bottom: 12px;
    z-index: 6;
    width: 40px;
    height: 40px;
    padding: 0;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--ink-soft);
    opacity: 0.7;
    cursor: pointer;
    transition:
      background-color 0.2s,
      color 0.2s,
      opacity 0.2s;
  }

  .help:hover,
  .help:focus-visible {
    opacity: 1;
    color: var(--accent);
    background: #fff;
  }

  .help svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
