<script lang="ts">
  // Titration Curve: pick what's titrated, then type either the chemistry
  // (molarities, volume, pKa or pKb) or the key points (starting pH, the
  // equivalence point, ending pH), and get the curve on a graph with its
  // equivalence and half-equivalence points marked. The grid and axes are
  // $shared/graph's, the same as Math's coordinate grid.
  import { MapPin, Spline } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import AxisSettings from '$shared/graph/AxisSettings.svelte'
  import GridlineSettings from '$shared/graph/GridlineSettings.svelte'
  import TitleSettings from '$shared/graph/TitleSettings.svelte'
  import { axisEnd, readAxes } from '$shared/graph/axes'
  import { COLORS, type Color } from '$shared/graph/colors'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import HelpTip from '$lib/shared/HelpTip.svelte'
  import { ANALYTES, chemistryFor, isBase, isWeak, keyPointsOf, type Analyte, type Chemistry, type KeyPoints } from './curve'
  import { buildTitration, missedPoints, pointsNote } from './figure'
  import { ANALYTE_NAMES, COMMON, MARKS, MARK_NAMES, chemistryOf, keyPointsIn, titrationSettings } from './settings'
  import TitrationFigure from './TitrationFigure.svelte'

  const gen = generatorState(titrationSettings, 'titration-curve')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const axes = $derived(readAxes(clean))
  const g = $derived(buildTitration(clean))
  const note = $derived(pointsNote(clean))
  let svg = $state<SVGSVGElement>()

  const two = (v: number) => String(Math.round(v * 100) / 100)
  const round2 = (v: number) => Math.round(v * 100) / 100

  // Picking what's titrated names the titrant in the x-axis title, if the
  // title is still the one this page wrote.
  const TITRANT_TITLE = /^Volume of (NaOH|HCl) added \(mL\)$/
  function nameTitrant(analyte: Analyte) {
    if (TITRANT_TITLE.test(s.xTitle)) s.xTitle = `Volume of ${isBase(analyte) ? 'HCl' : 'NaOH'} added (mL)`
  }

  /** Key points copied from a titration, so switching to them keeps the curve. */
  function takePoints(c: Chemistry) {
    const p = keyPointsOf(c, axisEnd(axes.x))
    Object.assign(s, { startPH: round2(p.startPH), eqMl: round2(p.eqMl), eqPH: round2(p.eqPH), endPH: round2(p.endPH) })
  }

  function chooseAnalyte(analyte: Analyte) {
    s.analyte = analyte
    nameTitrant(analyte)
    // Key points for a different kind of titration: a typical one of that
    // kind, with the same equivalence volume.
    if (clean.source === 'points') {
      const typical = COMMON.find((c) => c.analyte === analyte)!
      takePoints({ analyte, analyteM: 0.1, analyteMl: clean.eqMl, titrantM: 0.1, pK: typical.pK })
    }
  }

  function chooseCommon(id: string) {
    const c = COMMON.find((c) => c.id === id)
    if (!c) return
    s.analyte = c.analyte
    Object.assign(s, { analyteM: 0.1, analyteMl: 25, titrantM: 0.1 })
    if (isWeak(c.analyte)) s[isBase(c.analyte) ? 'pKb' : 'pKa'] = c.pK
    s.xTitle = TITRANT_TITLE.test(s.xTitle) ? `Volume of ${c.titrant} added (mL)` : s.xTitle
    if (clean.source === 'points') takePoints({ analyte: c.analyte, analyteM: 0.1, analyteMl: 25, titrantM: 0.1, pK: c.pK })
  }

  // The concentrations last worked out from key points, and those key points,
  // while the teacher hasn't changed them: for the note under the fields.
  let fitted = $state<{ chemistry: string; from: KeyPoints } | null>(null)
  const chemistryKey = (c: Chemistry) => JSON.stringify(c)

  /** Concentrations for the key points typed: kept if they still give those points, else worked out. */
  function takeChemistry() {
    const endMl = axisEnd(axes.x)
    const typed = keyPointsIn(clean)
    const had = keyPointsOf(chemistryOf(clean), endMl)
    const same = (['startPH', 'eqMl', 'eqPH', 'endPH'] as const).every((k) => round2(had[k]) === typed[k])
    if (same) return
    const c = chemistryFor(clean.analyte, typed, endMl)
    const sig = (v: number) => Number(v.toPrecision(3))
    Object.assign(s, { analyteM: sig(c.analyteM), analyteMl: sig(c.analyteMl), titrantM: sig(c.titrantM) })
    if (isWeak(clean.analyte)) s[isBase(clean.analyte) ? 'pKb' : 'pKa'] = round2(c.pK)
    fitted = { chemistry: chemistryKey(chemistryOf(titrationSettings.tidy($state.snapshot(s)))), from: typed }
  }

  function chooseSource(source: 'chemistry' | 'points') {
    if (source === clean.source) return
    if (source === 'points') takePoints(chemistryOf(clean))
    else takeChemistry()
    s.source = source
  }

  // Shown until the teacher changes the concentrations worked out for them.
  const fitNote = $derived.by(() => {
    if (!fitted || clean.source !== 'chemistry' || chemistryKey(chemistryOf(clean)) !== fitted.chemistry) return null
    return missedPoints(chemistryOf(clean), fitted.from, axisEnd(axes.x)) ?? 'Worked out from your key points.'
  })

  const pName = $derived(isBase(clean.analyte) ? 'pKb' : 'pKa')
  const readout = $derived.by(() => {
    const parts = []
    if (g.eq) parts.push(`Equivalence point: ${two(g.eq.ml)} mL, pH ${g.eq.ph.toFixed(2)}`)
    if (g.half) parts.push(`Half-equivalence point: ${two(g.half.ml)} mL, pH ${g.half.ph.toFixed(2)}`)
    return parts
  })

  const markSummary = $derived(
    [
      `Equivalence: ${MARK_NAMES[clean.eqMark].toLowerCase()}`,
      isWeak(clean.analyte) ? `half-equivalence: ${MARK_NAMES[clean.halfMark].toLowerCase()}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  )
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'titration-curve')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'titration-curve',
  )
</script>

{#snippet numberField(id: string, name: string, unit: string, key: 'analyteM' | 'analyteMl' | 'titrantM' | 'pKa' | 'pKb' | 'startPH' | 'eqMl' | 'eqPH' | 'endPH', min: number, max: number, problem?: string | null)}
  <label class="number-field" for={id}>
    <span>{name}{#if unit}&nbsp;<span class="unit">({unit})</span>{/if}</span>
    <input {id} type="number" step="any" {min} {max} aria-invalid={!!problem} bind:value={s[key]} />
  </label>
{/snippet}

<GeneratorPage name="Titration Curve" {filename} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="titration">
      <div class="head-row">
        <h2 class="card-head">Titration</h2>
        <HelpTip id="titration-tip" label="How the curve is worked out">
          From concentrations, the pH at each volume is solved exactly from the chemistry, so a weak acid is at its pKa
          halfway to the equivalence point. From key points, the curve is a real titration curve bent to pass through
          the pH values you type.
        </HelpTip>
      </div>
      <label class="field">
        <span>What’s titrated</span>
        <select value={s.analyte} onchange={(e) => chooseAnalyte(e.currentTarget.value as Analyte)}>
          {#each ANALYTES as a}<option value={a}>{ANALYTE_NAMES[a]}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Common titration <span class="hint">25.0 mL of 0.100 M, with 0.100 M</span></span>
        <select value="" onchange={(e) => { chooseCommon(e.currentTarget.value); e.currentTarget.value = '' }}>
          <option value="" disabled>Choose one…</option>
          {#each COMMON as c}<option value={c.id}>{c.name}</option>{/each}
        </select>
      </label>
      <div class="segmented" role="radiogroup" aria-label="Work the curve out from">
        <button type="button" role="radio" aria-checked={s.source === 'chemistry'} class:on={s.source === 'chemistry'} onclick={() => chooseSource('chemistry')}>Concentrations</button>
        <button type="button" role="radio" aria-checked={s.source === 'points'} class:on={s.source === 'points'} onclick={() => chooseSource('points')}>Key points</button>
      </div>

      {#if s.source === 'chemistry'}
        <div class="fields">
          {@render numberField('analyte-m', isBase(clean.analyte) ? 'Base molarity' : 'Acid molarity', 'M', 'analyteM', 0.0001, 10, g.problems.amounts)}
          {@render numberField('analyte-ml', isBase(clean.analyte) ? 'Base volume' : 'Acid volume', 'mL', 'analyteMl', 0.1, 1000, g.problems.amounts)}
          {@render numberField('titrant-m', isBase(clean.analyte) ? 'HCl molarity' : 'NaOH molarity', 'M', 'titrantM', 0.0001, 10, g.problems.amounts)}
          {#if isWeak(clean.analyte)}
            {#if isBase(clean.analyte)}{@render numberField('pkb', 'pKb', '', 'pKb', 0, 14)}
            {:else}{@render numberField('pka', 'pKa', '', 'pKa', 0, 14)}{/if}
          {/if}
        </div>
        {#if g.problems.amounts}<p class="help problem">{g.problems.amounts}</p>{/if}
        {#if fitNote}<p class="help">{fitNote}</p>{/if}
        {#if isWeak(clean.analyte) && isBase(clean.analyte)}
          <p class="help">Halfway to the equivalence point, pH = 14 − {pName} = {two(14 - clean.pKb)}.</p>
        {/if}
      {:else}
        <div class="fields">
          {@render numberField('start-ph', 'Starting pH', '', 'startPH', 0, 14)}
          {@render numberField('end-ph', 'Ending pH', '', 'endPH', 0, 14, g.problems.endPH)}
          {@render numberField('eq-ml', 'Equivalence volume', 'mL', 'eqMl', 0.01, 1000, g.problems.eqMl)}
          {@render numberField('eq-ph', 'Equivalence pH', '', 'eqPH', 0, 14, g.problems.eqPH)}
        </div>
        {#each ['endPH', 'eqMl', 'eqPH'] as key}
          {#if g.problems[key]}<p class="help problem">{g.problems[key]}</p>{/if}
        {/each}
        {#if note}<p class="help">{note}</p>{/if}
        <p class="help">The ending pH is at the end of the x-axis ({two(axisEnd(axes.x))} mL).</p>
      {/if}
      {#if readout.length}
        <ul class="readout">{#each readout as line}<li>{line}</li>{/each}</ul>
      {/if}
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Marked points" icon={MapPin} summary={markSummary}>
      <label class="field setting">
        <span>Equivalence point</span>
        <select bind:value={s.eqMark}>
          {#each MARKS as m}<option value={m}>{MARK_NAMES[m]}</option>{/each}
        </select>
      </label>
      {#if s.eqMark !== 'none'}
        <div class="field setting">
          <span>Its label</span>
          <LabelField name="Equivalence point label" placeholder="Equivalence point" bind:mode={s.eqLabelMode} bind:text={s.eqLabel} />
        </div>
      {/if}
      {#if isWeak(clean.analyte)}
        <label class="field setting">
          <span>Half-equivalence point <span class="hint">where pH = {isBase(clean.analyte) ? 'pKa of the conjugate acid' : 'pKa'}</span></span>
          <select bind:value={s.halfMark}>
            {#each MARKS as m}<option value={m}>{MARK_NAMES[m]}</option>{/each}
          </select>
        </label>
        {#if s.halfMark !== 'none'}
          <div class="field setting">
            <span>Its label</span>
            <LabelField name="Half-equivalence point label" placeholder="Half-equivalence point" bind:mode={s.halfLabelMode} bind:text={s.halfLabel} />
          </div>
        {/if}
      {/if}
    </Section>

    <Section title="Curve" icon={Spline} summary="{clean.color[0].toUpperCase()}{clean.color.slice(1)}">
      <div class="swatches" role="radiogroup" aria-label="Curve color">
        {#each Object.entries(COLORS) as [name, hex]}
          <button
            type="button" role="radio" aria-checked={s.color === name} aria-label={name} data-tip={name}
            class="swatch" class:on={s.color === name} style:--swatch={hex} onclick={() => (s.color = name as Color)}
          ></button>
        {/each}
      </div>
    </Section>

    <TitleSettings
      bind:title={s.title} bind:titleMode={s.titleMode} bind:xTitle={s.xTitle} bind:xTitleMode={s.xTitleMode}
      bind:yTitle={s.yTitle} bind:yTitleMode={s.yTitleMode}
      placeholders={{ title: 'Titration of CH₃COOH with NaOH', xTitle: 'Volume of NaOH added (mL)', yTitle: 'pH' }}
    />
    <AxisSettings
      axis="x" read={axes.x} problems={axes.problems}
      bind:from={s.xFrom} bind:to={s.xTo} bind:step={s.xStep} bind:every={s.xEvery}
      bind:labelMode={s.xLabelMode} bind:label={s.xLabel} bind:startCap={s.xStartCap} bind:endCap={s.xEndCap}
    />
    <AxisSettings
      axis="y" read={axes.y} problems={axes.problems}
      bind:from={s.yFrom} bind:to={s.yTo} bind:step={s.yStep} bind:every={s.yEvery}
      bind:labelMode={s.yLabelMode} bind:label={s.yLabel} bind:startCap={s.yStartCap} bind:endCap={s.yEndCap}
    />
    <GridlineSettings bind:minor={s.minor} />
  {/snippet}

  {#snippet figure()}
    <TitrationFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .titration { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .number-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .number-field input { width: 100%; min-width: 0; }
  .unit { font-weight: 400; color: var(--muted); }
  .help { margin: 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .readout { margin: 0; padding: 0.55rem 0.75rem; list-style: none; border-radius: 10px; background: var(--blue-soft); font-size: 0.85rem; font-weight: 600; }
  .readout li + li { margin-top: 0.2rem; }
  .setting { margin-bottom: 0.75rem; }
  .setting:last-child { margin-bottom: 0; }
  .swatches { display: flex; gap: 0.5rem; }
  .swatch {
    width: 2rem; height: 2rem; border-radius: 999px; border: 3px solid #fff; background: var(--swatch);
    box-shadow: 0 0 0 1.5px var(--border); cursor: pointer;
  }
  .swatch.on { box-shadow: 0 0 0 2.5px var(--ink); }
</style>
