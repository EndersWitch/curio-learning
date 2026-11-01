<script lang="ts">
  // The box where the teacher types an instrument's reading. What they type
  // is kept to the instrument's range and decimal places once they leave the
  // box or press Enter.
  import { tick } from 'svelte'
  import { Dices } from '@lucide/svelte'

  interface Props {
    label: string
    value: number
    decimals: number
    min: number
    max: number
    unit: string
    onchange: (value: number) => void
    /** picks a random valid reading */
    onrandom: () => void
  }
  let { label, value, decimals, min, max, unit, onchange, onrandom }: Props = $props()

  const id = $props.id()

  async function commit(event: Event & { currentTarget: HTMLInputElement }) {
    const input = event.currentTarget
    if (Number.isFinite(input.valueAsNumber)) onchange(input.valueAsNumber)
    // Show the kept value, even when it's the one already shown (the box was
    // cleared, or rounding landed on the previous reading).
    await tick()
    input.value = value.toFixed(decimals)
  }
</script>

<div class="reading">
  <label for={id}>{label}</label>
  <div class="row">
    <input
      {id}
      type="number"
      inputmode="decimal"
      step={10 ** -decimals}
      {min}
      {max}
      value={value.toFixed(decimals)}
      onchange={commit}
    />
    <span class="unit">{unit}</span>
    <button type="button" class="btn-ghost random" onclick={onrandom}><Dices size={17} aria-hidden="true" /> Random</button>
  </div>
  <p class="hint">From {min} to {max} {unit}, to {decimals === 1 ? 'one decimal place' : `${decimals} decimal places`}.</p>
</div>

<style>
  label { display: block; margin-bottom: 0.35rem; font-weight: 700; font-size: 0.9rem; }
  .row { display: flex; align-items: center; gap: 0.5rem; }
  .row input { max-width: 9rem; font-variant-numeric: tabular-nums; }
  .unit { color: var(--muted); font-weight: 600; }
  .random { margin-left: auto; padding: 0.5rem 0.8rem; font-size: 0.9rem; }
  .hint { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.8rem; }
</style>
