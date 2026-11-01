<script lang="ts">
  // One piece of text on the figure: written text, a blank line for students
  // to write on (titles only), or nothing at all.
  import type { Component } from 'svelte'
  import { Ban, PencilLine, Type } from '@lucide/svelte'

  type Mode = 'text' | 'blank' | 'none'
  interface Props {
    name: string
    mode: Mode
    text: string
    placeholder?: string
    /** offer a blank line for students to write on */
    blank?: boolean
  }
  let { name, mode = $bindable(), text = $bindable(), placeholder = '', blank = true }: Props = $props()

  const MODES: [Mode, string, Component<any>][] = $derived([
    ['text', 'Text', Type],
    ...(blank ? [['blank', 'Blank line', PencilLine] as [Mode, string, Component<any>]] : []),
    ['none', 'None', Ban],
  ])
</script>

<div class="label-field">
  <div class="segmented" role="radiogroup" aria-label={name}>
    {#each MODES as [value, label, Icon]}
      <button
        type="button"
        role="radio"
        aria-checked={mode === value}
        class:on={mode === value}
        onclick={() => (mode = value)}
      >
        <Icon size={15} aria-hidden="true" />
        {label}
      </button>
    {/each}
  </div>
  {#if mode === 'text'}
    <input type="text" aria-label="{name} text" {placeholder} bind:value={text} />
  {:else if mode === 'blank'}
    <p class="note">Students write the {name.toLowerCase()} on a blank line.</p>
  {/if}
</div>

<style>
  .label-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .note { margin: 0; font-size: 0.85rem; color: var(--muted); }
</style>
