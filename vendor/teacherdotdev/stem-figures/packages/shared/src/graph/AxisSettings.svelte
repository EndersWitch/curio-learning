<script lang="ts">
  // One axis's settings group: its range (From, To, Count by), how often it's
  // numbered, the label at its arrow, and how each end finishes. A site whose
  // ranges take more than plain numbers passes its own `field` for them (Math
  // types them in Caret, so they can be 3π/2); `children` adds fields of the
  // generator's own after the range.
  import type { Component, Snippet } from 'svelte'
  import { MoveRight, MoveUp } from '@lucide/svelte'
  import Section from '../Section.svelte'
  import LabelField from '../LabelField.svelte'
  import CapPicker from './CapPicker.svelte'
  import { CAPS, type Cap } from './caps'
  import { axisSummary, type Axis, type AxisName, type LabelMode } from './axes'

  interface Props {
    axis: AxisName
    /** The range as numbers, and the messages about what was typed. */
    read: Axis
    problems: Record<string, string | null>
    from: string
    to: string
    step: string
    every: number
    labelMode: LabelMode
    label: string
    startCap: Cap
    endCap: Cap
    /** Written into the summary after the step, like "trig in degrees". */
    extras?: string[]
    /** Takes id, aria-invalid and a bindable value; a text box unless given. */
    field?: Component<any>
    children?: Snippet
  }
  let {
    axis, read, problems, extras = [], field: Field, children,
    from = $bindable(), to = $bindable(), step = $bindable(), every = $bindable(),
    labelMode = $bindable(), label = $bindable(), startCap = $bindable(), endCap = $bindable(),
  }: Props = $props()

  const heading = $derived(`${axis}-axis`)
  // Each axis runs from its start end (left/bottom) to its end end (right/top).
  const ENDS = {
    x: [['Left end', 'left'], ['Right end', 'right']],
    y: [['Bottom end', 'down'], ['Top end', 'up']],
  } as const
  const EVERY_OPTIONS: [number, string][] = [
    [1, 'Every line'],
    [2, 'Every 2nd line'],
    [5, 'Every 5th line'],
    [10, 'Every 10th line'],
    [0, 'No numbers'],
  ]
  type RangeKey = 'From' | 'To' | 'Step'
  const get = (key: RangeKey) => (key === 'From' ? from : key === 'To' ? to : step)
  function set(key: RangeKey, v: string) {
    if (key === 'From') from = v
    else if (key === 'To') to = v
    else step = v
  }
  const summary = $derived(axisSummary(read, { every, labelMode, label, startCap, endCap }, extras))
</script>

{#snippet range(key: RangeKey, name: string)}
  <div class="range-field">
    <label for="{axis}-{key}">{name}</label>
    {#if Field}
      <Field id="{axis}-{key}" aria-invalid={!!problems[`${axis}${key}`]} bind:value={() => get(key), (v: string) => set(key, v)} />
    {:else}
      <input type="text" inputmode="decimal" id="{axis}-{key}" aria-invalid={!!problems[`${axis}${key}`]} bind:value={() => get(key), (v) => set(key, v)} />
    {/if}
  </div>
{/snippet}

<Section title={heading} icon={axis === 'x' ? MoveRight : MoveUp} {summary}>
  <div class="grid-fields">
    {@render range('From', 'From')}
    {@render range('To', 'To')}
    {@render range('Step', 'Count by')}
  </div>
  {#each ['From', 'To', 'Step'] as key}
    {#if problems[`${axis}${key}`]}<p class="help problem">{problems[`${axis}${key}`]}</p>{/if}
  {/each}
  {@render children?.()}
  <label class="field">
    Numbers
    <select bind:value={every}>
      {#each EVERY_OPTIONS as [v, name]}<option value={v}>{name}</option>{/each}
    </select>
  </label>
  <div class="field">
    <span>Label <span class="hint">at the {axis === 'x' ? 'right' : 'top'} end</span></span>
    <LabelField name="{heading} label" placeholder={axis} blank={false} bind:mode={labelMode} bind:text={label} />
  </div>
  <div class="ends">
    <div class="field">
      <span>{ENDS[axis][0][0]}</span>
      <CapPicker options={CAPS} label="{heading} {ENDS[axis][0][0].toLowerCase()}" direction={ENDS[axis][0][1]} bind:value={startCap} />
    </div>
    <div class="field">
      <span>{ENDS[axis][1][0]}</span>
      <CapPicker options={CAPS} label="{heading} {ENDS[axis][1][0].toLowerCase()}" direction={ENDS[axis][1][1]} bind:value={endCap} />
    </div>
  </div>
</Section>

<style>
  .grid-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.75rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-field input { width: 100%; min-width: 0; }
  .grid-fields ~ .help { margin: -0.3rem 0 0.75rem; font-size: 0.84rem; }
  .help.problem { color: var(--red); font-weight: 600; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .ends { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .ends .field { margin-bottom: 0; }
</style>
