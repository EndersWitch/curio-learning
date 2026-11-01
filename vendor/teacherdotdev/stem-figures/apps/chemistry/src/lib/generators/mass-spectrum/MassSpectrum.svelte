<script lang="ts">
  // Mass Spectrum: pick an element and get a peak at each of its natural
  // isotopes' mass numbers, as tall as its abundance, or type isotopes of
  // your own; hide the element or leave a peak out for students, with the
  // relative atomic mass in the answer key. The grid and axes are
  // $shared/graph's, the same as Titration Curve's.
  import { ChartColumn, PencilLine, Plus, Trash2 } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import AxisSettings from '$shared/graph/AxisSettings.svelte'
  import GridlineSettings from '$shared/graph/GridlineSettings.svelte'
  import TitleSettings from '$shared/graph/TitleSettings.svelte'
  import { readAxes } from '$shared/graph/axes'
  import Section from '$shared/Section.svelte'
  import { element } from '../orbital-diagram/elements'
  import { ISOTOPE_ZS } from './isotopes'
  import { buildMassSpectrum, rangeOf, type Range } from './figure'
  import MassSpectrumFigure from './MassSpectrumFigure.svelte'
  import { elementOf, elementPeaks, massText } from './spectrum'
  import {
    MAX_ISOTOPES,
    MAX_MASS,
    SCALES,
    SCALE_NAMES,
    SOURCES,
    SOURCE_NAMES,
    Y_TITLES,
    atomicMassText,
    massSpectrumSettings,
    peakTexts,
    peaksOf,
    typedTotal,
    workingLine,
    type Scale,
  } from './settings'

  const gen = generatorState(massSpectrumSettings, 'mass-spectrum')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const g = $derived(buildMassSpectrum(clean))
  let svg = $state<SVGSVGElement>()

  const peaks = $derived(peaksOf(clean))
  const texts = $derived(peakTexts(clean))
  const total = $derived(typedTotal(clean))

  // While the x-axis fits the peaks, its boxes show the fitted range;
  // typing in one takes over.
  const shown = $derived<Range>(rangeOf(clean, g.fitted))
  const shownAxes = $derived(readAxes({ ...clean, ...shown }))
  function typeRange(key: keyof Range, v: string) {
    if (s.xFit) Object.assign(s, { ...g.fitted, xFit: false })
    s[key] = v
  }

  function chooseElement(symbol: string) {
    s.element = symbol
    s.leaveOut = 0
  }

  // The y-axis title follows the heights (see settings), so its box shows the new one.
  function chooseScale(scale: Scale) {
    if (Object.values(Y_TITLES).includes(s.yTitle)) s.yTitle = Y_TITLES[scale]
    s.scale = scale
  }

  /** The element's isotopes typed in for you, to change one or start a made-up element from it. */
  const copyable = $derived(elementPeaks(clean.element).length <= MAX_ISOTOPES)
  function copyElement() {
    s.isotopes = elementPeaks(clean.element).map((p) => ({ mass: Number(massText(p.mass)), pct: p.pct }))
    s.name = elementOf(clean.element).name
    s.leaveOut = 0
  }

  function setIsotope(i: number, key: 'mass' | 'pct', value: number) {
    const max = key === 'mass' ? MAX_MASS : 100
    if (Number.isFinite(value) && value >= (key === 'mass' ? 1 : 0) && value <= max) s.isotopes[i][key] = value
  }

  const peakSummary = $derived([SCALE_NAMES[clean.scale], clean.abundances ? 'abundances shown' : 'no abundances'].join(', '))
  const studentSummary = $derived(
    [clean.names ? 'Element named' : 'Element hidden', clean.leaveOut ? `m/z ${clean.leaveOut} left out` : '', clean.answerKey ? 'answer key' : '']
      .filter(Boolean)
      .join(', '),
  )
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'mass-spectrum')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mass-spectrum',
  )
</script>

{#snippet check(label: string, checked: boolean, set: (v: boolean) => void)}
  <label class="check">
    <input type="checkbox" {checked} onchange={(e) => set(e.currentTarget.checked)} />
    <strong>{label}</strong>
  </label>
{/snippet}

<GeneratorPage name="Mass Spectrum" {filename} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="spectrum">
      <h2 class="card-head">Isotopes</h2>
      <div class="segmented" role="radiogroup" aria-label="Peaks from">
        {#each SOURCES as source (source)}
          <button type="button" role="radio" aria-checked={s.source === source} class:on={s.source === source} onclick={() => (s.source = source)}>
            {SOURCE_NAMES[source]}
          </button>
        {/each}
      </div>

      {#if s.source === 'element'}
        <label class="field">
          <span>Element</span>
          <select value={s.element} onchange={(e) => chooseElement(e.currentTarget.value)}>
            {#each ISOTOPE_ZS as z (z)}
              {@const el = element(z)}
              <option value={el.symbol}>{z} · {el.symbol} · {el.name}</option>
            {/each}
          </select>
        </label>
      {:else}
        <label class="field">
          <span>Name</span>
          <input type="text" maxlength="40" placeholder="Element X" bind:value={s.name} />
        </label>
        <div class="isotopes">
          <span class="col">Mass</span><span class="col">Abundance (%)</span><span></span>
          {#each s.isotopes as iso, i (i)}
            <input
              type="number" step="any" min="1" max={MAX_MASS} aria-label="Isotope {i + 1} mass" value={iso.mass}
              oninput={(e) => setIsotope(i, 'mass', e.currentTarget.valueAsNumber)}
              onchange={(e) => (e.currentTarget.value = String(s.isotopes[i].mass))}
            />
            <input
              type="number" step="any" min="0" max="100" aria-label="Isotope {i + 1} abundance" value={iso.pct}
              oninput={(e) => setIsotope(i, 'pct', e.currentTarget.valueAsNumber)}
              onchange={(e) => (e.currentTarget.value = String(s.isotopes[i].pct))}
            />
            <button type="button" class="icon-btn" aria-label="Remove isotope {i + 1}" data-tip="Remove" disabled={s.isotopes.length === 1} onclick={() => s.isotopes.splice(i, 1)}>
              <Trash2 size={17} />
            </button>
          {/each}
        </div>
        <div class="actions">
          {#if s.isotopes.length < MAX_ISOTOPES}
            <button type="button" class="btn-ghost small" onclick={() => s.isotopes.push({ mass: Math.round(Math.max(...s.isotopes.map((i) => i.mass))) + 1, pct: 0 })}>
              <Plus size={17} aria-hidden="true" /> Add an isotope
            </button>
          {/if}
          {#if copyable}
            <button type="button" class="btn-ghost small" onclick={copyElement}>Copy {elementOf(clean.element).name.toLowerCase()}’s isotopes</button>
          {/if}
        </div>
        {#if total !== null}
          <p class="help">These add up to {total}%. The relative atomic mass is worked out as if they added up to 100%.</p>
        {/if}
        {#if g.problems.isotopes}<p class="help problem">{g.problems.isotopes}</p>{/if}
      {/if}
      {#if atomicMassText(clean)}
        <ul class="readout">
          <li>Relative atomic mass: {atomicMassText(clean)}</li>
          <li class="working">{workingLine(clean)}</li>
        </ul>
      {/if}
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Peaks" icon={ChartColumn} summary={peakSummary}>
      <p class="field-label">Peak heights</p>
      <div class="segmented" role="radiogroup" aria-label="Peak heights">
        {#each SCALES as scale (scale)}
          <button type="button" role="radio" aria-checked={s.scale === scale} class:on={s.scale === scale} onclick={() => chooseScale(scale)}>
            {SCALE_NAMES[scale]}
          </button>
        {/each}
      </div>
      {@render check('Abundances', s.abundances, (v) => (s.abundances = v))}
    </Section>

    <Section title="For the student" icon={PencilLine} summary={studentSummary}>
      {@render check('Element name', s.names, (v) => (s.names = v))}
      <label class="field setting">
        <span>Leave a peak out</span>
        <select bind:value={s.leaveOut}>
          <option value={0}>None</option>
          {#each peaks as p, i (i)}<option value={p.mz}>m/z {p.mz} ({texts[i]})</option>{/each}
        </select>
      </label>
      {@render check('Answer key', s.answerKey, (v) => (s.answerKey = v))}
    </Section>

    <TitleSettings
      bind:title={s.title} bind:titleMode={s.titleMode} bind:xTitle={s.xTitle} bind:xTitleMode={s.xTitleMode}
      bind:yTitle={s.yTitle} bind:yTitleMode={s.yTitleMode}
      placeholders={{ title: 'Mass spectrum of magnesium', xTitle: 'Mass-to-charge ratio (m/z)', yTitle: Y_TITLES[clean.scale] }}
    />
    <AxisSettings
      axis="x" read={shownAxes.x} problems={g.problems}
      bind:from={() => shown.xFrom, (v) => typeRange('xFrom', v)}
      bind:to={() => shown.xTo, (v) => typeRange('xTo', v)}
      bind:step={() => shown.xStep, (v) => typeRange('xStep', v)}
      bind:every={s.xEvery} bind:labelMode={s.xLabelMode} bind:label={s.xLabel} bind:startCap={s.xStartCap} bind:endCap={s.xEndCap}
      extras={[clean.xFit ? 'fitted' : '']}
    >
      {@render check('Fit to the peaks', s.xFit, (v) => (s.xFit = v))}
      {#if g.problems.peaks}<p class="help problem">{g.problems.peaks}</p>{/if}
    </AxisSettings>
    <AxisSettings
      axis="y" read={shownAxes.y} problems={g.problems}
      bind:from={s.yFrom} bind:to={s.yTo} bind:step={s.yStep} bind:every={s.yEvery}
      bind:labelMode={s.yLabelMode} bind:label={s.yLabel} bind:startCap={s.yStartCap} bind:endCap={s.yEndCap}
    />
    <GridlineSettings bind:minor={s.minor} />
  {/snippet}

  {#snippet figure()}
    <MassSpectrumFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { margin: 0; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .spectrum { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; }
  .field input { font-weight: 400; }
  .field-label { margin: 0 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .isotopes { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; gap: 0.45rem 0.6rem; align-items: center; }
  .isotopes .col { font-weight: 600; font-size: 0.84rem; color: var(--muted); }
  .isotopes input { width: 100%; min-width: 0; font-variant-numeric: tabular-nums; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
  .help { margin: 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .readout { margin: 0; padding: 0.55rem 0.75rem; list-style: none; border-radius: 10px; background: var(--blue-soft); font-size: 0.85rem; font-weight: 600; }
  .readout .working { margin-top: 0.2rem; font-weight: 400; font-size: 0.8rem; overflow-wrap: anywhere; }
  .setting { margin-top: 1rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin: 1rem 0 0.75rem; cursor: pointer; }
  .check:first-child { margin-top: 0.2rem; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check strong { font-size: 0.9rem; }
</style>
