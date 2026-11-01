<script lang="ts">
  // Mitosis & Meiosis: pick mitosis or meiosis, a chromosome number and an
  // animal or plant cell, then show one phase or a strip of phases, with
  // the chromosomes right for each. Settings live in the page address.
  import { Dices, Dna, LayoutGrid, Palette, Sparkles, Tags, Type } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import CellDivisionFigure from './CellDivisionFigure.svelte'
  import { cellDivisionFigure, structureName } from './figure'
  import { DIPLOID_NUMBERS, PHASE_NAMES, matchingPhase, phasesOf, type Phase, type Process } from './model'
  import { STARTERS } from './presets'
  import {
    COUNT_LABELS,
    LABEL_STYLES,
    PER_ROW,
    PHASE_LABELS,
    STRUCTURES,
    cellDivisionSettings,
    newSeed,
    pairsOf,
    stripPhases,
    structuresOn,
    type CellDivisionSettings,
  } from './settings'

  const gen = generatorState(cellDivisionSettings, 'cell-division')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const PROCESS_NAMES: Record<Process, string> = { mitosis: 'Mitosis', meiosis: 'Meiosis' }
  const PHASE_LABEL_NAMES: Record<(typeof PHASE_LABELS)[number], string> = { name: 'Names', number: 'Numbers', blank: 'Blank lines', none: 'None' }
  const COUNT_NAMES: Record<(typeof COUNT_LABELS)[number], string> = { none: 'None', ploidy: '2n = 4', count: '4 chromosomes' }
  const STYLE_NAMES: Record<(typeof LABEL_STYLES)[number], string> = { names: 'Names', letters: 'Letters', blank: 'Blank lines' }

  const fig = $derived(cellDivisionFigure(s))
  const phases = $derived(phasesOf(s.process))
  const strip = $derived(stripPhases(s))
  const n = $derived(pairsOf(s))

  const divisionSummary = $derived(
    `${PROCESS_NAMES[s.process]}, 2n = ${s.diploid}, ${s.cell}${s.process === 'meiosis' && s.crossingOver ? ', crossing over' : ''}`,
  )
  const phaseSummary = $derived(
    s.layout === 'single' ? PHASE_NAMES[s.phase] : `Strip of ${strip.length}${s.order === 'shuffled' ? ', shuffled' : ''}`,
  )
  const labelSummary = $derived(
    [
      s.phaseLabels === 'none' ? 'No phase labels' : `Phase ${PHASE_LABEL_NAMES[s.phaseLabels].toLowerCase()}`,
      s.countLabels !== 'none' && COUNT_NAMES[s.countLabels],
      s.layout === 'single' && structuresOn(s).length && `${structuresOn(s).length} structures`,
      s.key && 'key',
    ]
      .filter(Boolean)
      .join(', '),
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  const sameAs = (preset: Partial<CellDivisionSettings>) => gen.same(gen.snapshot(), cellDivisionSettings.tidy({ ...cellDivisionSettings.defaults, ...preset }))
  const start = (preset: Partial<CellDivisionSettings>) => gen.apply(cellDivisionSettings.tidy({ ...cellDivisionSettings.defaults, ...preset }))

  function setProcess(process: Process) {
    s.phase = matchingPhase(s.phase, process)
    s.process = process
  }

  /** Add or take out a phase from the strip, keeping at least one. */
  function toggle(phase: Phase, on: boolean) {
    const list = phasesOf(s.process).filter((p) => (p === phase ? on : strip.includes(p)))
    if (!list.length) return
    if (s.process === 'mitosis') s.mitosisPhases = list as CellDivisionSettings['mitosisPhases']
    else s.meiosisPhases = list as CellDivisionSettings['meiosisPhases']
  }
</script>

{#snippet check(label: string, note: string, checked: boolean, set: (v: boolean) => void, disabled = false)}
  <label class="check" class:disabled>
    <input type="checkbox" {checked} {disabled} onchange={(e) => set(e.currentTarget.checked)} />
    <span><strong>{label}</strong>{#if note}<small>{note}</small>{/if}</span>
  </label>
{/snippet}

<GeneratorPage name="Mitosis & Meiosis" filename="cell-division" settingsWidth={26} bind:labelSize={s.labelSize} {gen} {svg}>
  {#snippet settings()}
    <Section title="Starting points" summary={STARTERS.find((p) => sameAs(p.settings))?.name ?? 'Your own settings'} icon={Sparkles}>
      <div class="chips starters">
        {#each STARTERS as preset (preset.name)}
          <button type="button" class="chip" class:on={sameAs(preset.settings)} onclick={() => start(preset.settings)}>{preset.name}</button>
        {/each}
      </div>
    </Section>

    <Section title="Cell division" summary={divisionSummary} icon={Dna} open>
      <div class="segmented" role="radiogroup" aria-label="Process">
        {#each ['mitosis', 'meiosis'] as const as process (process)}
          <button type="button" role="radio" aria-checked={s.process === process} class:on={s.process === process} onclick={() => setProcess(process)}>
            {PROCESS_NAMES[process]}
          </button>
        {/each}
      </div>
      <p class="field-label">Chromosome number</p>
      <div class="chips" role="radiogroup" aria-label="Chromosome number">
        {#each DIPLOID_NUMBERS as d (d)}
          <button type="button" role="radio" aria-checked={s.diploid === d} class="chip" class:on={s.diploid === d} onclick={() => (s.diploid = d)}>2n = {d}</button>
        {/each}
      </div>
      <p class="note">
        {n} homologous pair{n === 1 ? '' : 's'}, each a different size, with one chromosome from each parent{s.process === 'meiosis'
          ? `. Meiosis makes cells with n = ${n}.`
          : '.'}
      </p>
      <p class="field-label">Cell</p>
      <div class="segmented" role="radiogroup" aria-label="Cell">
        {#each ['animal', 'plant'] as const as cell (cell)}
          <button type="button" role="radio" aria-checked={s.cell === cell} class:on={s.cell === cell} onclick={() => (s.cell = cell)}>
            {cell === 'animal' ? 'Animal' : 'Plant'}
          </button>
        {/each}
      </div>
      <p class="note">
        {s.cell === 'animal'
          ? 'Centrioles and asters at the spindle poles, and a cleavage furrow pinching the cell in two.'
          : 'A cell wall, a spindle with no centrioles, and a cell plate forming between the new cells.'}
      </p>
      {#if s.process === 'meiosis'}
        {@render check(
          'Crossing over',
          'Nonsister chromatids of each tetrad swap the ends of their long arms in prophase I, and every later cell carries the swap.',
          s.crossingOver,
          (v) => (s.crossingOver = v),
        )}
      {/if}
    </Section>

    <Section title="Phases" summary={phaseSummary} icon={LayoutGrid} open>
      <div class="segmented" role="radiogroup" aria-label="Layout">
        {#each ['strip', 'single'] as const as layout (layout)}
          <button type="button" role="radio" aria-checked={s.layout === layout} class:on={s.layout === layout} onclick={() => (s.layout = layout)}>
            {layout === 'strip' ? 'A strip of phases' : 'One phase'}
          </button>
        {/each}
      </div>
      {#if s.layout === 'single'}
        <label class="field below">
          <span>Phase</span>
          <select bind:value={s.phase}>
            {#each phases as phase (phase)}
              <option value={phase}>{PHASE_NAMES[phase]}</option>
            {/each}
          </select>
        </label>
      {:else}
        <p class="field-label">In the strip</p>
        <div class="phases">
          {#each phases as phase (phase)}
            <label class="phase">
              <input type="checkbox" checked={strip.includes(phase)} onchange={(e) => toggle(phase, e.currentTarget.checked)} />
              {PHASE_NAMES[phase]}
            </label>
          {/each}
        </div>
        <p class="field-label">Order</p>
        <div class="spacing">
          <div class="segmented" role="radiogroup" aria-label="Order">
            {#each ['in-order', 'shuffled'] as const as order (order)}
              <button type="button" role="radio" aria-checked={s.order === order} class:on={s.order === order} onclick={() => (s.order = order)}>
                {order === 'in-order' ? 'In order' : 'Shuffled'}
              </button>
            {/each}
          </div>
          {#if s.order === 'shuffled'}
            <button type="button" class="btn-ghost small" onclick={() => (s.seed = newSeed())}><Dices size={17} aria-hidden="true" /> Shuffle</button>
          {/if}
        </div>
        {#if s.order === 'shuffled'}
          <p class="note">For students to put in order. Number the phases and turn on the answer key for the right order.</p>
        {/if}
        <label class="field below">
          <span>Phases per row</span>
          <select bind:value={s.perRow}>
            {#each PER_ROW as per (per)}
              <option value={per}>{per === 'auto' ? 'Automatic' : per}</option>
            {/each}
          </select>
        </label>
      {/if}
    </Section>

    <Section title="Labels" summary={labelSummary} icon={Tags}>
      <p class="field-label first">Phase names</p>
      <div class="segmented" role="radiogroup" aria-label="Phase names">
        {#each PHASE_LABELS as mode (mode)}
          <button type="button" role="radio" aria-checked={s.phaseLabels === mode} class:on={s.phaseLabels === mode} onclick={() => (s.phaseLabels = mode)}>
            {PHASE_LABEL_NAMES[mode]}
          </button>
        {/each}
      </div>
      <p class="field-label">Chromosome number under each cell</p>
      <div class="segmented" role="radiogroup" aria-label="Chromosome number under each cell">
        {#each COUNT_LABELS as mode (mode)}
          <button type="button" role="radio" aria-checked={s.countLabels === mode} class:on={s.countLabels === mode} onclick={() => (s.countLabels = mode)}>
            {mode === 'ploidy' ? `2n = ${s.diploid}` : mode === 'count' ? 'Count' : 'None'}
          </button>
        {/each}
      </div>
      {#if s.countLabels !== 'none'}
        <p class="note">In anaphase and telophase, each set of chromosomes heading for a new cell is labeled.</p>
      {/if}
      <p class="field-label">Structures</p>
      {#if s.layout === 'strip'}
        <p class="note first">Structure labels show on one phase. Choose One phase under Phases to label it.</p>
      {/if}
      <div class="structures" class:off={s.layout === 'strip'}>
        {#each STRUCTURES as k (k)}
          <label class="phase">
            <input type="checkbox" bind:checked={s[k]} disabled={s.layout === 'strip'} />
            {k === 'division' ? (s.cell === 'plant' ? 'Cell plate' : 'Cleavage furrow') : k === 'pair' ? 'Tetrad or homologous pair' : structureName(k, s)}
          </label>
        {/each}
      </div>
      {#if s.layout === 'single' && fig.missing.length}
        <p class="note">Not in {PHASE_NAMES[s.phase]}: {fig.missing.map((k) => structureName(k, s).toLowerCase()).join(', ')}.</p>
      {/if}
      {#if s.layout === 'single'}
        <div class="segmented below" role="radiogroup" aria-label="Structure labels as">
          {#each LABEL_STYLES as style (style)}
            <button type="button" role="radio" aria-checked={s.labelStyle === style} class:on={s.labelStyle === style} onclick={() => (s.labelStyle = style)}>
              {STYLE_NAMES[style]}
            </button>
          {/each}
        </div>
      {/if}
      {@render check(
        'Maternal and paternal key',
        s.ink === 'color' ? 'Dark chromosomes came from the mother, light ones from the father.' : 'Solid chromosomes came from the mother, outlined ones from the father.',
        s.key,
        (v) => (s.key = v),
      )}
    </Section>

    <Section title="Color" summary={s.ink === 'color' ? 'Color' : 'Black and white'} icon={Palette}>
      <div class="segmented" role="radiogroup" aria-label="Color">
        {#each ['color', 'bw'] as const as ink (ink)}
          <button type="button" role="radio" aria-checked={s.ink === ink} class:on={s.ink === ink} onclick={() => (s.ink = ink)}>
            {ink === 'color' ? 'Color' : 'Black and white'}
          </button>
        {/each}
      </div>
      <p class="note">
        {s.ink === 'color'
          ? 'Each homologous pair in its own color: dark from the mother, light from the father.'
          : 'For photocopies: chromosomes from the mother solid, from the father outlined.'}
      </p>
    </Section>

    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={fig.answer.replaceAll('\n', '   ')} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <CellDivisionFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label.first { margin-top: 0.35rem; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.9rem; font-weight: 700; }
  .field select { font-weight: 400; }
  .below { margin-top: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .note.first { margin: 0 0 0.4rem; }
  .starters { margin-top: 0.35rem; }
  .starters .chip { font-size: 0.85rem; padding: 0.4rem 0.8rem; }
  .phases, .structures { display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem 0.75rem; }
  .structures.off { opacity: 0.55; }
  .phase { display: flex; align-items: center; gap: 0.45rem; font-size: 0.88rem; cursor: pointer; }
  .phase input { width: 1rem; height: 1rem; margin: 0; accent-color: var(--blue); }
  .spacing { display: flex; align-items: center; gap: 0.6rem; }
  .spacing .segmented { flex: 1; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
</style>
