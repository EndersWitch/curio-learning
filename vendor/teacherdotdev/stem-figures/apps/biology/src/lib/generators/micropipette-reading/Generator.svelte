<script lang="ts">
  // The Micropipette Reading generator: pick a micropipette, type the volume
  // it's set to, and get a figure students read the volume from its display.
  // Settings live in the page address.
  import { Palette, Pipette, Ruler } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import PipetteFigure from './PipetteFigure.svelte'
  import VolumeField from './VolumeField.svelte'
  import { MODELS, carryVolume, pipette, randomVolume, volumeText, type Model } from './pipette'
  import { digitsText, pipetteSettings } from './settings'

  const gen = generatorState(pipetteSettings, 'micropipette-reading')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const p = $derived(pipette(s.model))

  const pipetteSummary = $derived([p.name, s.tip ? 'with a tip' : 'no tip'].join(', '))
  const readingSummary = $derived(`${volumeText(p, s.volume)}, reads ${digitsText(s)}`)
  const printSummary = $derived([s.color ? 'Color' : 'Black and white', s.decimalLine && p.red.includes(true) ? 'decimal line' : ''].filter(Boolean).join(', '))

  /** Another pipette keeps the volume if it can be set to it, and otherwise starts from its own example. */
  function changeModel(model: Model) {
    s.volume = carryVolume(pipette(model), s.volume)
    s.model = model
  }
</script>

<GeneratorPage name="Micropipette Reading" filename="micropipette-reading" settingsWidth={26} printHeight={7} {gen} {svg}>
  {#snippet settings()}
    <Section title="Micropipette" summary={pipetteSummary} icon={Pipette} open>
      <p class="field-label">Size</p>
      <div class="chips" role="radiogroup" aria-label="Size">
        {#each MODELS as model (model)}
          <button type="button" role="radio" aria-checked={s.model === model} class="chip" class:on={s.model === model} onclick={() => changeModel(model)}>
            {pipette(model).name}
          </button>
        {/each}
      </div>
      <p class="note">Set from {p.min} to {p.max} µL. Its digits count {p.places.slice(0, -1).map((n) => `${n} µL`).join(', ')} and {p.places[p.places.length - 1]} µL, top to bottom.</p>
      <label class="check"><input type="checkbox" bind:checked={s.tip} /> Tip on the end</label>
      <label class="check"><input type="checkbox" bind:checked={s.showModel} /> Size printed above the display</label>
    </Section>

    <Section title="Reading" summary={readingSummary} icon={Ruler} open>
      <VolumeField {p} volume={s.volume} onchange={(v) => (s.volume = v)} onrandom={() => (s.volume = randomVolume(p))} />
    </Section>

    <Section title="Color" summary={printSummary} icon={Palette}>
      <div class="segmented" role="radiogroup" aria-label="Color">
        <button type="button" role="radio" aria-checked={s.color} class:on={s.color} onclick={() => (s.color = true)}>Decimals in red</button>
        <button type="button" role="radio" aria-checked={!s.color} class:on={!s.color} onclick={() => (s.color = false)}>Black and white</button>
      </div>
      <label class="check below"><input type="checkbox" bind:checked={s.decimalLine} /> Line at the decimal point</label>
      <p class="note">
        {#if p.red.includes(true)}
          Red digits show where the decimal point goes. The line keeps that clear on a black and white copy.
        {:else}
          A {p.name} pipette has no red digits, so it has no line.
        {/if}
      </p>
    </Section>
  {/snippet}
  {#snippet figure()}
    <PipetteFigure settings={s} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0; }
  .note { margin: 0.6rem 0 0.8rem; font-size: 0.85rem; color: var(--muted); }
  .check { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
  .check:last-child { margin-bottom: 0; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--blue); }
  .below { margin-top: 0.9rem; }
  .segmented button { font-size: 0.8rem; }
</style>
