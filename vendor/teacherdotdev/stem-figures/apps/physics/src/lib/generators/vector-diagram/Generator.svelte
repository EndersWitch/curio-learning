<script lang="ts">
  // The Vector Diagram Generator: the vectors, their resultant and the grid on
  // the left, the figure on the right. Settings live in the page address.
  import { ChevronDown, Grid3x3, MoveUpRight, Plus, Sigma, Trash2 } from '@lucide/svelte'
  import { SvelteSet } from 'svelte/reactivity'
  import Choice from '$lib/shared/Choice.svelte'
  import DirectionField from '$lib/shared/DirectionField.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import FigureOptions from '$lib/shared/FigureOptions.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import { componentLabel, type Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import { MAX_VECTORS, newVector, onAxis, vectorSettings, type ArrowStyle } from './settings'
  import { resultantOf } from './vd'
  import VectorDiagram from './VectorDiagram.svelte'

  const gen = createGenerator(vectorSettings, 'vector-diagram')
  const s = $derived(gen.snapshot())

  const STYLES: [ArrowStyle, string][] = [
    ['solid', 'Drawn'],
    ['dashed', 'Dashed'],
    ['none', 'Left off'],
  ]
  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const round = (n: number, places: number) => String(Math.round(n * 10 ** places) / 10 ** places)
  const squares = (n: number) => `${round(n, 2)} square${n === 1 ? '' : 's'}`

  const vectorsSummary = $derived(s.vectors.map((v) => shown(v.label)).join(', ') || 'none')
  const sum = $derived(resultantOf(s))
  const resultantSummary = $derived(
    !s.vectors.length || !sum.magnitude ? 'none' : `${squares(sum.magnitude)} at ${round(sum.angle, 1)}°${s.resultant === 'none' ? ' · left off' : ''}`,
  )
  const gridSummary = $derived([s.grid ? 'grid' : '', s.axes ? 'axes' : ''].filter(Boolean).join(' · ') || 'none')

  const full = $derived(s.vectors.length >= MAX_VECTORS)
  // Each vector folds up to a one-line summary. They start folded, except one just added.
  // The rows' open state is kept here, since the row is redrawn whenever its summary changes.
  const unfolded = new SvelteSet<unknown>()
  const add = () => {
    if (full) return
    gen.s.vectors.push(newVector(gen.s.vectors.length))
    unfolded.add(gen.s.vectors.at(-1))
  }
  const toggle = (e: Event, vector: unknown) => {
    if ((e.currentTarget as HTMLDetailsElement).open) unfolded.add(vector)
    else unfolded.delete(vector)
  }
  const remove = (e: Event, i: number) => {
    // The button is inside the row's summary, so don't let the click fold it too.
    e.preventDefault()
    gen.s.vectors.splice(i, 1)
  }
  const styleName = { solid: '', dashed: 'dashed', none: 'left off' } as const
  const rowSummary = (v: (typeof s.vectors)[number]) =>
    [shown(v.label), `${squares(v.magnitude)} at ${v.angle}°`, styleName[v.style]].filter(Boolean).join(' · ')

  // Turning components on names them after the arrow (B → B_x), unless the teacher already named them.
  function nameComponents(name: Label, labels: Label[], defaults: string[]) {
    if (name.mode !== 'text') return
    labels.forEach((l, i) => {
      if (l.mode === 'text' && l.text === defaults[i]) l.text = componentLabel(name.text, i ? 'y' : 'x')
    })
  }
</script>

<GeneratorPage name="Vector Diagram Generator" filename="vector-diagram" {gen}>
  {#snippet settings()}
    <Section title="Vectors" icon={MoveUpRight} summary={vectorsSummary}>
      <p class="note">Drawn to scale, head to tail, in order. One grid square is a magnitude of 1.</p>
      {#each gen.s.vectors as vector, i (vector)}
        <details class="row" open={unfolded.has(vector)} ontoggle={(e) => toggle(e, vector)}>
          <summary class="row-head">
            <span class="chevron"><ChevronDown size={16} aria-hidden="true" /></span>
            <span class="row-text">
              <span class="row-title">Vector {i + 1}</span>
              {#if s.vectors[i]}<span class="row-summary">{rowSummary(s.vectors[i])}</span>{/if}
            </span>
            <button type="button" class="icon-btn" aria-label="Remove vector {i + 1}" data-tip="Remove" onclick={(e) => remove(e, i)}>
              <Trash2 size={17} />
            </button>
          </summary>
          <label class="field">
            Magnitude
            <span class="slider">
              <input type="range" min="0.5" max="12" step="0.5" bind:value={vector.magnitude} />
              <output>{squares(s.vectors[i]?.magnitude ?? 0)}</output>
            </span>
          </label>
          <DirectionField name="Vector {i + 1}" bind:value={vector.angle} />
          <div class="field">Arrow <Choice name="Vector {i + 1} arrow" options={STYLES} bind:value={vector.style} /></div>
          <div class="field">Label <LabelField name="Vector {i + 1} label" bind:label={vector.label} /></div>
          {#if !onAxis(s.vectors[i]?.angle ?? 0)}
            <label class="check"><input type="checkbox" bind:checked={vector.arc} /> Mark its angle</label>
            {#if vector.arc}
              <div class="field">
                Measured from
                <Choice name="Vector {i + 1} angle measured from" options={[['h', 'Horizontal'], ['v', 'Vertical']]} bind:value={vector.from} />
              </div>
              <div class="field">Angle label <LabelField name="Vector {i + 1} angle label" bind:label={vector.arcLabel} /></div>
            {/if}
            <label class="check">
              <input
                type="checkbox"
                bind:checked={vector.parts}
                onchange={(e) => e.currentTarget.checked && nameComponents(vector.label, [vector.xLabel, vector.yLabel], ['A_x', 'A_y'])}
              />
              Show its components
            </label>
            {#if vector.parts}
              <div class="field">Horizontal label <LabelField name="Vector {i + 1} horizontal component label" bind:label={vector.xLabel} /></div>
              <div class="field">Vertical label <LabelField name="Vector {i + 1} vertical component label" bind:label={vector.yLabel} /></div>
            {/if}
          {/if}
        </details>
      {/each}

      <button type="button" class="btn-ghost add" disabled={full} onclick={add}>
        <Plus size={15} aria-hidden="true" />
        {full ? `A figure holds up to ${MAX_VECTORS} vectors` : 'Add a vector'}
      </button>
    </Section>

    <Section title="Resultant" icon={Sigma} summary={resultantSummary}>
      {#if !s.vectors.length}
        <p class="note">Add a vector to draw its resultant.</p>
      {:else if !sum.magnitude}
        <p class="note warning" role="status">The vectors add up to zero, so there's no resultant to draw.</p>
      {:else}
        <p class="note">From the first tail to the last tip: {squares(sum.magnitude)} at {round(sum.angle, 1)}°.</p>
        {#if s.vectors.length === 1 && s.resultant !== 'none'}
          <p class="note warning" role="status">With one vector, the resultant is the same arrow, drawn on top of it.</p>
        {/if}
        <div class="field">Arrow <Choice name="Resultant arrow" options={STYLES} bind:value={gen.s.resultant} /></div>
        <div class="field">Label <LabelField name="Resultant label" bind:label={gen.s.resultantLabel} /></div>
        {#if !onAxis(Math.round(sum.angle * 1000) / 1000)}
          <label class="check"><input type="checkbox" bind:checked={gen.s.resultantArc} /> Mark its angle</label>
          {#if s.resultantArc}
            <div class="field">
              Measured from
              <Choice name="Resultant angle measured from" options={[['h', 'Horizontal'], ['v', 'Vertical']]} bind:value={gen.s.resultantFrom} />
            </div>
            <div class="field">Angle label <LabelField name="Resultant angle label" bind:label={gen.s.resultantArcLabel} /></div>
          {/if}
          <label class="check">
            <input
              type="checkbox"
              bind:checked={gen.s.resultantParts}
              onchange={(e) =>
                e.currentTarget.checked &&
                nameComponents(gen.s.resultantLabel, [gen.s.resultantXLabel, gen.s.resultantYLabel], ['R_x', 'R_y'])}
            />
            Show its components
          </label>
          {#if s.resultantParts}
            <div class="field">Horizontal label <LabelField name="Resultant horizontal component label" bind:label={gen.s.resultantXLabel} /></div>
            <div class="field">Vertical label <LabelField name="Resultant vertical component label" bind:label={gen.s.resultantYLabel} /></div>
          {/if}
        {/if}
      {/if}
    </Section>

    <Section title="Grid and axes" icon={Grid3x3} summary={gridSummary}>
      <label class="check"><input type="checkbox" bind:checked={gen.s.grid} /> Grid</label>
      <label class="check"><input type="checkbox" bind:checked={gen.s.axes} /> x and y axes, from the first tail</label>
    </Section>
    <FigureOptions bind:mirror={gen.s.mirror} bind:color={gen.s.color} />
  {/snippet}

  {#snippet figure()}
    <VectorDiagram settings={s} id="f" />
  {/snippet}
</GeneratorPage>

<style>
  .row { border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
  .row[open] { padding-bottom: 0.75rem; }
  .row-head { display: flex; align-items: center; gap: 0.4rem; cursor: pointer; list-style: none; padding: 0.15rem 0; }
  .row-head::-webkit-details-marker { display: none; }
  .row[open] > .row-head { margin-bottom: 0.25rem; }
  .row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .row-title { font-weight: 800; }
  .row-summary { font-size: 0.8rem; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .row[open] .row-summary { display: none; }
  .chevron { display: inline-flex; color: var(--muted); transform: rotate(-90deg); transition: transform 0.15s; }
  .row[open] .chevron { transform: none; }
  .warning { color: var(--ink); background: #fffbeb; border-left: 3px solid var(--amber); border-radius: 6px; padding: 0.5rem 0.7rem; }
  .add { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; font-size: 0.85rem; border-radius: 9px; }
</style>
