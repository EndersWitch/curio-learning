<script lang="ts" module>
  export type Highlight = 'numerator' | 'denominator' | 'whole' | null
  /** Full screen at the start, pinned top-middle while working, then the answer line. */
  export type IslandMode = 'full' | 'pinned' | 'answer'
</script>

<script lang="ts">
  import { onMount } from 'svelte'
  import type { Problem } from '../lib/problem'

  type Props = {
    problem: Problem
    mode: IslandMode
    highlight?: Highlight
    /** The answer so far, shown in a badge after "=". */
    answer?: number | null
    /** Bumped each time a group lands on the answer, to replay the pop. */
    landings?: number
    /** Every group has landed: the answer turns pink. */
    done?: boolean
  }

  let { problem, mode, highlight = null, answer = null, landings = 0, done = false }: Props = $props()

  let width = $state(innerWidth)
  let height = $state(innerHeight)
  // Hidden until the font loads, so the text never jumps when it swaps in.
  let ready = $state(false)
  let slot: HTMLSpanElement

  // The text is always laid out at its full-screen size on one line, and moving
  // only scales it, so it can never re-wrap mid-move.
  const fullSize = $derived(Math.min(width * 0.085, height * 0.16, 150))
  const scale = $derived(
    mode === 'pinned'
      ? Math.min(34, width * 0.045) / fullSize
      : mode === 'answer'
        ? Math.min(64, width * 0.07) / fullSize
        : 1,
  )

  /** Where the answer badge sits on screen, and how wide it is, for groups to fly at. */
  export function slotPoint(): { x: number; y: number; size: number } {
    const box = slot.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2, size: box.height }
  }

  onMount(() => {
    const show = () => (ready = true)
    document.fonts?.ready.then(show)
    const fallback = setTimeout(show, 1200)
    return () => clearTimeout(fallback)
  })
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

<h1
  class="island {mode}"
  class:ready
  style={`font-size: ${fullSize}px; --scale: ${scale}`}
  aria-label={mode === 'answer' && answer !== null
    ? `${problem.numerator} over ${problem.denominator} of ${problem.whole} equals ${answer}`
    : `What is ${problem.numerator} over ${problem.denominator} of ${problem.whole}?`}
>
  <span class="lead">
    <span class="word" style="--i: 0">What</span>
    <span class="word" style="--i: 1">is</span>
  </span>
  <span class="word fraction" style="--i: 2" aria-hidden="true">
    <span class="part" class:lit={highlight === 'numerator'}>{problem.numerator}</span>
    <span class="bar"></span>
    <span class="part" class:lit={highlight === 'denominator'}>{problem.denominator}</span>
  </span>
  <span class="word" style="--i: 3">of</span>
  <span class="word" style="--i: 4"><span class="part" class:lit={highlight === 'whole'}>{problem.whole}</span></span>
  <!-- "?" turns into "=" when the answer arrives. -->
  <span class="word mark" style="--i: 4" aria-hidden="true"><span class="q">?</span><span class="eq">=</span></span>
  <span class="slot" bind:this={slot} aria-hidden="true">
    {#if answer !== null}
      <!-- The first group lands exactly on the slot, so only later ones pop on impact. -->
      {#key landings}<span class="badge" class:first={landings === 1} class:done>{answer}</span>{/key}
    {/if}
  </span>
</h1>

<style>
  .island {
    position: fixed;
    left: 50%;
    top: 42%;
    z-index: 5;
    margin: 0;
    padding: 0.12em 0.7em;
    border-radius: 999px;
    white-space: nowrap;
    font-family: var(--font);
    font-weight: 700;
    line-height: 1.15;
    color: var(--ink);
    background: transparent;
    display: flex;
    align-items: center;
    gap: 0.25em;
    opacity: 0;
    transform: translate(-50%, -50%) scale(var(--scale));
    transform-origin: center;
    transition:
      top 0.6s cubic-bezier(0.65, 0, 0.35, 1),
      transform 0.6s cubic-bezier(0.65, 0, 0.35, 1),
      background-color 0.4s,
      box-shadow 0.4s,
      opacity 0.3s;
  }

  .ready {
    opacity: 1;
  }

  /* On load, the words drop in one after another. */
  .ready.full .word {
    animation: word-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    animation-delay: calc(var(--i) * 110ms + 150ms);
  }

  @keyframes word-in {
    from {
      opacity: 0;
      transform: translateY(-0.6em) scale(0.6);
    }
  }

  .pinned {
    top: 52px;
    background: #fff;
    /* Scaled down with the text, so it's drawn large here. */
    box-shadow: 0 0.25em 1em #2b2b3a1f;
  }

  /* Swings down into the answer line: "¼ of 20 = 5". */
  .answer {
    top: 150px;
    transition:
      top 0.7s cubic-bezier(0.34, 1.45, 0.64, 1),
      transform 0.7s cubic-bezier(0.34, 1.45, 0.64, 1),
      background-color 0.4s,
      box-shadow 0.4s,
      opacity 0.3s;
  }

  .lead {
    display: inline-flex;
    gap: 0.25em;
    max-width: 4em;
    overflow: hidden;
    transition:
      max-width 0.5s,
      opacity 0.3s,
      margin 0.5s;
  }

  .answer .lead {
    max-width: 0;
    opacity: 0;
    margin-right: -0.25em;
  }

  .fraction {
    display: inline-grid;
    justify-items: center;
    font-size: 0.6em;
    line-height: 1;
  }

  /* Its own element so the highlight's rounded corners can't bend it. */
  .bar {
    width: 100%;
    min-width: 0.9em;
    height: 0.1em;
    margin: 0.06em 0;
    background: currentColor;
    position: relative;
    z-index: 1;
  }

  .part {
    display: inline-block;
    border-radius: 0.2em;
    transition:
      background-color 0.3s,
      box-shadow 0.3s,
      transform 0.3s;
  }

  /* A glow rather than padding, so lighting a part never shifts the text. */
  .lit {
    background: #ffd23f;
    /* Sideways only, so it never covers the fraction bar. */
    box-shadow:
      0.1em 0 0 #ffd23f,
      -0.1em 0 0 #ffd23f;
    transform: scale(1.12);
  }

  /* "?" hugs the number; "=" gets normal spacing. */
  .mark {
    display: inline-grid;
    margin-left: -0.25em;
    transition: margin 0.4s;
  }

  .mark > span {
    grid-area: 1 / 1;
    text-align: center;
    transition:
      opacity 0.35s,
      transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .eq {
    opacity: 0;
    transform: rotate(-90deg) scale(0.4);
  }

  .answer .mark {
    margin-left: 0;
  }

  .answer .q {
    opacity: 0;
    transform: rotate(90deg) scale(0.4);
  }

  .answer .eq {
    opacity: 1;
    transform: none;
  }

  .slot {
    display: inline-grid;
    place-items: center;
    width: 0;
    height: 1.3em;
    margin-left: -0.25em;
    transition:
      width 0.5s,
      margin 0.5s;
  }

  .answer .slot {
    width: 1.3em;
    margin-left: 0;
  }

  .badge {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 50%;
    background: #fff;
    border: 0.1em solid var(--ink);
    font-size: 0.62em;
    color: var(--ink);
    line-height: 1;
    transition: color 0.4s;
    animation: land 0.4s cubic-bezier(0.34, 1.8, 0.64, 1);
  }

  .badge.first {
    animation: none;
  }

  .badge.done {
    color: var(--accent);
  }

  /* Squash when a group hits it, then spring back. */
  @keyframes land {
    0% {
      transform: scale(1.35);
    }
    40% {
      transform: scale(0.9);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ready.full .word,
    .badge {
      animation: none;
    }
  }
</style>
