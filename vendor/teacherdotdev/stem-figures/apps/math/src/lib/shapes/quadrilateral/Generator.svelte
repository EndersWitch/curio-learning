<script lang="ts">
  // A quadrilateral generator (Rectangle, Parallelogram, Trapezoid or Kite),
  // for whichever family it's given: presets, the quadrilateral's kind and
  // measures, and collapsed settings on the left, the figure card on the
  // right. Settings are mirrored into the page address so a bookmark or shared
  // link brings back exactly this quadrilateral, and the server renders that
  // same quadrilateral on first load. When the measures stop making one, the
  // last one that did stays on screen.
  import { Diameter, MoveDown, RotateCw, Tag } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Section from '$shared/Section.svelte'
  import LineOptions from '$lib/shapes/LineOptions.svelte'
  import PartLabel from '$lib/shapes/PartLabel.svelte'
  import { ROUND_NAMES, UNITS, pretty, roundTo, type Offset, type RawSettings } from '$lib/shapes/parts.js'
  import ShapeFigure from '$lib/shapes/ShapeFigure.svelte'
  import type { Family } from './family.js'
  import { isAngle, kindOf, type Corner, type KindId, type Measure, type Side } from './kinds.js'
  import { buildQuadrilateral } from './layout.js'
  import {
    CORNERS, DIAGONALS, HEIGHTS, MEASURES, SIDES,
    readMoved, readQuadrilateral, writeMoved,
    type QuadrilateralRead, type Settings, type Shape,
  } from './settings.js'

  let { family, title }: { family: Family; title: string } = $props()
  // A generator's family never changes while its page is open.
  // svelte-ignore state_referenced_locally
  const { id, DEFAULT_SETTINGS, cleanSettings, settingsFromParams, settingsToQuery, switchKind } = family

  const gen = generatorState({ tidy: (s) => cleanSettings(s as RawSettings), fromParams: settingsFromParams, toQuery: settingsToQuery, keyOf: settingsToQuery }, id)
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const read = $derived(readQuadrilateral(clean))
  const kind = $derived(kindOf(clean.kind))

  // The last kind and measures that made a quadrilateral, drawn with the current s.
  type Measures = Pick<Settings, 'kind' | Measure>
  const measuresOf = (s: Settings) => Object.fromEntries(['kind', ...MEASURES].map((k) => [k, s[k as keyof Settings]])) as Measures
  type Good = QuadrilateralRead & { shape: Shape; measures: Measures }
  const opening = cleanSettings(DEFAULT_SETTINGS)
  let lastGood = { ...readQuadrilateral(opening), measures: measuresOf(opening) } as Good // the opening quadrilateral always works out
  const good = $derived.by(() => {
    if (read.shape) lastGood = { ...read, measures: measuresOf(clean) } as Good
    return lastGood
  })
  const drawing = $derived(buildQuadrilateral({ ...clean, ...good.measures }, good.shape, good.given))

  const name = (v: Corner) => clean[`name${v}` as const].trim() || v
  const sideName = (s: Side) => `${name(s[0] as Corner)}${name(s[1] as Corner)}`
  const partName = (k: Corner | Side) => (isAngle(k) ? `∠${name(k)}` : sideName(k as Side))

  // How each measure reads: as typed when given, as the side it equals, or worked out and rounded.
  const unitText = $derived(clean.unit.trim() ? ` ${clean.unit.trim()}` : '')
  const rounded = (v: number) => roundTo(v, clean.round)
  const role = (k: Measure) => (kind.givens.includes(k) ? 'given' : kind.equal?.[k as Side] ? 'equal' : 'solved')
  function solvedText(k: Corner | Side) {
    const shape = read.shape
    if (!shape) return '?'
    return rounded(isAngle(k) ? shape.angles[k] : shape.sides[k as Side])
  }
  function measureText(k: Corner | Side) {
    const source = kind.equal?.[k as Side] ?? k
    const typed = kind.givens.includes(source) ? clean[source].trim() : ''
    return `${typed ? pretty(typed) : solvedText(k)}${isAngle(k) ? '°' : unitText}`
  }
  const measureNote = (k: Corner | Side) => {
    if (role(k) === 'given') return 'Its measure, as you typed it.'
    if (role(k) === 'equal') return `Its measure, the same as ${sideName(kind.equal![k as Side]!)}.`
    return `Its measure, worked out from the others and rounded to ${ROUND_NAMES[clean.round]}.`
  }

  const fieldProblem = $derived(MEASURES.map((k) => read.problems[k]).find(Boolean) ?? null)

  function chooseKind(event: Event & { currentTarget: HTMLSelectElement }) {
    gen.apply(switchKind(clean, event.currentTarget.value as KindId))
  }

  function moveLabel(part: string, offset: Offset) {
    const moved = readMoved(s.moved)
    moved[part] = offset
    s.moved = writeMoved(moved)
  }

  // "Other…" stays picked while its box is still empty.
  let pickedOther = $state(false)
  const otherUnit = $derived(pickedOther || !UNITS.includes(clean.unit))
  function chooseUnit(event: Event & { currentTarget: HTMLSelectElement }) {
    const v = event.currentTarget.value
    pickedOther = v === 'other'
    s.unit = pickedOther ? '' : v
  }
  // A preset brings its own unit, so "Other…" is unpicked first.
  const page = { ...gen, apply: (preset: Settings) => ((pickedOther = false), gen.apply(preset)) }

  // A height that lands on a corner is a side already, with no extra line to draw.
  const heightIsSide = (h: 'hD' | 'hC') => {
    const [corner, side] = h === 'hD' ? (['A', 'DA'] as const) : (['B', 'BC'] as const)
    return Math.abs(good.shape.angles[corner] - 90) < 1e-6 ? { corner, side } : null
  }

  const heightsSummary = $derived(HEIGHTS.filter((h) => clean[h]).map((h) => `from ${name(h[1] as Corner)}`).join(' · ') || 'None')
  const diagonalsSummary = $derived(DIAGONALS.filter((d) => clean[d]).map((d) => `${name(d[1] as Corner)}${name(d[2] as Corner)}`).join(' · ') || 'None')
  const labelsSummary = $derived(
    [
      clean.unit.trim() || 'no unit',
      `rounded to ${ROUND_NAMES[clean.round]}`,
      clean.square ? 'right-angle squares' : 'no right-angle squares',
      clean.moved ? 'labels moved' : '',
    ].filter(Boolean).join(' · '),
  )
  const positionSummary = $derived(
    [
      clean.base ? `${sideName(clean.base)} at the bottom` : 'as it stands',
      clean.flip ? 'flipped' : '',
      clean.rotate ? `turned ${clean.rotate}°` : '',
    ].filter(Boolean).join(' · '),
  )

  let svg = $state<SVGSVGElement>()
  const filename = $derived(kind.id)
</script>

{#snippet measureRow(k: Corner | Side)}
  <div class="row">
    {#if isAngle(k)}
      <input class="vname" type="text" maxlength="4" aria-label="Name of corner {k}" placeholder={k} bind:value={s[`name${k}` as const]} />
      <span class="sym" aria-hidden="true">∠</span>
    {:else}
      <span class="sname">{sideName(k as Side)}</span>
    {/if}
    {#if role(k) === 'given'}
      <MathInput
        id="m-{k}" aria-label={isAngle(k) ? `Angle ${name(k)} in degrees` : `Length of ${sideName(k as Side)}`}
        aria-invalid={!!read.problems[k] || read.field === k} bind:value={s[k]}
      />
    {:else}
      <span class="fixed" class:solved={role(k) === 'solved'} title={role(k) === 'equal' ? `The same as ${sideName(kind.equal![k as Side]!)}` : 'Worked out from the others'}>
        {role(k) === 'equal' ? `= ${sideName(kind.equal![k as Side]!)}` : solvedText(k)}
      </span>
    {/if}
    <span class="suffix" class:unit={!isAngle(k)} aria-hidden="true">{isAngle(k) ? '°' : clean.unit.trim()}</span>
    {#if isAngle(k)}
      <PartLabel
        name={partName(k)} id="l-{k}" given={role(k) === 'given'} measure={measureText(k)} note={measureNote(k)} markKind="arcs"
        bind:mode={s[`${k}Label` as const]} bind:text={s[`${k}Text` as const]} bind:marks={s[`${k}Arcs` as const]}
      />
    {:else}
      <PartLabel
        name={partName(k)} id="l-{k}" given={role(k) === 'given'} measure={measureText(k)} note={measureNote(k)} markKind="ticks"
        bind:mode={s[`${k}Label` as const]} bind:text={s[`${k}Text` as const]}
        bind:marks={s[`${k as Side}Ticks` as const]} bind:arrows={s[`${k as Side}Arrows` as const]}
      />
    {/if}
  </div>
{/snippet}

<GeneratorPage name={title} {filename} gen={page} {svg} bind:labelSize={s.labelSize} printWidth={6}>
  {#snippet inputs()}
      <section class="measures">
        <div class="head-row">
          <h2 class="card-head">Measures</h2>
          <HelpTip id="measure-tip" label="How to give the measures">
            {family.kinds.length > 1 ? 'Pick a kind, then fill in its measures' : 'Fill in the measures'}; the rest are worked
            out and shown faintly. Type sqrt for √, / for a fraction and pi for π. Rename a corner in the box before its angle.
            The button after each measure sets its label, congruence marks and parallel arrows.
          </HelpTip>
        </div>

        {#if family.kinds.length > 1}
          <label class="field kind">
            Kind
            <select value={clean.kind} onchange={chooseKind}>
              {#each family.kinds as k}<option value={k.id}>{k.name}</option>{/each}
            </select>
            <span class="hint">{kind.about}</span>
          </label>
        {:else}
          <p class="hint">{kind.about}</p>
        {/if}

        <h3 class="sub">Sides</h3>
        {#each SIDES as s}{@render measureRow(s)}{/each}

        <h3 class="sub">Angles</h3>
        {#each CORNERS as v}{@render measureRow(v)}{/each}

        {#if kind.givens.includes('h')}
          <h3 class="sub">Height</h3>
          <div class="row">
            <span class="sname">h</span>
            <MathInput id="m-h" aria-label="Height between the bases" aria-invalid={!!read.problems.h || read.field === 'h'} bind:value={s.h} />
            <span class="suffix unit" aria-hidden="true">{clean.unit.trim()}</span>
          </div>
          <p class="hint">Between the bases, drawn as the height from {name('D')} under Heights.</p>
        {/if}

        {#if fieldProblem}<p class="help problem">{fieldProblem}</p>
        {:else if read.problem}<p class="help problem">{read.problem}</p>{/if}
      </section>
  {/snippet}

  {#snippet settings()}
        {#if family.heights !== false}
          <Section title="Heights" icon={MoveDown} summary={heightsSummary}>
            {#each HEIGHTS as h}
              {@const v = h[1] as Corner}
              <div class="line-part">
                <label class="check">
                  <input type="checkbox" bind:checked={s[h]} />
                  <span>Height from {name(v)} to {sideName('AB')}</span>
                </label>
                {#if clean[h]}
                  {@const side = heightIsSide(h)}
                  <div class="line-opts">
                    {#if side}<p class="hint note">This height is side {sideName(side.side)}, since ∠{name(side.corner)} is 90°, so there's no extra line to draw.</p>{/if}
                    <LineOptions
                      id={h} name="the height from {name(v)}"
                      bind:style={s[`${h}Style` as const]} bind:mode={s[`${h}Label` as const]} bind:text={s[`${h}Text` as const]}
                    />
                    <label class="field">
                      <span>Name where it lands <span class="hint">optional</span></span>
                      <input type="text" maxlength="4" placeholder={h === 'hD' ? 'E' : 'F'} bind:value={s[`${h}Foot` as const]} />
                    </label>
                  </div>
                {/if}
              </div>
            {/each}
          </Section>
        {/if}

        <Section title="Diagonals" icon={Diameter} summary={diagonalsSummary}>
          {#each DIAGONALS as d}
            {@const ends = `${name(d[1] as Corner)}${name(d[2] as Corner)}`}
            <div class="line-part">
              <label class="check">
                <input type="checkbox" bind:checked={s[d]} />
                <span>Diagonal {ends}</span>
              </label>
              {#if clean[d]}
                <div class="line-opts">
                  <LineOptions
                    id={d} name="diagonal {ends}" placeholder={d === 'dAC' ? 'p' : 'q'}
                    bind:style={s[`${d}Style` as const]} bind:mode={s[`${d}Label` as const]} bind:text={s[`${d}Text` as const]}
                  />
                </div>
              {/if}
            </div>
          {/each}
          {#if clean.dAC && clean.dBD}
            <label class="field cross">
              <span>Name where they cross <span class="hint">optional</span></span>
              <input type="text" maxlength="4" placeholder="E" bind:value={s.cross} />
            </label>
          {/if}
        </Section>

        <Section title="Labels" icon={Tag} summary={labelsSummary}>
          <div class="two">
            <label class="field">
              Unit
              <select value={otherUnit ? 'other' : clean.unit} onchange={chooseUnit}>
                <option value="">None</option>
                {#each UNITS.slice(1) as u}<option value={u}>{u}</option>{/each}
                <option value="other">Other…</option>
              </select>
            </label>
            <label class="field">
              Round to
              <select bind:value={s.round}>
                <option value={0}>Whole numbers</option>
                <option value={1}>Tenths</option>
                <option value={2}>Hundredths</option>
              </select>
            </label>
          </div>
          {#if otherUnit}
            <label class="field">
              Unit name
              <input type="text" maxlength="12" placeholder="km" bind:value={s.unit} />
            </label>
          {/if}
          <label class="check">
            <input type="checkbox" bind:checked={s.square} />
            <span>Right-angle squares <span class="hint">at 90° angles, where heights meet a side, and where diagonals cross at 90°</span></span>
          </label>
          <div class="reset-row">
            <p class="hint">Drag any label on the figure to move it.</p>
            <button class="btn-ghost small" disabled={!clean.moved} onclick={() => (s.moved = '')}>Reset label positions</button>
          </div>
        </Section>

        <Section title="Position" icon={RotateCw} summary={positionSummary}>
          <label class="field">
            Side at the bottom
            <select bind:value={s.base}>
              <option value="">{clean.kind === 'kite' ? 'None (standing upright)' : `${sideName('AB')}, as it stands`}</option>
              {#each SIDES as s}<option value={s}>{sideName(s)}</option>{/each}
            </select>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={s.flip} />
            <span>Flip <span class="hint">mirror left to right</span></span>
          </label>
          <div class="field">
            <label for="rotate">Turn <span class="hint">{clean.rotate}°</span></label>
            <div class="turn">
              <input id="rotate" type="range" min="-180" max="180" step="1" bind:value={s.rotate} />
              <button class="btn-ghost small" disabled={!clean.rotate} onclick={() => (s.rotate = 0)}>Straighten</button>
            </div>
          </div>
        </Section>
  {/snippet}

  {#snippet figure()}
    <ShapeFigure figure={drawing} label={kind.name} bind:svg onmove={moveLabel} />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

  .measures { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.45rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .sub { font-size: 0.8rem; font-weight: 700; color: var(--muted); margin-top: 0.3rem; }
  .row { display: flex; align-items: center; gap: 0.3rem; }
  .row > :global(.caret-field) { flex: 1; min-width: 0; }
  .vname { width: 2.6rem; flex: none; text-align: center; font-family: 'Times New Roman', Times, serif; font-style: italic; font-size: 1.05rem; padding-left: 0.2rem; padding-right: 0.2rem; }
  .sym { font-family: 'Times New Roman', Times, serif; font-size: 1.45rem; width: 1.1rem; line-height: 1; text-align: center; }
  .sname { width: 3.5rem; flex: none; font-family: 'Times New Roman', Times, serif; font-style: italic; font-size: 1.1rem; padding-left: 0.3rem; }
  .suffix { width: 1.6rem; flex: none; font-family: 'Times New Roman', Times, serif; font-size: 1.1rem; color: var(--muted); }
  .suffix.unit { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fixed {
    flex: 1; min-width: 0; min-height: 2.875rem; box-sizing: border-box; display: flex; align-items: center; padding: 0 0.7rem;
    border: 1.5px dashed var(--border); border-radius: 10px; font-family: 'Times New Roman', Times, serif; font-size: 1.1rem;
    color: var(--ink); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  }
  .fixed.solved { color: var(--muted); }
  .field.kind { margin-bottom: 0.2rem; }

  .help { margin: 0.2rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }

  .check { display: flex; align-items: flex-start; gap: 0.5rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0.08rem 0 0; accent-color: var(--blue); flex: none; }
  .check .hint { display: block; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .line-part + .line-part, .cross { border-top: 1px solid var(--border); padding-top: 0.75rem; }
  .line-part .check { margin-bottom: 0.6rem; }
  .line-opts { padding-left: 1.55rem; }
  .note { margin: -0.2rem 0 0.6rem; }

  .reset-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .small { padding: 0.45rem 0.8rem; font-size: 0.85rem; border-radius: 10px; white-space: nowrap; }
  .turn { display: flex; align-items: center; gap: 0.6rem; }
  .turn input { flex: 1; accent-color: var(--blue); }
</style>
