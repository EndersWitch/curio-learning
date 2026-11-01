<script lang="ts">
  // pH Reading: pick a pH meter or pH paper, type a pH, and get a figure
  // students read the pH from.
  import { Droplet, Gauge, Type, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$lib/shared/MagnifierSettings.svelte'
  import ReadingField from '$lib/shared/ReadingField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { MAGNIFIER_VIEW_NAMES } from '$lib/shared/magnify'
  import PhFigure from './PhFigure.svelte'
  import { DIGITAL_DECIMALS, PH_INSTRUMENTS, PH_MAX, PH_MIN, phRules, type PhInstrument } from './readings'
  import { answerLine, phSettings, readingText } from './settings'

  const gen = generatorState(phSettings, 'ph-reading')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const INSTRUMENT_NAMES: Record<PhInstrument, string> = { digital: 'Digital meter', analog: 'Analog meter', paper: 'pH paper' }
  const rules = $derived(phRules(s))
  const instrumentSummary = $derived(
    INSTRUMENT_NAMES[s.instrument] + (s.instrument === 'digital' ? `, ${s.decimals} decimal place${s.decimals === 1 ? '' : 's'}` : ''),
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another instrument keeps the pH, rounded to what it reads. */
  function change(instrument: PhInstrument, decimals: number) {
    s.reading = phRules({ instrument, decimals }).round(s.reading)
    s.instrument = instrument
    s.decimals = decimals
  }
</script>

<GeneratorPage
  name="pH Reading"
  filename="ph-reading"
  settingsWidth={27}
  {gen}
  {svg}
>
  {#snippet settings()}
    <Section title="Instrument" summary={instrumentSummary} icon={Gauge} open>
      <div class="segmented" role="radiogroup" aria-label="Instrument">
        {#each PH_INSTRUMENTS as instrument (instrument)}
          <button type="button" role="radio" aria-checked={s.instrument === instrument} class:on={s.instrument === instrument} onclick={() => change(instrument, s.decimals)}>
            {INSTRUMENT_NAMES[instrument]}
          </button>
        {/each}
      </div>
      {#if s.instrument === 'digital'}
        <p class="field-label">Decimal places</p>
        <div class="chips" role="radiogroup" aria-label="Decimal places">
          {#each DIGITAL_DECIMALS as d (d)}
            <button type="button" role="radio" aria-checked={s.decimals === d} class="chip" class:on={s.decimals === d} onclick={() => change('digital', d)}>
              {(0).toFixed(d)}
            </button>
          {/each}
        </div>
      {:else if s.instrument === 'analog'}
        <p class="note">Marked every 0.2, read to 0.01 with the estimated digit.</p>
      {:else}
        <p class="note">Read to the whole number of the matching color. Print in color: in black and white the strip can't be matched to the chart.</p>
      {/if}
    </Section>
    <Section title="pH" summary={readingText(s)} icon={Droplet} open>
      <ReadingField
        label="pH"
        value={s.reading}
        decimals={rules.decimals}
        min={PH_MIN}
        max={PH_MAX}
        onchange={(v) => (s.reading = rules.round(v))}
        onrandom={() => (s.reading = rules.random())}
      />
    </Section>
    {#if s.instrument === 'analog'}
      <Section title="Magnifier" summary={MAGNIFIER_VIEW_NAMES[s.view]} icon={ZoomIn}>
        <MagnifierSettings bind:view={s.view} bind:span={s.span} />
      </Section>
    {/if}
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <PhFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
</style>
