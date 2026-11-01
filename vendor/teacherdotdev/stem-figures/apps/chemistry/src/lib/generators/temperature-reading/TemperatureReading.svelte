<script lang="ts">
  // Temperature Reading: pick a thermometer and a unit, type a temperature,
  // and get a figure students read the temperature from.
  import { Ruler, Thermometer, Type, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$lib/shared/MagnifierSettings.svelte'
  import ReadingField from '$lib/shared/ReadingField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { MAGNIFIER_VIEW_NAMES } from '$lib/shared/magnify'
  import TemperatureFigure from './TemperatureFigure.svelte'
  import { DIGITAL_DECIMALS } from './digital'
  import { TINTS, type Tint } from './glass'
  import {
    TEMPERATURE_INSTRUMENTS,
    answerLine,
    readingText,
    temperatureRules,
    temperatureSettings,
    type TemperatureInstrument,
  } from './settings'
  import { TEMPERATURE_UNITS, UNIT_NAMES, UNIT_SYMBOLS, convertTemperature, type TemperatureUnit } from './units'

  const gen = generatorState(temperatureSettings, 'temperature-reading')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const INSTRUMENT_NAMES: Record<TemperatureInstrument, string> = { glass: 'Liquid-in-glass', digital: 'Digital probe' }
  const TINT_NAMES: Record<Tint, string> = { red: 'Red', blue: 'Blue', gray: 'Gray' }
  const rules = $derived(temperatureRules(s))
  const thermometerSummary = $derived(
    `${INSTRUMENT_NAMES[s.instrument]}, ${UNIT_SYMBOLS[s.unit]}` +
      (s.instrument === 'digital' ? `, ${s.decimals} decimal place${s.decimals === 1 ? '' : 's'}` : ''),
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another thermometer or unit keeps the same temperature: 25 °C becomes
   *  298.2 K, rounded and within what the thermometer reads. */
  function change(instrument: TemperatureInstrument, unit: TemperatureUnit, decimals: number) {
    s.reading = temperatureRules({ instrument, unit, decimals }).round(convertTemperature(s.reading, s.unit, unit))
    s.instrument = instrument
    s.unit = unit
    s.decimals = decimals
  }
</script>

<GeneratorPage
  name="Temperature Reading"
  filename="temperature-reading"
  settingsWidth={27}
  {gen}
  {svg}
>
  {#snippet settings()}
    <Section title="Thermometer" summary={thermometerSummary} icon={Thermometer} open>
      <div class="segmented" role="radiogroup" aria-label="Thermometer">
        {#each TEMPERATURE_INSTRUMENTS as instrument (instrument)}
          <button type="button" role="radio" aria-checked={s.instrument === instrument} class:on={s.instrument === instrument} onclick={() => change(instrument, s.unit, s.decimals)}>
            {INSTRUMENT_NAMES[instrument]}
          </button>
        {/each}
      </div>
      <p class="field-label">Unit</p>
      <div class="chips" role="radiogroup" aria-label="Unit">
        {#each TEMPERATURE_UNITS as unit (unit)}
          <button type="button" role="radio" aria-checked={s.unit === unit} class="chip" class:on={s.unit === unit} onclick={() => change(s.instrument, unit, s.decimals)}>
            {UNIT_NAMES[unit]} ({UNIT_SYMBOLS[unit]})
          </button>
        {/each}
      </div>
      {#if s.instrument === 'digital'}
        <p class="field-label">Decimal places</p>
        <div class="chips" role="radiogroup" aria-label="Decimal places">
          {#each DIGITAL_DECIMALS as d (d)}
            <button type="button" role="radio" aria-checked={s.decimals === d} class="chip" class:on={s.decimals === d} onclick={() => change('digital', s.unit, d)}>
              {(0).toFixed(d)}
            </button>
          {/each}
        </div>
      {:else}
        <p class="field-label">Liquid</p>
        <div class="chips" role="radiogroup" aria-label="Liquid color">
          {#each TINTS as tint (tint)}
            <button type="button" role="radio" aria-checked={s.tint === tint} class="chip" class:on={s.tint === tint} onclick={() => (s.tint = tint)}>
              {TINT_NAMES[tint]}
            </button>
          {/each}
        </div>
      {/if}
    </Section>
    <Section title="Temperature" summary={readingText(s)} icon={Ruler} open>
      <ReadingField
        label="Temperature"
        value={s.reading}
        decimals={rules.decimals}
        min={rules.min}
        max={rules.max}
        unit={UNIT_SYMBOLS[s.unit]}
        onchange={(v) => (s.reading = rules.round(v))}
        onrandom={() => (s.reading = rules.random())}
      />
    </Section>
    {#if s.instrument === 'glass'}
      <Section title="Magnifier" summary={MAGNIFIER_VIEW_NAMES[s.view]} icon={ZoomIn}>
        <MagnifierSettings bind:view={s.view} bind:span={s.span} />
      </Section>
    {/if}
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <TemperatureFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
</style>
