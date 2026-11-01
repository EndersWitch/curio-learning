<script lang="ts">
  // A sequence's n range, as Desmos shows a slider: the first and last n in
  // boxes at either end, and a track with a handle for each to drag between.
  // The track runs 0 to 20, and further when a typed n goes past it, so the
  // scale doesn't move while a handle is dragged.
  import { MAX_TERMS } from './settings.js'

  let { first = $bindable(), last = $bindable(), label }: { first: number; last: number; label: string } = $props()

  const TRACK = 20
  const lo = $derived(Math.min(0, first))
  const hi = $derived(Math.min(Math.max(TRACK, last), lo + MAX_TERMS))
  const at = (n: number) => ((Math.min(Math.max(n, lo), hi) - lo) / (hi - lo)) * 100

  // A handle stops at the other one, so the range never turns inside out.
  const setFirst = (n: number) => (first = Math.min(n, last))
  const setLast = (n: number) => (last = Math.max(n, first))
</script>

<div class="n-range" role="group" aria-label={label}>
  <span class="n"><i>n</i></span>
  <input class="box" type="number" step="1" aria-label="{label}: first n" bind:value={first} />
  <div class="track" style="--a: {at(first)}%; --b: {at(last)}%">
    <input type="range" min={lo} max={hi} step="1" aria-label="{label}: first n" value={first} oninput={(e) => setFirst(+e.currentTarget.value)} />
    <input type="range" min={lo} max={hi} step="1" aria-label="{label}: last n" value={last} oninput={(e) => setLast(+e.currentTarget.value)} />
  </div>
  <input class="box" type="number" step="1" aria-label="{label}: last n" bind:value={last} />
</div>

<style>
  .n-range { display: flex; align-items: center; gap: 0.45rem; flex: 1; min-width: 12rem; }
  .n { font: italic 700 1rem 'Times New Roman', Times, serif; color: var(--ink); }
  .box { width: 3.4rem; }
  /* Two range inputs laid over one track; only their handles take the pointer. */
  .track {
    position: relative; flex: 1; height: 1.4rem;
    background: linear-gradient(var(--border), var(--border)) center / 100% 4px no-repeat;
  }
  .track::before {
    content: ''; position: absolute; top: 50%; left: var(--a); width: calc(var(--b) - var(--a)); height: 4px;
    transform: translateY(-50%); border-radius: 2px; background: var(--blue);
  }
  .track input {
    position: absolute; inset: 0; width: 100%; margin: 0; background: none; pointer-events: none;
    -webkit-appearance: none; appearance: none;
  }
  .track input::-webkit-slider-thumb {
    -webkit-appearance: none; pointer-events: auto; width: 1rem; height: 1rem; border-radius: 50%;
    border: 2px solid var(--blue); background: #fff; cursor: grab;
  }
  .track input::-moz-range-thumb {
    pointer-events: auto; width: 1rem; height: 1rem; border-radius: 50%; border: 2px solid var(--blue); background: #fff; cursor: grab;
  }
  .track input::-webkit-slider-runnable-track { background: none; }
  .track input::-moz-range-track { background: none; }
  .track input:focus-visible::-webkit-slider-thumb { box-shadow: 0 0 0 3px var(--blue-border); }
</style>
