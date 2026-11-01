<!--
  The teacher.dev mark in the top-left corner (the same pattern as Timer Toolbox).
  It opens to the credit and the About and Privacy cards, so the activity itself
  carries no footer to distract a student or take height from the donut.
-->
<script lang="ts">
  import { ownKeys } from '../lib/ownKeys'
  import Modal from './Modal.svelte'

  let pinned = $state(false)
  let dialog = $state<'about' | 'privacy' | null>(null)

  let menu: HTMLDivElement
  let trigger = $state<HTMLButtonElement>()

  const open = $derived(pinned && dialog === null)

  function close() {
    pinned = false
  }

  function show(which: 'about' | 'privacy') {
    close()
    dialog = which
  }

  /** On a scrolling page: scroll away with the content instead of staying put. */
  let { scrolls = false }: { scrolls?: boolean } = $props()
</script>

<!-- iOS Safari does not focus a tapped button, so a tap elsewhere never blurs
     the menu; close it on any press outside instead. -->
<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape' && open) {
      const wasInside = menu.contains(document.activeElement)
      close()
      if (wasInside) trigger?.focus()
    }
  }}
  onpointerdown={(event) => {
    if (!menu.contains(event.target as Node)) close()
  }}
/>

<div
  bind:this={menu}
  class="brand"
  class:scrolls
  role="presentation"
  onfocusout={(event) => {
    if (!menu.contains(event.relatedTarget as Node | null)) pinned = false
  }}
  {@attach ownKeys}
>
  <button
    bind:this={trigger}
    type="button"
    class="logo"
    aria-expanded={open}
    aria-controls="brand-menu-panel"
    aria-label="teacher.dev: about and privacy"
    onclick={() => (pinned = !pinned)}
  >
    <img src="/teacher-dev-logo.svg" alt="" width="30" height="30" />
  </button>

  {#if open}
    <div id="brand-menu-panel" class="panel">
      <div class="card">
        <a class="credit" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
          <img src="/teacher-dev-logo.svg" alt="" width="24" height="24" />
          Built by teacher.dev
        </a>
        <p class="links">
          <button type="button" aria-haspopup="dialog" onclick={() => show('about')}>About</button>
          <span aria-hidden="true">·</span>
          <button type="button" aria-haspopup="dialog" onclick={() => show('privacy')}>Privacy</button>
        </p>
      </div>
    </div>
  {/if}
</div>

{#if dialog === 'about'}
  <Modal title="About" closeLabel="Close about" returnTo={trigger} onclose={() => (dialog = null)}>
    <p class="lede">
      Fraction Fun helps students find a fraction of a whole number by cutting a donut into equal
      groups and sharing out sprinkles.
    </p>

    <h3 class="with-logo"><img src="/teacher-dev-logo.svg" alt="" width="28" height="28" />From teacher.dev</h3>
    <p>
      Fraction Fun is a project from
      <a href="https://teacher.dev" target="_blank" rel="noopener noreferrer">teacher.dev</a>, a
      community of builders making free tools for classrooms.
    </p>

    <h3>Our promise</h3>
    <ul class="promise">
      <li>Zero paywalls.</li>
      <li>Zero ads.</li>
      <li>Zero tracking of personal data.</li>
    </ul>

    <h3>Feedback &amp; ideas</h3>
    <p>
      Tell us what’s working, what’s not, or what you wish you had for your class:
      <a href="mailto:support@teacher.dev?subject=Fraction%20Fun%20feedback">support@teacher.dev</a>
    </p>
  </Modal>
{:else if dialog === 'privacy'}
  <Modal title="Privacy" closeLabel="Close privacy" returnTo={trigger} onclose={() => (dialog = null)}>
    <p>Fraction Fun has no accounts, ads or cookies, and collects no personal information.</p>
    <p>
      We count visits with
      <a href="https://www.cloudflare.com/web-analytics/" target="_blank" rel="noopener noreferrer">Cloudflare Web Analytics</a>,
      which doesn't track you. The only thing saved is your sound setting, in this browser.
    </p>
    <p>
      Questions? Email
      <a href="mailto:support@teacher.dev?subject=Fraction%20Fun%20privacy">support@teacher.dev</a>.
    </p>
  </Modal>
{/if}

<style>
  .brand.scrolls {
    position: absolute;
  }

  .brand {
    position: fixed;
    top: 18px;
    left: 18px;
    z-index: 6;
  }

  .logo {
    width: 52px;
    height: 52px;
    padding: 0;
    display: grid;
    place-items: center;
    border: none;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 4px 16px #2b2b3a1f;
    cursor: pointer;
  }

  .panel {
    position: absolute;
    top: 100%;
    left: 0;
    padding-top: 8px;
  }

  .card {
    width: max-content;
    max-width: calc(100vw - 36px);
    display: grid;
    gap: 6px;
    padding: 12px 18px;
    border-radius: 18px;
    background: #fff;
    box-shadow: 0 6px 24px #2b2b3a26;
    font: 400 16px/1.3 var(--font-text);
  }

  .credit {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--ink);
    text-decoration: none;
  }

  .links {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #2b2b3a40;
  }

  .links button {
    padding: 0;
    border: none;
    background: none;
    color: var(--ink-soft);
    font: inherit;
    cursor: pointer;
  }

  .credit:hover,
  .links button:hover {
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* A polaroid, as on Timer Toolbox. */
  .photo {
    margin: 14px auto 0;
    max-width: 230px;
    padding: 8px 8px 10px;
    background: #fff;
    border-radius: 3px;
    box-shadow: 0 6px 20px #2b2b3a26;
    rotate: -1deg;
  }

  .photo img {
    display: block;
    width: 100%;
    height: auto;
  }

  .photo figcaption {
    padding-top: 8px;
    text-align: center;
    font: 16px 'Segoe Script', 'Bradley Hand', 'Snell Roundhand', 'Comic Sans MS', cursive;
    color: var(--ink-soft);
  }

  .lede {
    color: var(--ink);
  }

  h3 {
    margin: 16px 0 4px;
    font: 700 19px/1.2 var(--font);
    color: var(--ink);
  }

  .with-logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .promise {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 18px;
    font-weight: 700;
    color: var(--ink);
  }

  .promise li {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .promise li::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: var(--accent);
  }

</style>
