<script lang="ts">
  // The Mapping Diagram Generator: presets, the inputs, outputs and arrows,
  // and the figure's settings on the left, the figure card on the right.
  // Settings are mirrored into the page address so a bookmark or shared link
  // brings back exactly this diagram, and the server renders that same figure
  // on first load.
  import { Heading, Shapes } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import MappingDiagram from './MappingDiagram.svelte'
  import { SHAPES, cleanSettings, readMapping, readPairs, settingsFromParams, settingsToQuery, type RawSettings, type Shape } from './settings.js'

  const gen = generatorState(
    { tidy: (s) => cleanSettings(s as RawSettings), fromParams: settingsFromParams, toQuery: settingsToQuery, keyOf: settingsToQuery },
    'mapping-diagram',
  )
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const map = $derived(readMapping(clean))

  const hasArrow = (i: number, j: number) => map.arrows.some((a) => a.from === i && a.to === j)
  function toggle(from: string, to: string) {
    const at = s.arrows.findIndex((a) => a.from === from && a.to === to)
    if (at >= 0) s.arrows.splice(at, 1)
    else s.arrows.push({ from, to })
  }
  // The first input to the first output, the second to the second, and so on.
  const matchInOrder = () => (s.arrows = map.inputs.slice(0, map.outputs.length).map((from, i) => ({ from, to: map.outputs[i] })))

  // Ordered pairs fill in both lists and the arrows at once.
  let pairsText = $state('')
  let pairsProblem = $state('')
  function usePairs() {
    const read = readPairs(pairsText)
    if (!read) {
      pairsProblem = 'Type pairs like (1, 4), (2, 5), or one arrow a line, like 1 → 4.'
      return
    }
    s.inputs = read.inputs.join(', ')
    s.outputs = read.outputs.join(', ')
    s.arrows = read.arrows
    pairsText = ''
    pairsProblem = ''
  }

  const LISTS = [
    { key: 'inputs', name: 'Inputs', placeholder: '1, 2, 3, 4' },
    { key: 'outputs', name: 'Outputs', placeholder: '3, 5, 7, 9' },
  ] as const
  const TITLES = [
    { key: 'inputTitle', name: 'Input title', placeholder: 'Input' },
    { key: 'outputTitle', name: 'Output title', placeholder: 'Output' },
    { key: 'title', name: 'Diagram title', placeholder: 'Function f' },
  ] as const

  const listed = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`)
  const titlesSummary = $derived.by(() => {
    const parts = TITLES.map(({ key, name }) =>
      clean[`${key}Mode`] === 'blank' ? `${name}: blank line` : clean[`${key}Mode`] === 'text' && clean[key].trim() ? `“${clean[key].trim()}”` : '',
    )
    return parts.filter(Boolean).join(' · ') || 'None'
  })

  let svg = $state<SVGSVGElement>()
  const filename = 'mapping-diagram'
</script>

<GeneratorPage name="Mapping Diagram Generator" {filename} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="lists">
      <div class="head-row">
        <h2 class="card-head">Inputs and outputs</h2>
        <HelpTip id="lists-tip" label="How to type inputs and outputs">
          Type or paste each list with commas, spaces or one item a line, like 1, 2, 3 or a column copied from a spreadsheet.
          Items can be numbers, math like 2x or 1/2, or words. Each side shows an item once, in the order typed.
        </HelpTip>
      </div>
      <div class="two">
        {#each LISTS as { key, name, placeholder }}
          <label class="list">
            <span>{name}</span>
            <textarea rows="4" {placeholder} bind:value={s[key]}></textarea>
            {#if map.repeated[key].length}
              <span class="help">{listed(map.repeated[key])} {map.repeated[key].length === 1 ? 'is' : 'are'} listed twice, so the diagram shows {map.repeated[key].length === 1 ? 'it' : 'them'} once.</span>
            {/if}
          </label>
        {/each}
      </div>
      <details class="pairs">
        <summary>Or paste ordered pairs</summary>
        <textarea rows="2" aria-label="Ordered pairs" placeholder="(1, 3), (2, 5), (3, 7)" bind:value={pairsText}></textarea>
        {#if pairsProblem}<p class="help problem">{pairsProblem}</p>{/if}
        <button type="button" class="btn-ghost use" onclick={usePairs} disabled={!pairsText.trim()}>Use these pairs</button>
        <p class="hint">This replaces both lists and the arrows.</p>
      </details>
    </section>

    <section class="arrows">
      <div class="head-row">
        <h2 class="card-head">Arrows</h2>
        <HelpTip id="arrows-tip" label="How to draw arrows">
          Under each input, click the outputs it goes to. Click one again to take its arrow away. An input can go to more
          than one output, and an output can come from more than one input. Leave the arrows off for students to draw.
        </HelpTip>
      </div>
      {#if !map.inputs.length || !map.outputs.length}
        <p class="hint">Type some inputs and outputs, then choose where each input goes.</p>
      {:else}
        <div class="map">
          {#each map.inputs as input, i}
            <div class="map-row">
              <span class="from">{input}</span>
              <span class="to" aria-hidden="true">→</span>
              <div class="chips" role="group" aria-label="Outputs for {input}">
                {#each map.outputs as output, j}
                  <button type="button" class="chip" class:on={hasArrow(i, j)} aria-pressed={hasArrow(i, j)} onclick={() => toggle(input, output)}>{output}</button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
        {#if map.verdict}
          <p class="verdict {map.verdict.kind}" aria-live="polite">{map.verdict.text}</p>
        {/if}
        <div class="actions">
          <button type="button" class="link" onclick={matchInOrder}>Match in order</button>
          <button type="button" class="link" onclick={() => (s.arrows = [])} disabled={!map.arrows.length}>Clear arrows</button>
        </div>
      {/if}
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Titles" icon={Heading} summary={titlesSummary}>
      {#each TITLES as { key, name, placeholder }}
        <div class="field">
          <span>{name}</span>
          <LabelField {name} {placeholder} bind:mode={s[`${key}Mode`]} bind:text={s[key]} />
        </div>
      {/each}
    </Section>

    <Section title="Sides" icon={Shapes} summary={SHAPES[clean.shape]}>
      <div class="field">
        <span id="shape-label">Draw each side in</span>
        <div class="segmented" role="radiogroup" aria-labelledby="shape-label">
          {#each Object.entries(SHAPES) as [value, name]}
            <button type="button" role="radio" aria-checked={clean.shape === value} class:on={clean.shape === value} onclick={() => (s.shape = value as Shape)}>{name}</button>
          {/each}
        </div>
      </div>
    </Section>
  {/snippet}

  {#snippet figure()}
    <MappingDiagram settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

  .lists, .arrows { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .arrows { border-top: 1px solid var(--border); }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .list { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  textarea {
    width: 100%; padding: 0.5rem 0.6rem; border: 1.5px solid var(--border); border-radius: 10px;
    font: inherit; font-size: 0.95rem; font-weight: 400; background: #fff; color: var(--ink); resize: vertical;
  }
  textarea:focus { outline: none; border-color: var(--blue); }

  .pairs summary { cursor: pointer; color: var(--blue-dark); font-weight: 700; font-size: 0.85rem; }
  .pairs[open] { display: flex; flex-direction: column; gap: 0.45rem; }
  .pairs[open] summary { margin-bottom: 0.1rem; }
  .use { align-self: flex-start; padding: 0.45rem 0.8rem; font-size: 0.85rem; }

  /* One grid for every row, so the arrows line up under each other. */
  .map { display: grid; grid-template-columns: minmax(1.5rem, max-content) auto 1fr; align-items: start; gap: 0.45rem; }
  .map-row { display: contents; }
  .from { font-weight: 700; padding-top: 0.3rem; overflow-wrap: anywhere; max-width: 6rem; }
  .to { color: var(--muted); padding-top: 0.3rem; }
  .map-row .chips { gap: 0.35rem; }
  .map-row .chip { padding: 0.3rem 0.65rem; font-size: 0.88rem; }

  .verdict { margin: 0.25rem 0 0; font-size: 0.88rem; font-weight: 600; }
  .verdict.not-function { color: var(--ink); }
  .verdict.unfinished { color: var(--muted); font-weight: 500; }
  .actions { display: flex; gap: 1rem; }
  .link { border: 0; padding: 0; background: none; color: var(--blue-dark); font-weight: 700; font-size: 0.85rem; text-decoration: underline; cursor: pointer; }
  .link:disabled { color: #9aa0aa; cursor: default; }
  .help { margin: 0; font-size: 0.8rem; font-weight: 400; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .segmented button { flex: 1; }
</style>
