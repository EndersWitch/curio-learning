<script lang="ts" generics="S">
  // A generator's saved starting points. The one matching the current figure
  // is highlighted; saved ones can be deleted, after a
  // confirmation. `same(a, b)` says whether two settings draw the same figure.
  import { onMount } from 'svelte'
  import { BookmarkPlus, Check, X } from '@lucide/svelte'
  import Modal from './Modal.svelte'
  import type { Preset, PresetStore } from './presetStore'

  interface Props {
    store: PresetStore<S>
    same: (a: S, b: S) => boolean
    settings: S
    onapply: (settings: S) => void
  }
  let { store, same, settings, onapply }: Props = $props()

  // Saved presets live in this browser, so they load after the page arrives.
  let saved = $state<Preset<S>[]>([])
  onMount(() => (saved = store.load()))
  let naming = $state(false)
  let name = $state('')
  let nameInput = $state<HTMLInputElement>()
  let deleting = $state<string | null>(null) // name of the preset awaiting confirmation

  function startSaving() {
    naming = true
    name = ''
    requestAnimationFrame(() => nameInput?.focus())
  }
  function save(event: SubmitEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    saved = store.save(saved, trimmed, settings)
    naming = false
  }
  function confirmDelete() {
    if (deleting === null) return
    saved = store.remove(saved, deleting)
    deleting = null
  }
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') naming = false
  }
</script>

<div class="presets">
  <div class="chips">
    {#each saved as p (p.name)}
      <span class="chip saved" class:on={same(p.settings, settings)}>
        <button class="apply" onclick={() => onapply(p.settings)}>{p.name}</button>
        <button
          class="remove"
          aria-label="Delete preset {p.name}"
          title="Delete preset"
          onclick={() => (deleting = p.name)}
        ><X size={14} aria-hidden="true" /></button>
      </span>
    {/each}
    {#if !naming}
      <button class="chip add" onclick={startSaving}>
        <BookmarkPlus size={15} aria-hidden="true" /> Save preset
      </button>
    {/if}
  </div>
  {#if naming}
    <form class="naming" onsubmit={save}>
      <input bind:this={nameInput} type="text" placeholder="Preset name" aria-label="Preset name" maxlength="40" bind:value={name} {onkeydown} />
      <button class="icon-btn" type="submit" aria-label="Save preset" data-tip="Save" disabled={!name.trim()}><Check size={18} /></button>
      <button class="icon-btn" type="button" aria-label="Cancel" data-tip="Cancel" onclick={() => (naming = false)}><X size={18} /></button>
    </form>
  {/if}
  <p class="hint">Saved presets stay in this browser.</p>
</div>

{#if deleting !== null}
  <Modal title="Delete preset?" onclose={() => (deleting = null)}>
    <p>“{deleting}” will be removed from this browser. This can’t be undone.</p>
    <div class="actions">
      <button class="btn-ghost" data-autofocus onclick={() => (deleting = null)}>Cancel</button>
      <button class="btn-danger" onclick={confirmDelete}>Delete</button>
    </div>
  </Modal>
{/if}

<style>
  .presets { padding: 1rem 1.1rem 0.9rem; }
  .saved { display: inline-flex; align-items: center; padding: 0; overflow: hidden; }
  .saved button { border: 0; background: transparent; color: inherit; font: inherit; }
  .saved .apply { padding: 0.5rem 0.25rem 0.5rem 0.95rem; }
  .saved .remove { display: grid; place-items: center; padding: 0.5rem 0.6rem 0.5rem 0.3rem; opacity: 0.6; }
  .saved .remove:hover { opacity: 1; }
  .add { display: inline-flex; align-items: center; gap: 0.35rem; border-style: dashed; color: var(--blue-dark); }
  .naming { display: flex; gap: 0.35rem; margin-top: 0.6rem; }
  .naming input { flex: 1; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
  .btn-danger {
    padding: 0.7rem 1.25rem; border: 0; border-radius: 12px; line-height: 1;
    background: var(--red); color: #fff; font-size: 1rem; font-weight: 700;
  }
  .btn-danger:hover { background: #b91c1c; }
  .hint { margin: 0.6rem 0 0; font-size: 0.8rem; color: var(--muted); }
</style>
