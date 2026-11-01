<script lang="ts">
  // Photoelectron Spectrum: pick an element, H to Xe, and get its
  // photoelectron spectrum as AP draws it, one peak per sublevel as tall as
  // its electrons, binding energy falling to the right, with a second element
  // dashed behind it to compare and the element hidden for "which element is
  // this?" questions.
  import { Activity, Atom, PencilLine, Ruler, Type } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { atomConfiguration, isException, writtenConfiguration } from '../orbital-diagram/configuration'
  import { ELEMENTS, element } from '../orbital-diagram/elements'
  import { MAX_PES_Z } from './energies'
  import PesFigure from './PesFigure.svelte'
  import { UNITS, type Unit } from './spectrum'
  import {
    PEAK_NAMES,
    PEAK_STYLES,
    SCALES,
    SCALE_NAMES,
    TEXT_MODES,
    answerLines,
    pesSettings,
    symbolOf,
    type PeakStyle,
    type Scale,
    type TextMode,
  } from './settings'

  const gen = generatorState(pesSettings, 'photoelectron-spectrum')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  let svg = $state<SVGSVGElement>()

  const CHOICES = ELEMENTS.slice(0, MAX_PES_Z)
  const UNIT_NAMES: Record<Unit, string> = { 'MJ/mol': 'MJ/mol', eV: 'eV' }
  const LABEL_NAMES: Record<TextMode, string> = { text: 'Shown', blank: 'Blank lines', none: 'None' }
  const SCALE_NOTES: Record<Scale, string> = {
    log: 'Each step along the axis is ten times the energy, so core and valence peaks both fit.',
    broken: 'A linear stretch for each group of peaks, with break marks between them.',
    linear: 'Evenly spaced from 0. Valence peaks crowd together at the right.',
  }

  const elementSummary = $derived(
    `${element(clean.z).name}${clean.compare ? ` and ${element(clean.compare).name.toLowerCase()}` : ''}, ${writtenConfiguration(atomConfiguration(clean.z))}`,
  )
  const axisSummary = $derived(`${SCALE_NAMES[clean.scale]}, ${clean.unit}`)
  const peakSummary = $derived(
    [PEAK_NAMES[clean.peaks], clean.sublevels === 'text' ? 'labeled' : clean.sublevels === 'blank' ? 'blank labels' : 'unlabeled', clean.energies && 'energies', clean.counts && 'electron counts']
      .filter(Boolean)
      .join(', '),
  )
  const studentSummary = $derived(
    [clean.names ? 'Element named' : 'Element hidden', clean.yNumbers ? 'electrons numbered' : 'electrons not numbered'].join(', '),
  )
  const textSummary = $derived(
    [clean.titleMode === 'text' && clean.title ? `“${clean.title}”` : 'No title', clean.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )
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

{#snippet check(label: string, hint: string, checked: boolean, set: (v: boolean) => void)}
  <label class="check">
    <input type="checkbox" {checked} onchange={(e) => set(e.currentTarget.checked)} />
    <span><strong>{label}</strong><small>{hint}</small></span>
  </label>
{/snippet}

<GeneratorPage name="Photoelectron Spectrum" filename="photoelectron-spectrum" settingsWidth={26} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet settings()}
    <Section title="Element" summary={elementSummary} icon={Atom} open>
      <label class="field">
        <span>Element</span>
        <select bind:value={s.z}>
          {#each CHOICES as el (el.z)}<option value={el.z}>{el.z} · {el.symbol} · {el.name}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Compare with <span class="hint">drawn dashed behind it</span></span>
        <select bind:value={s.compare}>
          <option value={0}>None</option>
          {#each CHOICES.filter((el) => el.z !== s.z) as el (el.z)}<option value={el.z}>{el.z} · {el.symbol} · {el.name}</option>{/each}
        </select>
      </label>
      {#if isException(clean.z)}
        <p class="note">{element(clean.z).name} is an exception: its peaks follow its real ground state, {writtenConfiguration(atomConfiguration(clean.z))}.</p>
      {/if}
      <p class="note">
        Binding energies are the free atom’s, from the textbook table (H to Ca) and Lotz (1970) for Sc to Xe.
      </p>
    </Section>

    <Section title="Energy axis" summary={axisSummary} icon={Ruler}>
      {@render radios('Scale', SCALES, SCALE_NAMES, s.scale, (scale) => (s.scale = scale))}
      <p class="note">{SCALE_NOTES[clean.scale]}</p>
      {@render radios('Units', UNITS, UNIT_NAMES, s.unit, (unit) => (s.unit = unit))}
      <p class="note">1 MJ/mol is 10.36 eV. Binding energy falls from left to right, as AP draws it.</p>
      {@render check('Gridlines', 'A light line across at each number of electrons.', s.gridlines, (v) => (s.gridlines = v))}
    </Section>

    <Section title="Peaks" summary={peakSummary} icon={Activity}>
      {@render radios('Drawn as', PEAK_STYLES, PEAK_NAMES, s.peaks, (peaks: PeakStyle) => (s.peaks = peaks))}
      {@render radios('Sublevel labels', TEXT_MODES, LABEL_NAMES, s.sublevels, (sublevels: TextMode) => (s.sublevels = sublevels))}
      {@render check('Electron counts', 'Write each peak’s number of electrons over it, like 2p⁶.', s.counts, (v) => (s.counts = v))}
      {@render check('Binding energies', `Write each peak’s energy over it, in ${clean.unit}.`, s.energies, (v) => (s.energies = v))}
    </Section>

    <Section title="For the student" summary={studentSummary} icon={PencilLine}>
      {@render check(
        'Element names',
        clean.compare ? `Name ${symbolOf(clean.z)} and ${symbolOf(clean.compare)} in the key, or call them A and B.` : `Name ${symbolOf(clean.z)} over the spectrum.`,
        s.names,
        (v) => (s.names = v),
      )}
      {@render check('Numbered electrons axis', 'Number the electrons axis, so peak heights can be read.', s.yNumbers, (v) => (s.yNumbers = v))}
      <p class="note">The answer key always names the element and its configuration.</p>
    </Section>

    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLines(clean).join(' · ')} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <PesFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.9rem; font-weight: 700; margin-bottom: 0.75rem; }
  .field select { font-weight: 400; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0.2rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
</style>
