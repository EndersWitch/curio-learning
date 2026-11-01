<script lang="ts">
  // The scale settings Volume Reading and Volume by Displacement share: how
  // far apart the smallest marks are, which marks are numbered, and the unit. Only spacings the instrument offers are
  // shown, and numbers that wouldn't fall on its marks can't be picked.
  import {
    UNIT_SYMBOLS, VOLUME_UNITS, numbersFit, scaleOptions, volumeScale,
    type MarkSpacing, type NumberSpacing, type ScaleChoice, type VolumeInstrument, type VolumeUnit,
  } from './scale'

  type Choice = ScaleChoice & { unit: VolumeUnit }

  interface Props {
    instrument: VolumeInstrument
    choice: Choice
    onchange: (patch: Partial<Choice>) => void
  }
  let { instrument, choice, onchange }: Props = $props()

  const scale = $derived(volumeScale({ ...instrument, ...choice }))
  const options = $derived(scaleOptions(instrument))
  const unit = $derived(UNIT_SYMBOLS[choice.unit])
</script>

<p class="field-label first">Smallest marks</p>
<div class="chips" role="radiogroup" aria-label="Smallest marks">
  {#each options.marks as marks (marks)}
    <button
      type="button" role="radio" aria-checked={scale.minorEvery === marks} class="chip" class:on={scale.minorEvery === marks}
      onclick={() => onchange({ marks: String(marks) as MarkSpacing })}
    >
      {marks} {unit}
    </button>
  {/each}
</div>
<p class="field-label">Numbered every</p>
<div class="chips" role="radiogroup" aria-label="Numbered every">
  {#each options.numbers as numbers (numbers)}
    {@const on = scale.numbered && scale.labelEvery === numbers}
    <button
      type="button" role="radio" aria-checked={on} class="chip" class:on disabled={!numbersFit(scale.minorEvery, numbers)}
      onclick={() => onchange({ numbers: String(numbers) as NumberSpacing })}
    >
      {numbers} {unit}
    </button>
  {/each}
  <button type="button" role="radio" aria-checked={!scale.numbered} class="chip" class:on={!scale.numbered} onclick={() => onchange({ numbers: 'none' })}>
    No numbers
  </button>
</div>
{#if !scale.numbered}
  <p class="note">Longer marks every {scale.labelEvery} {unit}, left without numbers for students to work out.</p>
{/if}
<p class="field-label">Unit</p>
<div class="chips" role="radiogroup" aria-label="Unit">
  {#each VOLUME_UNITS as u (u)}
    <button type="button" role="radio" aria-checked={choice.unit === u} class="chip" class:on={choice.unit === u} onclick={() => onchange({ unit: u })}>
      {UNIT_SYMBOLS[u]}
    </button>
  {/each}
</div>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label.first { margin-top: 0; }
  .note { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.85rem; }
  .chip:disabled, .chip:disabled:hover { border-color: var(--border); background: #fff; color: var(--muted); opacity: 0.6; cursor: not-allowed; }
</style>
