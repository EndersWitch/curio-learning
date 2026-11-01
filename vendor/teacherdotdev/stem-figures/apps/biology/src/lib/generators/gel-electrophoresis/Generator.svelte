<script lang="ts">
  // Gel Electrophoresis: lanes of DNA run on an agarose gel, a ladder and the
  // band sizes the teacher types in each sample lane, each band run as far
  // as its size takes it. Settings live in the page address.
  import { ArrowLeft, ArrowRight, Plus, Rows3, SlidersHorizontal, Tag, Trash2, Type } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import { answerLines, layoutGel, sizeText } from './figure'
  import GelFigure from './GelFigure.svelte'
  import { LADDERS, LADDER_IDS } from './ladders'
  import { MAX_BANDS_TEXT, MAX_LABEL, MAX_LANES, MIN_LANES, nextId, parseBands, type Lane } from './lanes'
  import { GELS, GEL_RANGES, type Gel } from './migration'
  import { SCENARIOS } from './scenarios'
  import { ELECTRODES, LANE_LABELS, LOOKS, SIZE_LABELS, SIZE_UNITS, gelSettings, type Look } from './settings'

  const gen = generatorState(gelSettings, 'gel-electrophoresis')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const at = $derived(layoutGel(clean))
  const answers = $derived(answerLines(clean))
  let svg = $state<SVGSVGElement>()

  const LOOK_NAMES: Record<Look, string> = { print: 'Printable', blue: 'Blue stain', glow: 'Glowing' }
  const LOOK_NOTES: Record<Look, string> = {
    print: 'Dark bands on a white gel, for a black-and-white copier.',
    blue: 'Blue bands on a pale gel, as a classroom DNA stain leaves them.',
    glow: 'Glowing bands on a dark gel, as a stained gel looks under UV or blue light. For slides.',
  }
  const GEL_NAMES = Object.fromEntries(GELS.map((g) => [g, `${g}%`])) as Record<Gel, string>
  const LANE_LABEL_NAMES = { text: 'Names', blank: 'Blank lines', none: 'None' }
  const SIZE_LABEL_NAMES = { sizes: 'Sizes', blank: 'Blank lines', none: 'None' }
  const UNIT_NAMES = { bp: 'bp', kb: 'kb' }
  const ELECTRODE_NAMES = { signs: 'Signs', labeled: 'Named', blank: 'Blank', none: 'None' }
  const ELECTRODE_NOTES = {
    signs: 'A black − at the wells and a red + at the far end.',
    labeled: 'The signs, with Cathode beside the − and Anode beside the +.',
    blank: 'Empty circles at each end, for students to mark − and +.',
    none: 'No electrodes.',
  }

  const range = (gel: Gel) => GEL_RANGES[gel].map((bp) => sizeText(bp, 'bp', false)).join('–') + ' bp'
  const laneTitle = (lane: Lane) => (lane.type === 'ladder' ? 'Ladder' : 'Sample')

  const lanesSummary = $derived(clean.lanes.map((l) => l.label.trim() || laneTitle(l)).join(', '))
  const gelSummary = $derived(`${clean.gel}% agarose, ${LOOK_NAMES[clean.look].toLowerCase()}${clean.ruler ? ', ruler' : ''}`)
  const labelSummary = $derived(
    [
      `Lane ${LANE_LABEL_NAMES[clean.laneLabels].toLowerCase()}`,
      clean.laneNumbers ? 'numbers' : '',
      `ladder ${SIZE_LABEL_NAMES[clean.sizeLabels].toLowerCase()}`,
      `electrodes ${ELECTRODE_NAMES[clean.electrodes].toLowerCase()}`,
    ]
      .filter(Boolean)
      .join(', '),
  )
  const textSummary = $derived(
    [clean.titleMode === 'text' && clean.title ? `“${clean.title}”` : 'No title', clean.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )
  /** A ladder away from either end of the gel, whose sizes can't be written beside it. */
  const middleLadder = $derived(clean.sizeLabels !== 'none' && clean.lanes.some((l, i) => l.type === 'ladder' && i > 0 && i < clean.lanes.length - 1))
  const noLadderLabels = $derived(clean.sizeLabels !== 'none' && clean.lanes.some((l) => l.type === 'ladder') && !at.sizes.length)

  function start(id: string) {
    const scenario = SCENARIOS.find((x) => x.id === id)
    if (!scenario) return
    s.lanes = scenario.lanes.map((lane) => ({ ...lane }))
    s.gel = scenario.gel
  }
  // The setup picker shows the experiment the gel still is; changing its gel
  // or any lane leaves it blank again.
  const sameLane = (a: Lane, b: Lane) =>
    a.type === b.type && a.label === b.label &&
    (a.type === 'ladder' ? a.ladder === (b as typeof a).ladder : a.bands === (b as typeof a).bands)
  const scenarioId = $derived(
    SCENARIOS.find((x) => x.gel === clean.gel && x.lanes.length === clean.lanes.length && x.lanes.every((l, i) => sameLane(l, clean.lanes[i])))?.id ?? '',
  )

  function add(lane: Lane) {
    if (s.lanes.length < MAX_LANES) s.lanes.push(lane)
  }

  function move(i: number, by: number) {
    const j = i + by
    if (j < 0 || j >= s.lanes.length) return
    ;[s.lanes[i], s.lanes[j]] = [s.lanes[j], s.lanes[i]]
  }

  const list = (sizes: number[]) => sizes.map((bp) => sizeText(bp, 'bp', false)).join(', ')
</script>

{#snippet segmented(name: string, options: readonly string[], names: Record<string, string>, value: string, set: (v: any) => void)}
  <div class="segmented" role="radiogroup" aria-label={name}>
    {#each options as option (option)}
      <button type="button" role="radio" aria-checked={value === option} class:on={value === option} onclick={() => set(option)}>
        {names[option]}
      </button>
    {/each}
  </div>
{/snippet}

<GeneratorPage name="Gel Electrophoresis" filename="gel-electrophoresis" settingsWidth={27} printWidth={6.5} printHeight={8} {gen} {svg}>
  {#snippet settings()}
    <Section title="Lanes" summary={lanesSummary} icon={Rows3} open>
      <label class="text-field">
        <span>Classic setups</span>
        <select value={scenarioId} onchange={(e) => start(e.currentTarget.value)}>
          <option value="" disabled>Choose one…</option>
          {#each SCENARIOS as scenario (scenario.id)}<option value={scenario.id}>{scenario.name}</option>{/each}
        </select>
      </label>
      <p class="note">
        {SCENARIOS.find((x) => x.id === scenarioId)?.note ?? 'Replaces the lanes and gel with a ready-made experiment. Undo brings yours back.'}
      </p>

      <div class="lanes">
        {#each s.lanes as lane, i (lane.id)}
          {@const drawn = at.lanes[i]}
          {@const name = lane.label.trim() || `${laneTitle(lane)} ${i + 1}`}
          <div class="lane">
            <div class="lane-head">
              <strong>{i + 1}. {laneTitle(lane)}</strong>
              <button type="button" class="icon-btn" aria-label="Move {name} left" data-tip="Move left" disabled={i === 0} onclick={() => move(i, -1)}>
                <ArrowLeft size={17} />
              </button>
              <button
                type="button" class="icon-btn" aria-label="Move {name} right" data-tip="Move right"
                disabled={i === s.lanes.length - 1} onclick={() => move(i, 1)}
              >
                <ArrowRight size={17} />
              </button>
              <button
                type="button" class="icon-btn" aria-label="Remove {name}" data-tip="Remove"
                disabled={s.lanes.length <= MIN_LANES} onclick={() => s.lanes.splice(i, 1)}
              >
                <Trash2 size={17} />
              </button>
            </div>
            <label class="text-field">
              <span>Label</span>
              <input type="text" maxlength={MAX_LABEL} placeholder={lane.type === 'ladder' ? 'e.g. Ladder' : 'e.g. Suspect 1'} bind:value={lane.label} />
            </label>
            {#if lane.type === 'ladder'}
              <label class="text-field">
                <span>Ladder</span>
                <select bind:value={lane.ladder}>
                  {#each LADDER_IDS as id (id)}<option value={id}>{LADDERS[id].name}</option>{/each}
                </select>
              </label>
            {:else}
              {@const bad = parseBands(lane.bands).bad}
              <label class="text-field">
                <span>Bands <span class="hint">in bp, separated by commas</span></span>
                <input type="text" maxlength={MAX_BANDS_TEXT} placeholder="e.g. 1200, 450, 300" aria-invalid={bad.length > 0} bind:value={lane.bands} />
              </label>
              {#if bad.length}
                <p class="warning" role="status">Not band sizes, so left out: {bad.join(', ')}.</p>
              {/if}
            {/if}
            {#if drawn?.outside.length}
              <p class="note">
                {list(drawn.outside)} bp {drawn.outside.length === 1 ? 'is' : 'are'} outside what a {clean.gel}% gel separates well ({range(clean.gel)}),
                so {drawn.outside.length === 1 ? 'it crowds' : 'they crowd'} toward an end.
              </p>
            {/if}
            {#each drawn?.merged ?? [] as sizes (sizes.join())}
              <p class="note">{list(sizes)} bp run too close together on this gel to separate, so they make one thicker band.</p>
            {/each}
          </div>
        {/each}
      </div>
      {#if s.lanes.length < MAX_LANES}
        <div class="actions">
          <button
            type="button" class="btn-ghost small"
            onclick={() => add({ type: 'sample', id: nextId(s.lanes), label: '', bands: '' })}
          >
            <Plus size={17} aria-hidden="true" /> Sample
          </button>
          <button type="button" class="btn-ghost small" onclick={() => add({ type: 'ladder', id: nextId(s.lanes), label: 'Ladder', ladder: '1kb' })}>
            <Plus size={17} aria-hidden="true" /> Ladder
          </button>
        </div>
      {/if}
      <p class="note">
        Type “x2” after a size for twice as much DNA, a darker band (e.g. 450 x2), or “x0.5” for a fainter one. Sizes can be in kb, e.g. 1.5 kb.
      </p>
    </Section>

    <Section title="Gel" summary={gelSummary} icon={SlidersHorizontal} open>
      <p class="field-label">Agarose</p>
      {@render segmented('Agarose', GELS, GEL_NAMES, s.gel, (v) => (s.gel = v))}
      <p class="note">
        A {clean.gel}% gel separates about {range(clean.gel)}. Smaller pieces run farther; a stronger gel spreads out smaller ones.
      </p>
      <p class="field-label spaced">Look</p>
      {@render segmented('Look', LOOKS, LOOK_NAMES, s.look, (v) => (s.look = v))}
      <p class="note">{LOOK_NOTES[s.look]}</p>
      <label class="check spaced">
        <input type="checkbox" bind:checked={s.ruler} />
        <span>Ruler, for measuring how far each band ran</span>
      </label>
      {#if s.ruler}
        <p class="note">In cm and mm, with 0 at the bottom of the wells.</p>
      {/if}
    </Section>

    <Section title="Labels" summary={labelSummary} icon={Tag}>
      <p class="field-label">Lane labels</p>
      {@render segmented('Lane labels', LANE_LABELS, LANE_LABEL_NAMES, s.laneLabels, (v) => (s.laneLabels = v))}
      <label class="check">
        <input type="checkbox" bind:checked={s.laneNumbers} />
        <span>Lane numbers</span>
      </label>
      <p class="field-label spaced">Ladder sizes</p>
      {@render segmented('Ladder sizes', SIZE_LABELS, SIZE_LABEL_NAMES, s.sizeLabels, (v) => (s.sizeLabels = v))}
      {#if s.sizeLabels === 'sizes'}
        <div class="units">{@render segmented('Units', SIZE_UNITS, UNIT_NAMES, s.sizeUnits, (v) => (s.sizeUnits = v))}</div>
      {/if}
      {#if middleLadder || noLadderLabels}
        <p class="note">Sizes are written beside a ladder in the first or last lane only.</p>
      {/if}
      <p class="field-label spaced">Electrodes</p>
      {@render segmented('Electrodes', ELECTRODES, ELECTRODE_NAMES, s.electrodes, (v) => (s.electrodes = v))}
      <p class="note">{ELECTRODE_NOTES[s.electrodes]}</p>
    </Section>

    <Section title="Chart title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings
        bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey}
        answer={answers.join(' · ') || 'nothing yet'}
      />
      <p class="note">The answer key lists each sample lane’s band sizes, and the ladder’s when its sizes are blank.</p>
    </Section>
  {/snippet}
  {#snippet figure()}
    <GelFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .lanes { margin-top: 0.9rem; border-top: 1px solid var(--border); }
  .lane { padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.55rem; }
  .lane-head { display: flex; align-items: center; gap: 0.25rem; }
  .lane-head strong { flex: 1; font-size: 0.92rem; }
  .text-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.88rem; font-weight: 700; }
  .text-field input, .text-field select { font-weight: 400; }
  .hint { font-weight: 400; color: var(--muted); }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .lane .note { margin: 0; }
  .warning { margin: 0; padding: 0.55rem 0.75rem; border-radius: 10px; background: var(--red-soft); color: #991b1b; font-size: 0.85rem; }
  .field-label { margin: 0 0 0.45rem; font-weight: 700; font-size: 0.88rem; }
  .field-label.spaced { margin-top: 0.9rem; }
  .check { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.88rem; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0.1rem 0 0; flex: none; accent-color: var(--blue); }
  :global(.segmented) + .check { margin-top: 0.7rem; }
  .check.spaced { margin-top: 0.9rem; }
  .units { margin-top: 0.5rem; max-width: 9rem; }
</style>
