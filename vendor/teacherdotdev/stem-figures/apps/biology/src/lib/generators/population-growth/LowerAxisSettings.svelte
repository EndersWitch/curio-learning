<script lang="ts">
  // The lower graph's y-axis, when two graphs are stacked: its range and how
  // often it's numbered. Its letter and end caps are the top graph's.
  import { MoveUp } from '@lucide/svelte'
  import Section from '$shared/Section.svelte'
  import { axisEnd, type Axis } from '$shared/graph/axes'
  import { niceText } from '$shared/graph/numbering'

  interface Props {
    read: Axis
    problems: Record<string, string | null>
    from: string
    to: string
    step: string
    every: number
  }
  let { read, problems, from = $bindable(), to = $bindable(), step = $bindable(), every = $bindable() }: Props = $props()

  const EVERY_OPTIONS: [number, string][] = [
    [1, 'Every line'],
    [2, 'Every 2nd line'],
    [5, 'Every 5th line'],
    [10, 'Every 10th line'],
    [0, 'No numbers'],
  ]
  const n = (v: number) => niceText(v, read.numbering)
  const summary = $derived(
    [`${n(read.start)} to ${n(axisEnd(read))}`, `by ${n(read.step)}`, every ? (every === 1 ? 'numbered' : `numbered every ${every}`) : 'unnumbered'].join(' · '),
  )
</script>

<Section title="Lower graph’s y-axis" icon={MoveUp} {summary}>
  <div class="grid-fields">
    <div class="range-field">
      <label for="y2-From">From</label>
      <input type="text" inputmode="decimal" id="y2-From" aria-invalid={!!problems.y2From} bind:value={from} />
    </div>
    <div class="range-field">
      <label for="y2-To">To</label>
      <input type="text" inputmode="decimal" id="y2-To" aria-invalid={!!problems.y2To} bind:value={to} />
    </div>
    <div class="range-field">
      <label for="y2-Step">Count by</label>
      <input type="text" inputmode="decimal" id="y2-Step" aria-invalid={!!problems.y2Step} bind:value={step} />
    </div>
  </div>
  {#each ['y2From', 'y2To', 'y2Step'] as key}
    {#if problems[key]}<p class="help problem">{problems[key]}</p>{/if}
  {/each}
  <label class="field">
    Numbers
    <select bind:value={every}>
      {#each EVERY_OPTIONS as [v, name]}<option value={v}>{name}</option>{/each}
    </select>
  </label>
</Section>

<style>
  .grid-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.75rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-field input { width: 100%; min-width: 0; }
  .grid-fields ~ .help { margin: -0.3rem 0 0.75rem; font-size: 0.84rem; }
  .help.problem { color: var(--red); font-weight: 600; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; }
</style>
