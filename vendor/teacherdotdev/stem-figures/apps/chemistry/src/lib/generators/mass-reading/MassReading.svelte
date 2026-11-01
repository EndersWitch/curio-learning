<script lang="ts">
  // Mass Reading: pick a balance, type a mass, and get a figure students
  // read the mass from.
  import { Scale, Type, Weight, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$lib/shared/MagnifierSettings.svelte'
  import ReadingField from '$lib/shared/ReadingField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import MassFigure from './MassFigure.svelte'
  import { MARBLE_COUNTS, OBJECTS, OBJECT_NAMES, objectName } from '../volume-by-displacement/objects'
  import { DECIMAL_PLACES, PAN_CONTENTS, type PanContents } from './digital'
  import { MASS_INSTRUMENTS, MASS_VIEWS, MASS_VIEW_NAMES, answerLine, massRules, massSettings, massText, type MassInstrument } from './settings'

  const gen = generatorState(massSettings, 'mass-reading')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const PAN_NAMES: Record<PanContents, string> = { boat: 'Weigh boat', beaker: 'Beaker', empty: 'Nothing' }
  /** What can go on the pan: the digital balance's own contents, or nothing
   *  on the triple beam, then the objects. An object replaces the contents. */
  const panChoices = $derived([
    ...(s.instrument === 'digital' ? PAN_CONTENTS : (['empty'] as const)).map((pan) => ({
      name: PAN_NAMES[pan],
      on: s.object === 'none' && (s.instrument === 'triple-beam' || s.pan === pan),
      pick: () => {
        s.object = 'none'
        if (s.instrument === 'digital') s.pan = pan
      },
    })),
    ...OBJECTS.map((object) => ({ name: OBJECT_NAMES[object], on: s.object === object, pick: () => (s.object = object) })),
  ])
  const INSTRUMENT_NAMES: Record<MassInstrument, string> = { digital: 'Digital balance', 'triple-beam': 'Triple beam balance' }
  const rules = $derived(massRules(s))
  const balanceSummary = $derived(
    (s.instrument === 'triple-beam' ? 'Triple beam, 610 g' : `Digital, ${s.decimals} decimal place${s.decimals === 1 ? '' : 's'}`) +
      (s.object === 'none' ? '' : `, ${objectName(s.object, s.marbles)}`),
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another balance keeps the mass, rounded and within what it can weigh. */
  function change(instrument: MassInstrument, decimals: number) {
    s.mass = massRules({ instrument, decimals }).round(s.mass)
    s.instrument = instrument
    s.decimals = decimals
  }
</script>

<GeneratorPage
  name="Mass Reading"
  filename="mass-reading"
  settingsWidth={27}
  {gen}
  {svg}
>
  {#snippet settings()}
    <Section title="Balance" summary={balanceSummary} icon={Scale} open>
      <div class="segmented" role="radiogroup" aria-label="Balance">
        {#each MASS_INSTRUMENTS as instrument (instrument)}
          <button type="button" role="radio" aria-checked={s.instrument === instrument} class:on={s.instrument === instrument} onclick={() => change(instrument, s.decimals)}>
            {INSTRUMENT_NAMES[instrument]}
          </button>
        {/each}
      </div>
      {#if s.instrument === 'digital'}
        <p class="field-label">Decimal places</p>
        <div class="chips" role="radiogroup" aria-label="Decimal places">
          {#each DECIMAL_PLACES as d (d)}
            <button type="button" role="radio" aria-checked={s.decimals === d} class="chip" class:on={s.decimals === d} onclick={() => change('digital', d)}>
              {(0).toFixed(d)}
            </button>
          {/each}
        </div>
      {:else}
        <p class="note">Weighs up to 610 g, read to 0.01 g. The riders are placed for the mass you type.</p>
      {/if}
      <p class="field-label">On the pan</p>
      <div class="chips" role="radiogroup" aria-label="On the pan">
        {#each panChoices as choice (choice.name)}
          <button type="button" role="radio" aria-checked={choice.on} class="chip" class:on={choice.on} onclick={choice.pick}>
            {choice.name}
          </button>
        {/each}
      </div>
      {#if s.object === 'marbles'}
        <p class="field-label">How many marbles</p>
        <div class="chips" role="radiogroup" aria-label="Number of marbles">
          {#each MARBLE_COUNTS as n (n)}
            <button type="button" role="radio" aria-checked={s.marbles === n} class="chip" class:on={s.marbles === n} onclick={() => (s.marbles = n)}>{n}</button>
          {/each}
        </div>
      {/if}
    </Section>
    <Section title="Mass" summary="{massText(s)} g" icon={Weight} open>
      <ReadingField
        label="Mass"
        value={s.mass}
        decimals={rules.decimals}
        min={0}
        max={rules.capacity}
        unit="g"
        onchange={(v) => (s.mass = rules.round(v))}
        onrandom={() => (s.mass = rules.random())}
      />
    </Section>
    {#if s.instrument === 'triple-beam'}
      <Section title="Magnifier" summary={MASS_VIEW_NAMES[s.view]} icon={ZoomIn}>
        <MagnifierSettings bind:view={s.view} bind:span={s.span} views={MASS_VIEWS} names={MASS_VIEW_NAMES} />
      </Section>
    {/if}
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <MassFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
</style>
