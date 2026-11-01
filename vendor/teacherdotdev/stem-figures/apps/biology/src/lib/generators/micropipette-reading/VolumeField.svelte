<script lang="ts">
  // The box where the teacher types the volume. The figure follows as they
  // type, whenever the pipette can be set to what's typed; when it can't, the
  // figure stays on the last volume that could and the box says why.
  import { Dices } from '@lucide/svelte'
  import { readVolume, stepOf, type Pipette } from './pipette'

  interface Props {
    p: Pipette
    volume: number
    onchange: (volume: number) => void
    onrandom: () => void
  }
  let { p, volume, onchange, onrandom }: Props = $props()

  const id = $props.id()
  let input: HTMLInputElement
  let error = $state('')

  // Show the volume, except while it's being typed: rewriting the box then
  // would turn "12" into "12.0" under the cursor.
  $effect(() => {
    const text = volume.toFixed(p.decimals)
    if (document.activeElement !== input) {
      input.value = text
      error = ''
    }
  })

  function update() {
    const read = readVolume(p, input.value)
    error = read.error ?? ''
    if (read.volume !== undefined) onchange(read.volume)
  }

  // Leaving the box puts the volume being drawn back in it, tidied.
  function commit() {
    if (!error) input.value = volume.toFixed(p.decimals)
  }
</script>

<div class="volume">
  <label for={id}>Volume it's set to</label>
  <div class="row">
    <input
      {id}
      type="text"
      inputmode="decimal"
      autocomplete="off"
      defaultValue={volume.toFixed(p.decimals)}
      aria-invalid={!!error}
      aria-describedby="{id}-hint"
      bind:this={input}
      oninput={update}
      onchange={commit}
    />
    <span class="unit">µL</span>
    <button type="button" class="btn-ghost random" onclick={onrandom}><Dices size={17} aria-hidden="true" /> Random</button>
  </div>
  {#if error}
    <p class="error" id="{id}-hint" role="alert">{error} The figure still shows {volume.toFixed(p.decimals)} µL.</p>
  {:else}
    <p class="hint" id="{id}-hint">A {p.name} pipette is set from {p.min} to {p.max} µL, in steps of {stepOf(p)} µL.</p>
  {/if}
</div>

<style>
  label { display: block; margin-bottom: 0.35rem; font-weight: 700; font-size: 0.9rem; }
  .row { display: flex; align-items: center; gap: 0.5rem; }
  .row input { max-width: 9rem; font-variant-numeric: tabular-nums; }
  .row input[aria-invalid='true'] { border-color: #c81e1e; }
  .unit { color: var(--muted); font-weight: 600; }
  .random { margin-left: auto; padding: 0.5rem 0.8rem; font-size: 0.9rem; }
  .hint { margin: 0.35rem 0 0; color: var(--muted); font-size: 0.8rem; }
  .error { margin: 0.35rem 0 0; color: #b42318; font-size: 0.82rem; font-weight: 600; }
</style>
