<script lang="ts">
  // The Wave Generator: the wave, the marks on it and the graph it's drawn on
  // down the left, the figure on the right. The axes' ranges, titles and
  // gridlines are $shared/graph's settings groups. Settings live in the page
  // address.
  import { ChartLine, Ruler, Waves as WaveIcon } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import AxisSettings from '$shared/graph/AxisSettings.svelte'
  import GridlineSettings from '$shared/graph/GridlineSettings.svelte'
  import TitleSettings from '$shared/graph/TitleSettings.svelte'
  import { readAxes, type RangeSettings } from '$shared/graph/axes'
  import WaveFigure from './Wave.svelte'
  import { X_TITLES, answerLines, partsOf, waveSettings, type Wave, type XAxis } from './settings'
  import { buildWave } from './wave'

  const gen = generatorState(waveSettings, 'waves', { history: 'physicsfigures.waves.history', presets: 'physicsfigures.waves.presets' })
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const f = $derived(buildWave(clean))
  const parts = $derived(partsOf(clean))
  let svg = $state<SVGSVGElement>()

  /** A change that may move the wave between time and distance, with the x-axis title to match unless the teacher typed their own. */
  function retitle(change: () => void) {
    const before = X_TITLES[partsOf(s).time ? 'time' : 'distance']
    change()
    if (s.xTitle.trim() === before) s.xTitle = X_TITLES[partsOf(s).time ? 'time' : 'distance']
  }

  // While an axis fits the wave, its boxes show the fitted range; typing in one takes over for that axis.
  const shownAxes = $derived(readAxes(f.ranges))
  function typeRange(key: keyof RangeSettings, v: string) {
    const fit = f.fitted
    if (key.startsWith('x') && s.xFit) Object.assign(s, { xFrom: fit.xFrom, xTo: fit.xTo, xStep: fit.xStep, xFit: false })
    if (key.startsWith('y') && s.yFit) Object.assign(s, { yFrom: fit.yFrom, yTo: fit.yTo, yStep: fit.yStep, yFit: false })
    s[key] = v
  }

  const WAVE_NAMES: Record<Wave, string> = { transverse: 'Transverse', longitudinal: 'Longitudinal', both: 'Both' }
  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : '')
  const repeatName = $derived(parts.time ? 'period' : 'wavelength')
  const frequency = $derived(answerLines(clean).find((l) => l.startsWith('Frequency')))

  const waveSummary = $derived(
    [
      clean.wave === 'both' ? 'Longitudinal over transverse' : WAVE_NAMES[clean.wave],
      parts.transverse ? `A = ${clean.amplitude}` : '',
      parts.time ? `T = ${clean.period}` : `λ = ${clean.wavelength}`,
      `${clean.cycles} cycle${clean.cycles === 1 ? '' : 's'}`,
    ]
      .filter(Boolean)
      .join(' · '),
  )
  const marksSummary = $derived(
    [
      clean.wavelengthMark && clean.cycles >= 1 ? `${repeatName} ${shown(parts.time ? clean.periodLabel : clean.wavelengthLabel)}` : '',
      parts.transverse && clean.amplitudeMark ? `amplitude ${shown(clean.amplitudeLabel)}` : '',
      ...(parts.transverse ? [clean.crestLabel, clean.troughLabel] : []).map(shown),
      ...(parts.longitudinal ? [clean.compressionLabel, clean.rarefactionLabel] : []).map(shown),
    ]
      .filter(Boolean)
      .join(' · ')
      .replace(/  +/g, ' ') || 'none',
  )
  const graphSummary = $derived(
    [clean.axes ? 'numbered axes' : 'no axes', clean.axes && parts.transverse ? (clean.gridlines ? 'gridlines' : 'tick marks') : '', clean.color ? 'color' : 'black and white']
      .filter(Boolean)
      .join(' · '),
  )
</script>

<GeneratorPage name="Wave Generator" filename="waves" {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet settings()}
    <Section title="Wave" icon={WaveIcon} summary={waveSummary}>
      <div class="field">
        <Choice
          name="Wave"
          options={[['transverse', 'Transverse'], ['longitudinal', 'Longitudinal'], ['both', 'Both']]}
          bind:value={() => s.wave, (v: Wave) => retitle(() => (s.wave = v))}
        />
      </div>
      {#if s.wave === 'both'}
        <p class="note">The longitudinal wave above the transverse one, its compressions over the crests.</p>
      {/if}
      {#if s.wave === 'transverse'}
        <div class="field">
          Displacement against
          <Choice name="Displacement against" options={[['distance', 'Distance'], ['time', 'Time']]} bind:value={() => s.xAxis, (v: XAxis) => retitle(() => (s.xAxis = v))} />
        </div>
      {/if}
      <div class="field-row">
        {#if parts.transverse}
          <label class="field">
            Amplitude
            <input type="number" step="any" min="0.001" bind:value={s.amplitude} />
          </label>
        {/if}
        {#if parts.time}
          <label class="field">
            Period
            <input type="number" step="any" min="0.001" bind:value={s.period} />
          </label>
        {:else}
          <label class="field">
            Wavelength
            <input type="number" step="any" min="0.001" bind:value={s.wavelength} />
          </label>
        {/if}
      </div>
      {#if clean.axes || frequency}
        <p class="note">{clean.axes ? `In the units of the ${parts.transverse ? 'axes' : 'x-axis'}. ` : ''}{frequency ? `${frequency}.` : ''}</p>
      {/if}
      <label class="field">
        Cycles
        <span class="slider">
          <input type="range" min="0.5" max="8" step="0.5" bind:value={s.cycles} />
          <output>{clean.cycles}</output>
        </span>
      </label>
    </Section>

    <Section title="Marks" icon={Ruler} summary={marksSummary}>
      <div class="mark">
        <label class="check"><input type="checkbox" bind:checked={s.wavelengthMark} /> Mark the {repeatName}</label>
        {#if s.wavelengthMark}
          {#if clean.cycles < 1}
            <p class="note">Draw a whole cycle or more to mark it.</p>
          {:else if parts.time}
            <div class="field"><LabelField name="Period label" bind:label={s.periodLabel} /></div>
          {:else}
            <div class="field"><LabelField name="Wavelength label" bind:label={s.wavelengthLabel} /></div>
          {/if}
        {/if}
      </div>
      {#if parts.transverse}
        <div class="mark">
          <label class="check"><input type="checkbox" bind:checked={s.amplitudeMark} /> Mark the amplitude</label>
          {#if s.amplitudeMark}<div class="field"><LabelField name="Amplitude label" bind:label={s.amplitudeLabel} /></div>{/if}
        </div>
        <div class="mark">
          <div class="field">Crest <LabelField name="Crest label" bind:label={s.crestLabel} /></div>
          <div class="field">Trough <LabelField name="Trough label" bind:label={s.troughLabel} /></div>
        </div>
      {/if}
      {#if parts.longitudinal}
        <div class="mark">
          <div class="field">Compression <LabelField name="Compression label" bind:label={s.compressionLabel} /></div>
          <div class="field">Rarefaction <LabelField name="Rarefaction label" bind:label={s.rarefactionLabel} /></div>
        </div>
      {/if}
    </Section>

    <Section title="Graph" icon={ChartLine} summary={graphSummary}>
      <label class="check"><input type="checkbox" bind:checked={s.axes} /> Numbered axes, to measure on</label>
      {#if s.axes && parts.transverse}
        <label class="check"><input type="checkbox" bind:checked={s.gridlines} /> Gridlines (tick marks without)</label>
      {/if}
      <label class="check"><input type="checkbox" bind:checked={s.color} /> Color (for slides)</label>
    </Section>

    {#if clean.axes}
      <TitleSettings
        bind:title={s.title} bind:titleMode={s.titleMode} bind:xTitle={s.xTitle} bind:xTitleMode={s.xTitleMode}
        bind:yTitle={s.yTitle} bind:yTitleMode={s.yTitleMode}
        placeholders={{ title: 'A transverse wave', xTitle: X_TITLES[parts.time ? 'time' : 'distance'], yTitle: 'Displacement (cm)' }}
      />
      <AxisSettings
        axis="x" read={shownAxes.x} problems={f.problems}
        bind:from={() => f.ranges.xFrom, (v) => typeRange('xFrom', v)}
        bind:to={() => f.ranges.xTo, (v) => typeRange('xTo', v)}
        bind:step={() => f.ranges.xStep, (v) => typeRange('xStep', v)}
        bind:every={s.xEvery} bind:labelMode={s.xLabelMode} bind:label={s.xLabel} bind:startCap={s.xStartCap} bind:endCap={s.xEndCap}
        extras={[clean.xFit ? 'fitted' : '']}
      >
        <label class="check fit"><input type="checkbox" bind:checked={s.xFit} /> Fit to the cycles drawn</label>
      </AxisSettings>
      {#if parts.transverse}
        <AxisSettings
          axis="y" read={shownAxes.y} problems={f.problems}
          bind:from={() => f.ranges.yFrom, (v) => typeRange('yFrom', v)}
          bind:to={() => f.ranges.yTo, (v) => typeRange('yTo', v)}
          bind:step={() => f.ranges.yStep, (v) => typeRange('yStep', v)}
          bind:every={s.yEvery} bind:labelMode={s.yLabelMode} bind:label={s.yLabel} bind:startCap={s.yStartCap} bind:endCap={s.yEndCap}
          extras={[clean.yFit ? 'fitted' : '']}
        >
          <label class="check fit"><input type="checkbox" bind:checked={s.yFit} /> Fit to the amplitude and marks</label>
        </AxisSettings>
        {#if clean.gridlines}<GridlineSettings bind:minor={s.minor} />{/if}
      {/if}
    {/if}
  {/snippet}

  {#snippet figure()}
    <WaveFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .mark + .mark { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.25rem; }
  .fit { margin-bottom: 0.75rem; }
</style>
