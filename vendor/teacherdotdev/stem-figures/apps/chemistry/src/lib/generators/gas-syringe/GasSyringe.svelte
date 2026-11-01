<script lang="ts">
  // Gas Syringe: pick a syringe, type the volume of gas it holds, and get a
  // figure students read the volume from, with or without the flask and
  // stand it's collecting from.
  import { Ruler, Syringe, Type, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$lib/shared/MagnifierSettings.svelte'
  import ReadingField from '$lib/shared/ReadingField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { MAGNIFIER_VIEW_NAMES } from '$lib/shared/magnify'
  import { randomReading, roundReading } from '../volume-reading/scale'
  import SyringeFigure from './SyringeFigure.svelte'
  import { SETUPS, SYRINGE_SIZES, UNIT_SYMBOLS, VOLUME_UNITS, syringeName, syringeScale, type Setup, type SyringeSize } from './syringe'
  import { answerLine, readingText, syringeSettings } from './settings'

  const gen = generatorState(syringeSettings, 'gas-syringe')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const SETUP_NAMES: Record<Setup, string> = { syringe: 'Syringe only', setup: 'With flask and stand' }
  const scale = $derived(syringeScale(s.size))
  const unit = $derived(UNIT_SYMBOLS[s.unit])

  const syringeSummary = $derived(`${syringeName(s.size, s.unit)}${s.setup === 'setup' ? ', with flask and stand' : ''}`)
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another size keeps the reading at the same fraction of the syringe, so
   *  80 of 100 cm³ becomes 40 of 50. */
  function changeSize(size: SyringeSize) {
    const next = syringeScale(size)
    s.reading = roundReading(next, (s.reading / scale.capacity) * next.capacity)
    s.size = size
  }
</script>

<GeneratorPage
  name="Gas Syringe"
  filename="gas-syringe"
  settingsWidth={27}
  {gen}
  {svg}
>
  {#snippet settings()}
    <Section title="Syringe" summary={syringeSummary} icon={Syringe} open>
      <div class="segmented" role="radiogroup" aria-label="Show">
        {#each SETUPS as setup (setup)}
          <button type="button" role="radio" aria-checked={s.setup === setup} class:on={s.setup === setup} onclick={() => (s.setup = setup)}>
            {SETUP_NAMES[setup]}
          </button>
        {/each}
      </div>
      <p class="field-label">Size</p>
      <div class="chips" role="radiogroup" aria-label="Gas syringe size">
        {#each SYRINGE_SIZES as size (size)}
          <button type="button" role="radio" aria-checked={s.size === size} class="chip" class:on={s.size === size} onclick={() => changeSize(size)}>
            {size} {unit}
          </button>
        {/each}
      </div>
      <p class="field-label">Unit</p>
      <div class="chips" role="radiogroup" aria-label="Unit">
        {#each VOLUME_UNITS as u (u)}
          <button type="button" role="radio" aria-checked={s.unit === u} class="chip" class:on={s.unit === u} onclick={() => (s.unit = u)}>
            {UNIT_SYMBOLS[u]}
          </button>
        {/each}
      </div>
    </Section>
    <Section title="Volume of gas" summary={readingText(s)} icon={Ruler} open>
      <ReadingField
        label="Volume of gas"
        value={s.reading}
        decimals={scale.decimals}
        min={scale.lowest}
        max={scale.capacity}
        {unit}
        onchange={(v) => (s.reading = roundReading(scale, v))}
        onrandom={() => (s.reading = randomReading(scale))}
      />
    </Section>
    <Section title="Magnifier" summary={MAGNIFIER_VIEW_NAMES[s.view]} icon={ZoomIn}>
      <MagnifierSettings bind:view={s.view} bind:span={s.span} />
    </Section>
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <SyringeFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
</style>
