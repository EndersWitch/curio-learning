<script lang="ts">
  // How an extra line (a height or a diagonal) is drawn and labeled: its line
  // style, then its label as its measure, typed text or nothing. `unavailable`
  // explains why a measure can't be shown, when it can't.
  import MathInput from '$lib/shared/MathInput.svelte'
  import LineStylePicker from './LineStylePicker.svelte'
  import type { LineLabelMode, LineStyle } from './parts.js'

  let {
    id, name, placeholder = 'h', unavailable = '',
    style = $bindable(), mode = $bindable(), text = $bindable(),
  }: { id: string; name: string; placeholder?: string; unavailable?: string; style: LineStyle; mode: LineLabelMode; text: string } = $props()

  const MODES = [['measure', 'Measure'], ['text', 'Text'], ['none', 'None']] as const
</script>

<LineStylePicker {id} bind:value={style} />
<div class="field">
  <span id="{id}-label">Label</span>
  <div class="segmented" role="radiogroup" aria-labelledby="{id}-label">
    {#each MODES as [value, title]}
      <button type="button" role="radio" aria-checked={mode === value} class:on={mode === value} onclick={() => (mode = value)}>{title}</button>
    {/each}
  </div>
  {#if mode === 'text'}
    <MathInput id="{id}-text" aria-label="Label for {name}" {placeholder} bind:value={text} />
  {:else if mode === 'measure' && unavailable}
    <p class="hint">{unavailable}</p>
  {/if}
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .segmented button { flex: 1; display: inline-grid; place-items: center; padding: 0.3rem 0.4rem; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }
</style>
