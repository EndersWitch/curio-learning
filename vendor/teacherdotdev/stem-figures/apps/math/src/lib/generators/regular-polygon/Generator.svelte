<script lang="ts">
  // The Regular Polygon Generator: presets, the polygon's number of sides and
  // size, and collapsed settings on the left, the figure card on the right.
  // Settings are mirrored into the page address so a bookmark or shared link
  // brings back exactly this polygon, and the server renders that same polygon
  // on first load. When the size can't be read, the last polygon that could
  // stays on screen.
  import { CircleDot, RotateCw, Tag } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Section from '$shared/Section.svelte'
  import LineOptions from '$lib/shapes/LineOptions.svelte'
  import PartLabel from '$lib/shapes/PartLabel.svelte'
  import { ROUND_NAMES, UNITS, pretty, roundTo, type Offset } from '$lib/shapes/parts.js'
  import ShapeFigure from '$lib/shapes/ShapeFigure.svelte'
  import { buildPolygon } from './layout.js'
  import {
    DEFAULT_SETTINGS, MAX_SIDES, MIN_SIDES, SIZES,
    cleanSettings, polygonName, readMoved, readPolygon, settingsFromParams, settingsToQuery, writeMoved,
    type Polygon, type RawSettings, type Settings, type SizeBy,
  } from './settings.js'

  const gen = generatorState(
    { tidy: (s) => cleanSettings(s as RawSettings), fromParams: settingsFromParams, toQuery: settingsToQuery, keyOf: settingsToQuery },
    'regular-polygon',
  )
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const read = $derived(readPolygon(clean))

  // The last size that could be read, drawn with the current settings.
  let lastGood: Pick<Settings, 'size' | 'sizeBy'> = { size: DEFAULT_SETTINGS.size, sizeBy: DEFAULT_SETTINGS.sizeBy }
  const drawn = $derived.by(() => {
    if (read.polygon) lastGood = { size: clean.size, sizeBy: clean.sizeBy }
    return { ...clean, ...lastGood }
  })
  const shown = $derived<Polygon>(readPolygon(drawn).polygon!) // the last good size always reads
  const drawing = $derived(buildPolygon(drawn, shown))

  const SIDE_COUNTS = Array.from({ length: MAX_SIDES - MIN_SIDES + 1 }, (_, i) => MIN_SIDES + i)
  const unitText = $derived(clean.unit.trim() ? ` ${clean.unit.trim()}` : '')
  const rounded = (v: number) => roundTo(v, clean.round)
  /** A length as a label writes it: as typed when it's the size given, else worked out and rounded. */
  const lengthText = (by: SizeBy, v: number) => `${clean.sizeBy === by && clean.size.trim() ? pretty(clean.size.trim()) : rounded(v)}${unitText}`
  const solvedNote = $derived(`Worked out from the ${SIZES[clean.sizeBy].toLowerCase()} and rounded to ${ROUND_NAMES[clean.round]}.`)

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

  const linesSummary = $derived(
    [clean.apothem ? 'apothem' : '', clean.radius ? 'radius' : '', clean.radii ? 'all radii' : '', clean.dot ? 'center dot' : ''].filter(Boolean).join(' · ') ||
      'None',
  )
  const labelsSummary = $derived(
    [
      clean.letters ? 'corners lettered' : '',
      clean.unit.trim() || 'no unit',
      `rounded to ${ROUND_NAMES[clean.round]}`,
      clean.moved ? 'labels moved' : '',
    ].filter(Boolean).join(' · '),
  )

  let svg = $state<SVGSVGElement>()
  const filename = $derived(polygonName(clean.n).toLowerCase().replace(/\s+/g, '-'))
</script>

<GeneratorPage name="Regular Polygon Generator" {filename} gen={page} {svg} bind:labelSize={s.labelSize} printWidth={6}>
  {#snippet inputs()}
    <section class="measures">
      <div class="head-row">
        <h2 class="card-head">Polygon</h2>
        <HelpTip id="polygon-tip" label="How to set the polygon">
          Pick the number of sides, then give one measure: the side, the radius (center to a corner) or the apothem (center
          to the middle of a side). The rest are worked out. Type sqrt for √ and / for a fraction. The button after the side
          and the angle sets their label and congruence marks, which go on every side or angle.
        </HelpTip>
      </div>

      <label class="field">
        Sides
        <select bind:value={s.n}>
          {#each SIDE_COUNTS as n}<option value={n}>{n} · {polygonName(n)}</option>{/each}
        </select>
      </label>

      <div class="field">
        <span id="size-by">Size from</span>
        <div class="segmented" role="radiogroup" aria-labelledby="size-by">
          {#each (Object.entries(SIZES) as [SizeBy, string][]) as [value, title]}
            <button type="button" role="radio" aria-checked={clean.sizeBy === value} class:on={clean.sizeBy === value} onclick={() => (s.sizeBy = value)}>{title}</button>
          {/each}
        </div>
        <div class="row">
          <MathInput id="m-size" aria-label="The {SIZES[clean.sizeBy].toLowerCase()}'s length" aria-invalid={!!read.problem} bind:value={s.size} />
          <span class="suffix unit" aria-hidden="true">{clean.unit.trim()}</span>
        </div>
        {#if read.problem}<p class="help problem">{read.problem}</p>{/if}
      </div>

      <h3 class="sub">Measures</h3>
      <div class="row">
        <span class="mname">Side</span>
        <span class="fixed" class:solved={clean.sizeBy !== 'side'}>{lengthText('side', shown.side)}</span>
        <PartLabel
          name="the sides" id="l-side" given={clean.sizeBy === 'side'} measure={lengthText('side', shown.side)}
          note={clean.sizeBy === 'side' ? 'Its length, as you typed it.' : solvedNote} markKind="ticks"
          bind:mode={s.sideLabel} bind:text={s.sideText} bind:marks={s.sideTicks}
        />
      </div>
      <div class="row">
        <span class="mname">Angle</span>
        <span class="fixed solved">{rounded(shown.interior)}°</span>
        <PartLabel
          name="the angles" id="l-angle" given={false} measure="{rounded(shown.interior)}°" note="Each interior angle: 180° × (n − 2) ÷ n."
          markKind="arcs" bind:mode={s.angleLabel} bind:text={s.angleText} bind:marks={s.angleArcs}
        />
      </div>
      <dl class="facts">
        <div><dt>Apothem</dt><dd class:solved={clean.sizeBy !== 'apothem'}>{lengthText('apothem', shown.apothem)}</dd></div>
        <div><dt>Radius</dt><dd class:solved={clean.sizeBy !== 'radius'}>{lengthText('radius', shown.radius)}</dd></div>
        <div><dt>Central angle</dt><dd class="solved">{rounded(shown.central)}°</dd></div>
      </dl>
      <p class="hint">The side's label goes on the bottom side, and the angle's in the bottom left corner.</p>
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Center and lines" icon={CircleDot} summary={linesSummary}>
      <label class="check">
        <input type="checkbox" bind:checked={s.dot} />
        <span>Center dot</span>
      </label>
      <label class="field">
        <span>Name the center <span class="hint">optional</span></span>
        <input type="text" maxlength="4" placeholder="O" bind:value={s.centerName} />
      </label>
      {#each ([['apothem', 'Apothem', 'center to the middle of the bottom side', 'a'], ['radius', 'Radius', 'center to the bottom right corner', 'r']] as const) as [key, title, hint, placeholder]}
        <div class="line-part">
          <label class="check">
            <input type="checkbox" bind:checked={s[key]} />
            <span>{title} <span class="hint">{hint}</span></span>
          </label>
          {#if clean[key]}
            <div class="line-opts">
              <LineOptions
                id={key} name="the {key}" {placeholder}
                bind:style={s[`${key}Style`]} bind:mode={s[`${key}Label`]} bind:text={s[`${key}Text`]}
              />
            </div>
          {/if}
        </div>
      {/each}
      <label class="check line-part">
        <input type="checkbox" bind:checked={s.radii} />
        <span>All the radii <span class="hint">from the center to every corner, drawn like the radius</span></span>
      </label>
    </Section>

    <Section title="Labels" icon={Tag} summary={labelsSummary}>
      <label class="check">
        <input type="checkbox" bind:checked={s.letters} />
        <span>Letter the corners <span class="hint">A, B, C… from the bottom left</span></span>
      </label>
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
        <span>Right-angle squares <span class="hint">where the apothem meets its side, and at 90° corners</span></span>
      </label>
      <div class="reset-row">
        <p class="hint">Drag any label on the figure to move it.</p>
        <button class="btn-ghost small" disabled={!clean.moved} onclick={() => (s.moved = '')}>Reset label positions</button>
      </div>
    </Section>

    <Section title="Position" icon={RotateCw} summary={clean.rotate ? `turned ${clean.rotate}°` : 'a side at the bottom'}>
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
    <ShapeFigure figure={drawing} label="Regular {polygonName(clean.n).toLowerCase()}" bind:svg onmove={moveLabel} />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

  .measures { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.45rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .sub { font-size: 0.8rem; font-weight: 700; color: var(--muted); margin-top: 0.3rem; }
  .row { display: flex; align-items: center; gap: 0.3rem; }
  .row > :global(.caret-field) { flex: 1; min-width: 0; }
  .mname { width: 3.5rem; flex: none; font-weight: 600; font-size: 0.88rem; }
  .suffix { width: 1.6rem; flex: none; font-family: 'Times New Roman', Times, serif; color: var(--muted); }
  .suffix.unit { font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .fixed {
    flex: 1; min-width: 0; min-height: 2.875rem; box-sizing: border-box; display: flex; align-items: center; padding: 0 0.7rem;
    border: 1.5px dashed var(--border); border-radius: 10px; font-family: 'Times New Roman', Times, serif; font-size: 1.1rem;
    color: var(--ink); overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  }
  .solved { color: var(--muted); }
  .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.4rem; margin: 0.2rem 0 0; }
  .facts div { display: flex; flex-direction: column; gap: 0.1rem; }
  .facts dt { font-size: 0.75rem; font-weight: 700; color: var(--muted); }
  .facts dd { margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 1.1rem; }
  .facts dd.solved { color: var(--muted); }

  .help { margin: 0.2rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }

  .check { display: flex; align-items: flex-start; gap: 0.5rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0.08rem 0 0; accent-color: var(--blue); flex: none; }
  .check .hint { display: block; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .measures .field { margin-bottom: 0.3rem; }
  .segmented button { flex: 1; display: inline-grid; place-items: center; padding: 0.3rem 0.4rem; }
  .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .line-part { border-top: 1px solid var(--border); padding-top: 0.75rem; }
  .line-part .check { margin-bottom: 0.6rem; }
  .line-opts { padding-left: 1.55rem; }

  .reset-row { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
  .small { padding: 0.45rem 0.8rem; font-size: 0.85rem; border-radius: 10px; white-space: nowrap; }
  .turn { display: flex; align-items: center; gap: 0.6rem; }
  .turn input { flex: 1; accent-color: var(--blue); }
</style>
