<script lang="ts">
  // The Spring Scale Generator: pick a scale and what it's printed in, type
  // the force on its hook, and get a figure students read the force from.
  // Settings live in the page address.
  import { Package, Ruler, Type, Weight, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$shared/MagnifierSettings.svelte'
  import ReadingField from '$shared/ReadingField.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { MAGNIFIER_VIEW_NAMES } from '$shared/magnify'
  import SpringScaleFigure from './SpringScaleFigure.svelte'
  import {
    CAPACITIES,
    GRAMS_PER_NEWTON,
    HANGING,
    SCALE_UNITS,
    inGrams,
    maxForce,
    randomForce,
    roundTo,
    springScale,
    tidyForce,
    tidyZero,
    type Capacity,
    type Hanging,
    type ScaleUnits,
  } from './scale'
  import { answerLines, forceText, springScaleSettings } from './settings'

  const gen = generatorState(springScaleSettings, 'spring-scale')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const UNIT_NAMES: Record<ScaleUnits, string> = { newtons: 'Newtons', grams: 'Grams', both: 'Both' }
  const HANGING_NAMES: Record<Hanging, string> = { none: 'Nothing', block: 'Block', masses: 'Slotted masses' }

  const scale = $derived(springScale(s.capacity))
  // Forces are kept in newtons; a scale in grams shows and takes them as grams.
  const inG = $derived(s.units === 'grams')
  const per = $derived(inG ? GRAMS_PER_NEWTON : 1)
  const decimals = $derived(inG ? inGrams(scale).decimals : scale.decimals)
  const unit = $derived(inG ? 'g' : 'N')
  /** a force in newtons as the reading box shows it */
  const shown = (n: number) => roundTo(n * per, decimals)

  const scaleSummary = $derived(
    `${scale.capacity} N (${scale.capacity * GRAMS_PER_NEWTON} g)${s.color ? `, ${scale.colorName}` : ''}, ${s.units === 'both' ? 'N and g' : unit}`,
  )
  const forceSummary = $derived(
    forceText(s, s.force) + (s.zero ? `, zero offset ${forceText(s, s.zero, true)}` : ''),
  )
  const hangingSummary = $derived(
    s.hanging === 'masses'
      ? `${s.masses} slotted mass${s.masses === 1 ? '' : 'es'}`
      : s.hanging === 'block' && s.blockLabel
        ? `Block “${s.blockLabel}”`
        : HANGING_NAMES[s.hanging],
  )
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )

  /** Another scale keeps the force and zero offset in proportion: 3.47 N on a
   *  10 N scale becomes 0.347 N on a 1 N one, so the pointer stays put. */
  function changeCapacity(capacity: Capacity) {
    const next = springScale(capacity)
    const k = next.capacity / scale.capacity
    const zero = tidyZero(next, s.zero * k)
    s.force = tidyForce(next, zero, s.force * k)
    s.zero = zero
    s.capacity = capacity
  }

  function changeZero(zero: number) {
    s.zero = tidyZero(scale, zero)
    s.force = tidyForce(scale, s.zero, s.force)
  }
</script>

<GeneratorPage name="Spring Scale Generator" filename="spring-scale" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Spring scale" summary={scaleSummary} icon={Weight} open>
      <p class="field-label">Capacity</p>
      <div class="chips" role="radiogroup" aria-label="Capacity">
        {#each CAPACITIES as capacity (capacity)}
          {@const c = springScale(capacity)}
          <button type="button" role="radio" aria-checked={s.capacity === capacity} class="chip" class:on={s.capacity === capacity} onclick={() => changeCapacity(capacity)}>
            <span class="swatch" style:background={c.color} aria-hidden="true"></span>
            {c.capacity} N
          </button>
        {/each}
      </div>
      <p class="field-label">Printed in</p>
      <div class="segmented" role="radiogroup" aria-label="Printed in">
        {#each SCALE_UNITS as units (units)}
          <button type="button" role="radio" aria-checked={s.units === units} class:on={s.units === units} onclick={() => (s.units = units)}>
            {UNIT_NAMES[units]}
          </button>
        {/each}
      </div>
      <label class="check color"><input type="checkbox" bind:checked={s.color} /> Color-coded by capacity</label>
    </Section>

    <Section title="Reading" summary={forceSummary} icon={Ruler} open>
      <ReadingField
        label={inG ? 'Mass on the hook' : 'Force on the hook'}
        value={shown(s.force)}
        {decimals}
        min={0}
        max={shown(maxForce(scale, s.zero))}
        {unit}
        onchange={(v) => (s.force = tidyForce(scale, s.zero, v / per))}
        onrandom={() => (s.force = randomForce(scale, s.zero))}
      />
      <div class="zero">
        <ReadingField
          label="Zero offset"
          value={shown(s.zero)}
          {decimals}
          min={shown(-scale.maxZero)}
          max={shown(scale.maxZero)}
          {unit}
          onchange={(v) => changeZero(v / per)}
        />
        <p class="note">Where the pointer rests with nothing hanging: above zero is negative, below is positive. The pointer shows the force plus this.</p>
        {#if s.zero}
          <label class="check"><input type="checkbox" bind:checked={s.unloaded} /> Also show it with nothing hanging</label>
        {/if}
      </div>
    </Section>

    <Section title="On the hook" summary={hangingSummary} icon={Package}>
      <div class="segmented" role="radiogroup" aria-label="On the hook">
        {#each HANGING as hanging (hanging)}
          <button type="button" role="radio" aria-checked={s.hanging === hanging} class:on={s.hanging === hanging} onclick={() => (s.hanging = hanging)}>
            {HANGING_NAMES[hanging]}
          </button>
        {/each}
      </div>
      {#if s.hanging === 'block'}
        <label class="field below">
          Label on the block
          <input type="text" maxlength="12" placeholder="e.g. A" bind:value={s.blockLabel} />
        </label>
      {:else if s.hanging === 'masses'}
        <p class="field-label">Masses</p>
        <div class="chips" role="radiogroup" aria-label="Masses">
          {#each [1, 2, 3, 4, 5] as n (n)}
            <button type="button" role="radio" aria-checked={s.masses === n} class="chip" class:on={s.masses === n} onclick={() => (s.masses = n)}>{n}</button>
          {/each}
        </div>
      {/if}
    </Section>

    <Section title="Magnifier" summary={MAGNIFIER_VIEW_NAMES[s.view]} icon={ZoomIn}>
      <MagnifierSettings bind:view={s.view} bind:span={s.span} />
    </Section>

    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLines(s).replace('\n', ' · ')} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <SpringScaleFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0; }
  .chip { display: inline-flex; align-items: center; gap: 0.4rem; }
  .swatch { width: 0.75rem; height: 0.75rem; border-radius: 50%; border: 1px solid rgba(0, 0, 0, 0.35); }
  .color { margin-top: 1rem; }
  .zero { margin-top: 1rem; padding-top: 0.9rem; border-top: 1px solid var(--border); }
  .zero .note { margin: 0.5rem 0 0.7rem; }
  .below { margin-top: 0.9rem; }
</style>
