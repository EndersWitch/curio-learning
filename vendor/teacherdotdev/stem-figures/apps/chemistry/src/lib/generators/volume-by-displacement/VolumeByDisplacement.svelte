<script lang="ts">
  // Volume by Displacement: pick a graduated cylinder and how its scale is
  // printed, type the water's reading before and after the object goes in,
  // and get a figure students find the object's volume from.
  import { ArrowUpRight, Circle, Dices, FlaskConical, Rows4, Ruler, Type, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$lib/shared/MagnifierSettings.svelte'
  import ReadingField from '$lib/shared/ReadingField.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { massSettings } from '../mass-reading/settings'
  import ScaleSettings from '../volume-reading/ScaleSettings.svelte'
  import { LIQUID_TINTS, LIQUID_TINT_NAMES } from '../volume-reading/liquid'
  import { UNIT_SYMBOLS, scaleSummary } from '../volume-reading/scale'
  import DisplacementFigure from './DisplacementFigure.svelte'
  import { MARBLE_COUNTS, OBJECTS, OBJECT_NAMES, objectName } from './objects'
  import { displacedVolume, fixReadings, randomReadings } from './readings'
  import {
    DISPLACEMENT_SIZES, DISPLACEMENT_VIEWS, DISPLACEMENT_VIEW_NAMES, answerLine, cylinderScale, displacementSettings, objectInCylinder, volumeText,
    type DisplacementSettings,
  } from './settings'

  const gen = generatorState(displacementSettings, 'volume-by-displacement')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const scale = $derived(cylinderScale(s))
  const unit = $derived(UNIT_SYMBOLS[s.unit])
  const shrunk = $derived(objectInCylinder(s).shrunk)
  const objectSummary = $derived(objectName(s.object, s.marbles).replace(/^a /, 'A '))
  const mL = (v: number) => volumeText(s, v)

  const readingSummary = $derived(`${mL(s.before)} → ${mL(s.after)}, object ${mL(displacedVolume(scale, s))}`)
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Mass Reading with the same object on a digital balance's pan. */
  const massLink = $derived(
    `/mass-reading?${massSettings.toQuery({ ...massSettings.defaults, instrument: 'digital', object: s.object, marbles: s.marbles })}`,
  )

  const setReadings = (before: number, after: number) => Object.assign(s, fixReadings(scale, before, after))

  /** Changes settings, keeping the rest within the rules between them (the
   *  marks to what the cylinder offers, the readings on its scale). */
  const set = (patch: Partial<DisplacementSettings>) => Object.assign(s, displacementSettings.tidy({ ...$state.snapshot(s), ...patch }))

  /** A new size keeps both readings at the same fraction of capacity, so
   *  4 → 6 of 10 mL becomes 40 → 60 of 100. */
  function resize(size: DisplacementSettings['size']) {
    const k = cylinderScale({ ...s, size }).capacity / scale.capacity
    set({ size, before: s.before * k, after: s.after * k })
  }
</script>

<GeneratorPage name="Volume by Displacement" filename="volume-by-displacement" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Graduated cylinder" summary="{s.size} {unit}" icon={FlaskConical} open>
      <div class="chips" role="radiogroup" aria-label="Graduated cylinder size">
        {#each DISPLACEMENT_SIZES as size (size)}
          <button type="button" role="radio" aria-checked={s.size === size} class="chip" class:on={s.size === size} onclick={() => resize(size)}>
            {size} {unit}
          </button>
        {/each}
      </div>
      <p class="field-label">Liquid</p>
      <div class="chips" role="radiogroup" aria-label="Liquid color">
        {#each LIQUID_TINTS as tint (tint)}
          <button type="button" role="radio" aria-checked={s.tint === tint} class="chip" class:on={s.tint === tint} onclick={() => (s.tint = tint)}>
            {LIQUID_TINT_NAMES[tint]}
          </button>
        {/each}
      </div>
    </Section>
    <Section title="Scale" summary={scaleSummary(scale, s.unit)} icon={Rows4}>
      <ScaleSettings instrument={{ instrument: 'cylinder', size: s.size, beaker: 'medium' }} choice={s} onchange={set} />
    </Section>
    <Section title="Readings" summary={readingSummary} icon={Ruler} open>
      <div class="readings">
        <ReadingField
          label="Before reading"
          value={s.before}
          decimals={scale.decimals}
          min={0}
          max={scale.capacity}
          {unit}
          onchange={(v) => setReadings(v, s.after)}
        />
        <ReadingField
          label="After reading"
          value={s.after}
          decimals={scale.decimals}
          min={0}
          max={scale.capacity}
          {unit}
          onchange={(v) => setReadings(s.before, v)}
        />
      </div>
      <p class="note">The after reading is always higher; the displaced volume, {mL(displacedVolume(scale, s))}, is the object’s volume.</p>
      <button type="button" class="btn-ghost random" onclick={() => Object.assign(s, randomReadings(scale))}>
        <Dices size={17} aria-hidden="true" /> Random readings
      </button>
      <label class="check">
        <input type="checkbox" bind:checked={s.guide} />
        <span>
          <strong>Dotted line at the meniscus</strong>
          <small>From its bottom across to the marks, to show where to read.</small>
        </span>
      </label>
    </Section>
    <Section title="Object" summary={objectSummary} icon={Circle} open>
      <div class="segmented" role="radiogroup" aria-label="Object">
        {#each OBJECTS as object (object)}
          <button type="button" role="radio" aria-checked={s.object === object} class:on={s.object === object} onclick={() => (s.object = object)}>
            {OBJECT_NAMES[object]}
          </button>
        {/each}
      </div>
      {#if s.object === 'marbles'}
        <p class="field-label">How many</p>
        <div class="chips" role="radiogroup" aria-label="Number of marbles">
          {#each MARBLE_COUNTS as n (n)}
            <button type="button" role="radio" aria-checked={s.marbles === n} class="chip" class:on={s.marbles === n} onclick={() => (s.marbles = n)}>{n}</button>
          {/each}
        </div>
      {/if}
      <p class="note">
        {#if shrunk}
          There’s too little water to cover an object this big, so it’s drawn smaller. Raise the readings to fix this.
        {:else}
          Note: not to scale.
        {/if}
      </p>
      <p class="note">
        Tip: <a href={massLink} target="_blank" rel="noopener">Mass Reading<ArrowUpRight size={13} aria-hidden="true" /><span class="visually-hidden"> (opens in a new tab)</span></a> can put the same {OBJECT_NAMES[s.object].toLowerCase()} on a balance, for a density question.
      </p>
    </Section>
    <Section title="Magnifiers" summary={DISPLACEMENT_VIEW_NAMES[s.view]} icon={ZoomIn}>
      <MagnifierSettings bind:view={s.view} bind:span={s.span} views={DISPLACEMENT_VIEWS} names={DISPLACEMENT_VIEW_NAMES} />
    </Section>
    <Section title="Captions" summary={[s.beforeCaption, s.afterCaption].map((c) => c.trim() || 'none').join(' / ')} icon={Type}>
      <label class="field">
        <span>Under the first cylinder</span>
        <input type="text" bind:value={s.beforeCaption} maxlength="40" placeholder="None" />
      </label>
      <label class="field">
        <span>Under the second cylinder</span>
        <input type="text" bind:value={s.afterCaption} maxlength="40" placeholder="None" />
      </label>
    </Section>
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <DisplacementFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .readings { display: flex; flex-direction: column; gap: 0.9rem; }
  .note { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.85rem; }
  .note a { color: var(--blue-dark); font-weight: 600; text-decoration: none; }
  .note a:hover { text-decoration: underline; }
  .note a :global(svg) { vertical-align: -0.1em; margin-left: 0.05rem; }
  .random { margin-top: 0.8rem; padding: 0.5rem 0.8rem; font-size: 0.9rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .field + .field { margin-top: 0.8rem; }
  .field span { font-weight: 700; font-size: 0.9rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
</style>
