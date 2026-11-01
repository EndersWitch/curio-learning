<script lang="ts">
  // The Triangle Generator: presets, the triangle's measures and collapsed
  // settings on the left, the figure card on the right. Settings are mirrored
  // into the page address so a bookmark or shared link brings back exactly this
  // triangle, and the server renders that same triangle on first load. When the
  // measures stop making a triangle, the last one that did stays on screen.
  import { MoveDown, RotateCw, Tag } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Section from '$shared/Section.svelte'
  import LineOptions from '$lib/shapes/LineOptions.svelte'
  import PartLabel from '$lib/shapes/PartLabel.svelte'
  import { ROUND_NAMES, UNITS, pretty, roundTo } from '$lib/shapes/parts.js'
  import ShapeFigure from '$lib/shapes/ShapeFigure.svelte'
  import { buildTriangle } from './layout.js'
  import {
    ANGLES, DEFAULT_SETTINGS, SIDES,
    cleanSettings, readMoved, readTriangle, settingsFromParams, settingsToQuery, writeMoved,
    type Offset, type RawSettings, type Settings, type TriangleRead,
  } from './settings.js'
  import { OPPOSITE, type Part, type Side, type Solved, type Vertex } from './solve.js'

  // Undo history and presets keep the names they were first saved under.
  const gen = generatorState(
    { tidy: (s) => cleanSettings(s as RawSettings), fromParams: settingsFromParams, toQuery: settingsToQuery, keyOf: settingsToQuery },
    'triangle',
    { history: 'mathfigures.triangle.history', presets: 'mathfigures.triangle.presets' },
  )
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const read = $derived(readTriangle(clean))

  // The last measures that made a triangle, drawn with the current settings.
  const MEASURES: Part[] = [...ANGLES, ...SIDES]
  const measuresOf = (s: Settings) => Object.fromEntries(MEASURES.map((k) => [k, s[k]])) as Record<Part, string>
  type Good = TriangleRead & { triangle: Solved; measures: Record<Part, string> }
  const opening = cleanSettings(DEFAULT_SETTINGS)
  let lastGood = { ...readTriangle(opening), measures: measuresOf(opening) } as Good // the opening triangle always solves
  const good = $derived.by(() => {
    if (read.triangle) lastGood = { ...read, measures: measuresOf(clean) } as Good
    return lastGood
  })
  const drawing = $derived(buildTriangle({ ...clean, ...good.measures }, good.triangle, good.given))

  const name = (v: Vertex) => clean[`name${v}` as const].trim() || v
  const sideName = (s: Side) => `${name(s[0] as Vertex)}${name(s[1] as Vertex)}`
  const partName = (k: Part) => (ANGLES.includes(k as Vertex) ? `∠${name(k as Vertex)}` : sideName(k as Side))

  // How each measure reads: as typed when given, else solved and rounded.
  const unitText = $derived(clean.unit.trim() ? ` ${clean.unit.trim()}` : '')
  const rounded = (v: number) => roundTo(v, clean.round)
  function solvedText(k: Part) {
    const t = read.triangle
    if (!t) return ''
    return rounded(ANGLES.includes(k as Vertex) ? t.angles[k as Vertex] : t.sides[k as Side])
  }
  function measureText(k: Part) {
    const typed = clean[k].trim()
    if (ANGLES.includes(k as Vertex)) return `${typed ? pretty(typed) : solvedText(k) || '?'}°`
    if (read.triangle && !read.triangle.sized) return null
    return `${typed ? pretty(typed) : solvedText(k) || '?'}${unitText}`
  }
  const measureNote = (k: Part) => (clean[k].trim() ? 'Its measure, as you typed it.' : `Its measure, worked out from the others and rounded to ${ROUND_NAMES[clean.round]}.`)
  const NO_LENGTHS = 'No side has a length, so the triangle has a shape but no size. Give a side to show lengths.'

  const fieldProblem = $derived(MEASURES.map((k) => read.problems[k]).find(Boolean) ?? null)

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

  const heightsSummary = $derived(ANGLES.filter((v) => clean[`h${v}` as const]).map((v) => `from ${name(v)}`).join(' · ') || 'None')
  const labelsSummary = $derived(
    [
      clean.unit.trim() || 'no unit',
      `rounded to ${ROUND_NAMES[clean.round]}`,
      clean.square ? 'right-angle squares' : 'no right-angle squares',
      clean.moved ? 'labels moved' : '',
    ].filter(Boolean).join(' · '),
  )
  const positionSummary = $derived(
    [`${sideName(clean.base)} at the bottom`, clean.flip ? 'flipped' : '', clean.rotate ? `turned ${clean.rotate}°` : ''].filter(Boolean).join(' · '),
  )

  let svg = $state<SVGSVGElement>()
  const filename = 'triangle'
</script>

<GeneratorPage name="Triangle Generator" {filename} gen={page} {svg} bind:labelSize={s.labelSize} printWidth={6}>
  {#snippet inputs()}
    <section class="measures">
      <div class="head-row">
        <h2 class="card-head">Measures</h2>
        <HelpTip id="measure-tip" label="How to give the measures">
          Fill in any three: two angles and a side, two sides and an angle, or three sides. The rest are worked out and
          shown faintly. Type sqrt for √, / for a fraction and pi for π. Rename a corner in the box before its angle.
        </HelpTip>
      </div>

      <h3 class="sub">Angles</h3>
      {#each ANGLES as v}
        <div class="row">
          <input class="vname" type="text" maxlength="4" aria-label="Name of corner {v}" placeholder={v} bind:value={s[`name${v}` as const]} />
          <span class="sym" aria-hidden="true">∠</span>
          <MathInput
            id="m-{v}" aria-label="Angle {name(v)} in degrees" placeholder={clean[v].trim() ? '' : solvedText(v)}
            aria-invalid={!!read.problems[v] || read.field === v} bind:value={s[v]}
          />
          <span class="suffix" aria-hidden="true">°</span>
          <PartLabel
            name={partName(v)} id="l-{v}" given={!!clean[v].trim()} measure={measureText(v)} note={measureNote(v)} markKind="arcs"
            bind:mode={s[`${v}Label` as const]} bind:text={s[`${v}Text` as const]} bind:marks={s[`${v}Arcs` as const]}
          />
        </div>
      {/each}

      <h3 class="sub">Sides</h3>
      {#each SIDES as side}
        <div class="row">
          <span class="sname">{sideName(side)}</span>
          <MathInput
            id="m-{side}" aria-label="Length of {sideName(side)}" placeholder={clean[side].trim() ? '' : read.triangle?.sized ? solvedText(side) : ''}
            aria-invalid={!!read.problems[side] || read.field === side} bind:value={s[side]}
          />
          <span class="suffix unit" aria-hidden="true">{clean.unit.trim()}</span>
          <PartLabel
            name={partName(side)} id="l-{side}" given={!!clean[side].trim()} measure={measureText(side)} note={measureNote(side)} unavailable={NO_LENGTHS}
            markKind="ticks" bind:mode={s[`${side}Label` as const]} bind:text={s[`${side}Text` as const]} bind:marks={s[`${side}Ticks` as const]}
          />
        </div>
      {/each}

      {#if fieldProblem}<p class="help problem">{fieldProblem}</p>
      {:else if read.problem}<p class="help problem">{read.problem}</p>{/if}
      {#if read.triangle?.ambiguous}
        <label class="check other">
          <input type="checkbox" bind:checked={s.other} />
          <span>Show the other triangle <span class="hint">These measures make two triangles.</span></span>
        </label>
      {/if}
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Heights" icon={MoveDown} summary={heightsSummary}>
      {#each ANGLES as v}
        {@const h = `h${v}` as const}
        <div class="height">
          <label class="check">
            <input type="checkbox" bind:checked={s[h]} />
            <span>Height from {name(v)} to {sideName(OPPOSITE[v])}</span>
          </label>
          {#if clean[h]}
            {@const right = ANGLES.find((u) => u !== v && Math.abs((good.triangle.angles[u] ?? 0) - 90) < 1e-6)}
            <div class="height-opts">
              {#if right}<p class="hint note">This height is side {sideName(`${v}${right}` as Side)}, since ∠{name(right)} is 90°, so there's no extra line to draw.</p>{/if}
              <LineOptions
                id={h} name="the height from {name(v)}" unavailable={read.triangle && !read.triangle.sized ? NO_LENGTHS : ''}
                bind:style={s[`${h}Style` as const]} bind:mode={s[`${h}Label` as const]} bind:text={s[`${h}Text` as const]}
              />
              <label class="field">
                <span>Name where it lands <span class="hint">optional</span></span>
                <input type="text" maxlength="4" placeholder="D" bind:value={s[`${h}Foot` as const]} />
              </label>
            </div>
          {/if}
        </div>
      {/each}
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
        <span>Right-angle squares <span class="hint">at 90° angles and where heights meet a side</span></span>
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
          {#each SIDES as side}<option value={side}>{sideName(side)}</option>{/each}
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
    <ShapeFigure figure={drawing} label="Triangle" bind:svg onmove={moveLabel} />
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

  .help { margin: 0.2rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }

  .check { display: flex; align-items: flex-start; gap: 0.5rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0.08rem 0 0; accent-color: var(--blue); flex: none; }
  .check .hint { display: block; }
  .check.other { margin: 0.3rem 0 0; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .height + .height { border-top: 1px solid var(--border); padding-top: 0.75rem; }
  .height .check { margin-bottom: 0.6rem; }
  .height-opts { padding-left: 1.55rem; }
  .note { margin: -0.2rem 0 0.6rem; }

  .reset-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .small { padding: 0.45rem 0.8rem; font-size: 0.85rem; border-radius: 10px; white-space: nowrap; }
  .turn { display: flex; align-items: center; gap: 0.6rem; }
  .turn input { flex: 1; accent-color: var(--blue); }
</style>
