<script lang="ts">
  // One label on the figure: written text, a blank line for students to write
  // on, or nothing at all. Text is typed in the math field (LabelInput).
  import { Ban, PencilLine, Type, type LucideIcon } from '@lucide/svelte'
  import type { Label, LabelMode } from './label'
  import LabelInput from './LabelInput.svelte'

  interface Props {
    name: string
    label: Label
    placeholder?: string
    blank?: boolean
  }
  let { name, label = $bindable(), placeholder = '', blank = true }: Props = $props()

  const MODES = $derived<(readonly [LabelMode, string, LucideIcon])[]>([
    ['text', 'Text', Type],
    ...(blank ? ([['blank', 'Blank line', PencilLine]] as const) : []),
    ['none', 'None', Ban],
  ])
</script>

<div class="label-field">
  <div class="segmented" role="radiogroup" aria-label={name}>
    {#each MODES as [value, text, Icon]}
      <button
        type="button"
        role="radio"
        aria-checked={label.mode === value}
        class:on={label.mode === value}
        onclick={() => (label.mode = value)}
      >
        <Icon size={15} aria-hidden="true" />
        {text}
      </button>
    {/each}
  </div>
  {#if label.mode === 'text'}
    <LabelInput aria-label="{name} text" {placeholder} bind:value={label.text} />
  {:else if label.mode === 'blank'}
    <p class="note">Students write the {name.toLowerCase()} on a blank line.</p>
  {/if}
</div>

<style>
  .label-field { display: flex; flex-direction: column; gap: 0.5rem; }
  .note { margin: 0; font-size: 0.85rem; color: var(--muted); }
</style>
