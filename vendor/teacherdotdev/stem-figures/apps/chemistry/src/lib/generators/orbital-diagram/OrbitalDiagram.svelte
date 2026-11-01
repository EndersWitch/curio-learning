<script lang="ts">
  // Orbital Diagram: pick an element and charge and get the atom or ion's
  // ground-state orbital diagram, drawn the way the class's textbook draws
  // it, with parts left blank for students, or changed into a wrong or
  // excited-state diagram for a "which rule is broken?" question.
  import { Atom, ListOrdered, Palette, PencilLine, RotateCcw, Type, Wrench } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import OrbitalEditor from './OrbitalEditor.svelte'
  import OrbitalFigure from './OrbitalFigure.svelte'
  import { VERDICT_NAMES } from './check'
  import { CONFIGURATION_RULES, SUBLEVEL_ORDERS, isException, writtenConfiguration, type ConfigurationRule, type SublevelOrder } from './configuration'
  import { MAX_EXTRA, buildDiagram, tidyChanges, type OrbitalFill } from './diagram'
  import { ELEMENTS, element } from './elements'
  import {
    ARRANGEMENTS,
    ARROW_STYLES,
    MAX_CHARGE,
    MIN_CHARGE,
    ORBITAL_STYLES,
    TEXT_MODES,
    answerLines,
    changeCount,
    checkSettings,
    groundState,
    isChanged,
    liveChanges,
    orbitalSettings,
    species,
    teacherDiagram,
    type Arrangement,
    type ArrowStyle,
    type OrbitalStyle,
    type TextMode,
  } from './settings'

  const gen = generatorState(orbitalSettings, 'orbital-diagram')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const RULE_NAMES: Record<ConfigurationRule, string> = { real: 'Real', filling: 'Filling order' }
  const ORDER_NAMES: Record<SublevelOrder, string> = { filling: 'Filling order', shell: 'By shell' }
  const ARROW_NAMES: Record<ArrowStyle, string> = { full: 'Full arrows', half: 'Half arrows' }
  const ORBITAL_NAMES: Record<OrbitalStyle, string> = { squares: 'Squares', lines: 'Lines' }
  const ARRANGEMENT_NAMES: Record<Arrangement, string> = { row: 'In a row', energy: 'By energy' }
  const SYMBOL_NAMES: Record<TextMode, string> = { text: 'Symbol', blank: 'Blank line', none: 'None' }
  const LABEL_NAMES: Record<TextMode, string> = { text: 'Shown', blank: 'Blank lines', none: 'None' }
  const LINE_NAMES: Record<TextMode, string> = { text: 'Written', blank: 'Blank line', none: 'None' }

  const ground = $derived(groundState(s))
  const electrons = $derived(s.z - s.charge)
  const changed = $derived(isChanged(s))
  const check = $derived(checkSettings(s))
  const exception = $derived(isException(s.z))

  const atomSummary = $derived(`${species(s)}, ${element(s.z).name.toLowerCase()}${s.charge ? ' ion' : ''}, ${electrons} electron${electrons === 1 ? '' : 's'}`)
  const configSummary = $derived(writtenConfiguration(ground, s.order, s.core) || 'No electrons')
  const lookSummary = $derived(
    `${ARROW_NAMES[s.arrows]}, ${ORBITAL_NAMES[s.orbitals].toLowerCase()}${s.arrangement === 'energy' ? ', by energy' : ''}`,
  )
  const studentSummary = $derived.by(() => {
    const parts = [
      s.symbol === 'blank' && 'blank symbol',
      s.labels === 'blank' && 'blank labels',
      !s.electrons && 'empty orbitals',
      s.configLine === 'text' && 'configuration written',
      s.configLine === 'blank' && 'blank configuration',
    ].filter(Boolean) as string[]
    const text = parts.join(', ') || 'nothing left blank'
    return text[0].toUpperCase() + text.slice(1)
  })
  const changeSummary = $derived(
    changed ? `${changeCount(s)} orbital${changeCount(s) === 1 ? '' : 's'} changed, ${VERDICT_NAMES[check.verdict].toLowerCase()}` : 'Ground state',
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another element, charge or rule has another ground state, so the
   *  teacher's changes no longer mean anything and are cleared. */
  function setAtom(z: number, charge: number, rule: ConfigurationRule) {
    Object.assign(s, orbitalSettings.tidy({ ...$state.snapshot(s), z, charge, rule, changes: {} }))
  }

  function setOrbitals(name: string, orbitals: OrbitalFill[]) {
    s.changes = tidyChanges({ ...liveChanges(s), [name]: orbitals }, ground, s)
  }
</script>

{#snippet radios(label: string, options: readonly string[], names: Record<string, string>, value: string, set: (v: any) => void)}
  <p class="field-label">{label}</p>
  <div class="segmented" role="radiogroup" aria-label={label}>
    {#each options as option (option)}
      <button type="button" role="radio" aria-checked={value === option} class:on={value === option} onclick={() => set(option)}>
        {names[option]}
      </button>
    {/each}
  </div>
{/snippet}

<GeneratorPage name="Orbital Diagram" filename="orbital-diagram" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Atom or ion" summary={atomSummary} icon={Atom} open>
      <div class="atom">
        <label class="field">
          <span>Element</span>
          <select value={s.z} onchange={(e) => setAtom(Number(e.currentTarget.value), s.charge, s.rule)}>
            {#each ELEMENTS as el (el.z)}
              <option value={el.z}>{el.z} · {el.symbol} · {el.name}</option>
            {/each}
          </select>
        </label>
        <label class="field charge">
          <span>Charge</span>
          <input
            type="number"
            min={Math.max(MIN_CHARGE, s.z - ELEMENTS.length)}
            max={Math.min(MAX_CHARGE, s.z)}
            value={s.charge}
            oninput={(e) => Number.isFinite(e.currentTarget.valueAsNumber) && setAtom(s.z, e.currentTarget.valueAsNumber, s.rule)}
            onchange={(e) => (e.currentTarget.value = String(s.charge))}
          />
        </label>
      </div>
      {#if exception}
        <p class="note">
          {element(s.z).name} is an exception: its real ground state isn’t what the filling order predicts.
          {s.rule === 'real' ? 'It’s drawn as it really is.' : 'It’s drawn as the filling order predicts.'}
        </p>
      {/if}
    </Section>
    <Section title="Configuration" summary={configSummary} icon={ListOrdered}>
      <label class="check">
        <input type="checkbox" bind:checked={s.core} />
        <span>
          <strong>Noble gas core</strong>
          <small>Write the core in brackets, like [Ar], and draw only the orbitals after it.</small>
        </span>
      </label>
      {@render radios('Order', SUBLEVEL_ORDERS, ORDER_NAMES, s.order, (order) => (s.order = order))}
      <p class="note">
        {s.order === 'filling' ? '4s comes before 3d, in the order they fill.' : '3d comes before 4s, grouped by shell.'}
        {s.arrangement === 'energy' ? 'Stacked by energy, the order changes only the written configuration.' : ''}
      </p>
      {@render radios('Exceptions', CONFIGURATION_RULES, RULE_NAMES, s.rule, (rule) => setAtom(s.z, s.charge, rule))}
      <p class="note">
        {s.rule === 'real'
          ? 'Cr, Cu, Ag, Au, Pd and a few others are drawn as they really are (Cr is [Ar] 4s¹ 3d⁵).'
          : 'Every element is drawn as the filling order predicts (Cr is [Ar] 4s² 3d⁴).'}
      </p>
    </Section>
    <Section title="Look" summary={lookSummary} icon={Palette}>
      {@render radios('Arrows', ARROW_STYLES, ARROW_NAMES, s.arrows, (arrows) => (s.arrows = arrows))}
      {@render radios('Orbitals', ORBITAL_STYLES, ORBITAL_NAMES, s.orbitals, (orbitals) => (s.orbitals = orbitals))}
      {@render radios('Arrangement', ARRANGEMENTS, ARRANGEMENT_NAMES, s.arrangement, (arrangement) => (s.arrangement = arrangement))}
      <p class="note">
        {s.arrangement === 'row'
          ? 'Sublevels side by side, wrapping onto more rows.'
          : 'Each sublevel a step higher than the one before it in filling order, with s, p, d and f in their own columns.'}
      </p>
    </Section>
    <Section title="For the student" summary={studentSummary} icon={PencilLine}>
      {@render radios('Symbol', TEXT_MODES, SYMBOL_NAMES, s.symbol, (symbol) => (s.symbol = symbol))}
      {@render radios('Sublevel labels', TEXT_MODES, LABEL_NAMES, s.labels, (labels) => (s.labels = labels))}
      {@render radios('Electrons', ['shown', 'empty'] as const, { shown: 'Shown', empty: 'Empty orbitals' }, s.electrons ? 'shown' : 'empty', (v) => (s.electrons = v === 'shown'))}
      {@render radios('Configuration line', ['none', 'text', 'blank'] as const, LINE_NAMES, s.configLine, (line) => (s.configLine = line))}
      <p class="note">The answer key always gives the symbol and configuration.</p>
    </Section>
    <Section title="Changes" summary={changeSummary} icon={Wrench}>
      <p class="note first">Click an orbital to change its electrons, for a “which rule is broken?” question.</p>
      <OrbitalEditor diagram={teacherDiagram(s)} ground={buildDiagram(ground, s)} onchange={setOrbitals} />
      <label class="field extra">
        <span>Empty sublevels after the last</span>
        <input
          type="number"
          min="0"
          max={MAX_EXTRA}
          value={s.extra}
          oninput={(e) => Number.isFinite(e.currentTarget.valueAsNumber) && (s.extra = Math.min(MAX_EXTRA, Math.max(0, Math.round(e.currentTarget.valueAsNumber))))}
          onchange={(e) => (e.currentTarget.value = String(s.extra))}
        />
      </label>
      {#if changed}
        <div class="verdict" role="status">
          <strong>{VERDICT_NAMES[check.verdict]}</strong>
          {#if check.mistakes.length}
            <ul>
              {#each check.mistakes as mistake (mistake)}<li>{mistake}</li>{/each}
            </ul>
          {:else}
            <p>The changes still give the ground state.</p>
          {/if}
        </div>
        <button type="button" class="btn-ghost small" onclick={() => (s.changes = {})}><RotateCcw size={17} aria-hidden="true" /> Back to correct</button>
      {/if}
      {#if !s.electrons}
        <p class="note">Electrons are hidden, so the figure shows empty orbitals.</p>
      {/if}
    </Section>
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLines(s).join(' · ')} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <OrbitalFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .atom { display: flex; gap: 0.75rem; align-items: flex-end; }
  .field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.9rem; font-weight: 700; }
  .atom .field:first-child { flex: 1; min-width: 0; }
  .field select, .field input { font-weight: 400; }
  .charge input { width: 5rem; font-variant-numeric: tabular-nums; }
  .extra { flex-direction: row; align-items: center; gap: 0.6rem; margin-top: 0.9rem; font-weight: 400; color: var(--muted); font-size: 0.86rem; }
  .extra input { width: 4.2rem; }
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .note.first { margin-top: 0.2rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
  .verdict { margin: 0.9rem 0 0.7rem; padding: 0.6rem 0.75rem; border-radius: 10px; background: var(--blue-soft); font-size: 0.86rem; }
  .verdict ul { margin: 0.35rem 0 0; padding-left: 1.1rem; }
  .verdict p { margin: 0.3rem 0 0; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
</style>
