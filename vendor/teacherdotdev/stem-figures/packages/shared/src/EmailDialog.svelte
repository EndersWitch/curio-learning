<script lang="ts">
  // The one way to reach a person, shared by Help and Request a generator so
  // the two look alike: a short message, the address with a copy button (many
  // school computers have no email app), and a button that opens an email.
  import type { Snippet } from 'svelte'
  import { Check, Copy, Mail } from '@lucide/svelte'
  import Modal from './Modal.svelte'

  const SUPPORT_EMAIL = 'support@teacher.dev'

  interface Props {
    title: string
    subject: string
    body?: string
    onclose: () => void
    children: Snippet
  }
  let { title, subject, body = '', onclose, children }: Props = $props()

  const mailto = $derived(
    `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`,
  )
  let copied = $state(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      copied = true
      setTimeout(() => (copied = false), 1800)
    } catch {
      /* the address is on screen to copy by hand */
    }
  }
</script>

<Modal {title} {onclose}>
  <div class="message">{@render children()}</div>
  <div class="address">
    <span>{SUPPORT_EMAIL}</span>
    <button type="button" class="copy" onclick={copy}>
      {#if copied}<Check size={15} aria-hidden="true" /> Copied{:else}<Copy size={15} aria-hidden="true" /> Copy{/if}
    </button>
  </div>
  <a class="btn-primary open" href={mailto} data-autofocus><Mail size={17} aria-hidden="true" /> Open in email</a>
</Modal>

<style>
  .message :global(p + p) { margin-top: 0.6rem; }
  .address {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.35rem 0.35rem 0.35rem 0.8rem;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    font-weight: 600;
    word-break: break-all;
  }
  .copy {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex: none;
    padding: 0.4rem 0.65rem;
    border: 0;
    border-radius: 7px;
    background: var(--blue-soft);
    color: var(--blue-dark);
    font-size: 0.86rem;
    font-weight: 700;
  }
  .copy:hover { background: #dbeafe; }
  .open { width: 100%; margin-top: 0.75rem; }
</style>
