<script lang="ts">
  // Population Growth: type a population's starting size, growth rate r and
  // carrying capacity K, and graph its growth: exponential (a J-curve),
  // logistic (an S-curve), both, or one that overshoots K or crashes. Show
  // the population size over time, the growth rate dN/dt or the per capita
  // growth rate, one graph or two stacked, with K, the inflection point, the
  // growth phases and census data marked if wanted. The grids and axes are
  // $shared/graph's, the same as Chemistry's titration curve.
  import { ChartLine, ChartScatter, Dices, MapPin, Spline } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import AxisSettings from '$shared/graph/AxisSettings.svelte'
  import GridlineSettings from '$shared/graph/GridlineSettings.svelte'
  import { readAxes } from '$shared/graph/axes'
  import { COLORS, type Color } from '$shared/graph/colors'
  import HelpTip from '$shared/HelpTip.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import { buildPopulation } from './figure'
  import { censusEveryFor, fitAxes, plain } from './fit'
  import { MODELS, hasK, hasLogistic, type Model } from './growth'
  import LowerAxisSettings from './LowerAxisSettings.svelte'
  import PopulationFigure from './PopulationFigure.svelte'
  import {
    GRAPHS, GRAPH_IDS, MODEL_NAMES, NOISES, UNITS, againstOf, populationSettings, titlesFor, viewsOf,
    type Graphs, type PopulationSettings, type Unit,
  } from './settings'
  import { SETUPS, settingsFor } from './setups'
  import TitleSettings from './TitleSettings.svelte'

  const gen = generatorState(populationSettings, 'population-growth')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const g = $derived(buildPopulation(clean))
  const top = $derived(readAxes({ xFrom: clean.xFrom, xTo: clean.xTo, xStep: clean.xStep, yFrom: clean.yFrom, yTo: clean.yTo, yStep: clean.yStep }))
  const low = $derived(readAxes({ xFrom: clean.xFrom, xTo: clean.xTo, xStep: clean.xStep, yFrom: clean.y2From, yTo: clean.y2To, yStep: clean.y2Step }))
  const stacked = $derived(viewsOf(clean).length > 1)
  let svg = $state<SVGSVGElement>()

  // Changing the population or the graphs refits the axes, unless the
  // teacher has turned that off to keep axes they set by hand.
  let fitting = $state(true)
  const now = () => populationSettings.tidy($state.snapshot(s))
  function refit(force = false) {
    if (fitting || force) Object.assign(s, fitAxes(now()))
  }
  type GrowthKey = 'n0' | 'r' | 'k' | 'lag' | 'span'
  function change(key: GrowthKey, v: number) {
    s[key] = v
    if (key === 'span' && fitting && Number.isFinite(v) && v > 0) s.censusEvery = censusEveryFor(v)
    refit()
  }
  function chooseModel(model: Model) {
    s.model = model
    refit()
  }
  function chooseGraphs(graphs: Graphs) {
    s.graphs = graphs
    refit()
  }

  // Changing the organism or the unit of time rewrites the axis titles that
  // are still the ones this page wrote.
  function rename(organism: string, unit: Unit) {
    const was = titlesFor(s.organism, s.unit)
    const next = titlesFor(organism, unit)
    for (const key of Object.keys(was) as (keyof typeof was)[]) if (s[key] === was[key]) s[key] = next[key]
    s.organism = organism
    s.unit = unit
  }

  // The settings a setup makes from the teacher's current look, before the
  // axes are fitted.
  function made(setup: (typeof SETUPS)[number], current: PopulationSettings) {
    const next = settingsFor(setup, populationSettings.defaults, current)
    return populationSettings.tidy({ ...next, censusEvery: setup.settings.censusEvery ?? censusEveryFor(next.span) })
  }
  function chooseSetup(id: string) {
    const setup = SETUPS.find((x) => x.id === id)
    if (!setup) return
    const next = made(setup, now())
    Object.assign(s, populationSettings.tidy({ ...next, ...fitAxes(next) }))
  }
  // The setup picker shows the setup the graph still is: one whose settings
  // (any a setup sets) all match. Changing one of them leaves it blank again.
  const SETUP_KEYS = [...new Set(SETUPS.flatMap((x) => Object.keys(x.settings)))] as (keyof PopulationSettings)[]
  const setupId = $derived(
    SETUPS.find((x) => {
      const m = made(x, clean)
      return SETUP_KEYS.every((key) => m[key] === clean[key])
    })?.id ?? '',
  )

  const per = $derived(UNITS[clean.unit])
  const n = (v: number) => plain(Number(v.toPrecision(3)))
  const readout = $derived.by(() => {
    const lines: string[] = []
    const ip = g.inflection
    if (ip) lines.push(`Inflection point: N = K/2 = ${n(ip.n)} at t = ${n(ip.t)} ${clean.unit}, growing fastest, ${n(ip.rate)} ${clean.organism.trim() || 'individuals'} per ${per}`)
    const ph = g.phases
    if (ph) lines.push(`${ph.lagEnd === null ? 'No lag phase; s' : `Lag phase until t = ${n(ph.lagEnd)}; s`}tationary phase from t = ${n(ph.stationary)}`)
    if (clean.model === 'overshoot') {
      const rt = clean.r * clean.lag
      lines.push(`rτ = ${n(rt)}: ${rt < 0.37 ? 'too small to overshoot K' : rt < Math.PI / 2 ? 'overshoots K, the swings dying away' : 'swings around K that keep going'}`)
    }
    if (clean.model === 'exponential' || clean.model === 'both') lines.push(`Doubles every ${n(Math.LN2 / clean.r)} ${clean.unit}`)
    return lines
  })

  const graphsSummary = $derived(GRAPHS[clean.graphs].name)
  const curveSummary = $derived(clean.curve ? `${clean.color[0].toUpperCase()}${clean.color.slice(1)}` : 'Hidden, for students to draw')
  const censusSummary = $derived(
    clean.census
      ? [`Every ${plain(clean.censusEvery)} ${clean.unit}`, clean.noise ? `±${clean.noise}% noise` : 'on the curve', clean.table ? 'with a table' : ''].filter(Boolean).join(' · ')
      : 'None',
  )
  const markSummary = $derived(
    [
      hasK(clean.model) && clean.kLine ? 'Carrying capacity' : '',
      hasLogistic(clean.model) && clean.inflection ? 'inflection point' : '',
      hasLogistic(clean.model) && clean.phases ? 'phases' : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'Nothing',
  )
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : 'population-growth')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'population-growth',
  )
</script>

{#snippet numberField(id: string, name: string, unit: string, key: GrowthKey, min: number, problem?: string | null, step = 'any')}
  <label class="number-field" for={id}>
    <span>{name}{#if unit}&nbsp;<span class="unit">({unit})</span>{/if}</span>
    <input {id} type="number" {step} {min} aria-invalid={!!problem} bind:value={() => s[key], (v) => change(key, v)} />
  </label>
{/snippet}

{#snippet swatches(name: string, value: Color, set: (c: Color) => void)}
  <div class="swatches" role="radiogroup" aria-label={name}>
    {#each Object.entries(COLORS) as [color, hex]}
      <button
        type="button" role="radio" aria-checked={value === color} aria-label={color} data-tip={color}
        class="swatch" class:on={value === color} style:--swatch={hex} onclick={() => set(color as Color)}
      ></button>
    {/each}
  </div>
{/snippet}

<GeneratorPage name="Population Growth" {filename} {gen} {svg} settingsWidth={30} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="population">
      <div class="head-row">
        <h2 class="card-head">Population</h2>
        <HelpTip id="population-tip" label="How the curves are worked out">
          Exponential growth is dN/dt = rN; logistic growth is dN/dt = rN(K − N)/K, leveling off at the carrying
          capacity K. Overshoot is logistic growth that feels crowding a lag τ late, so it swings around K. Boom and
          crash is a population using up food that doesn’t grow back.
        </HelpTip>
      </div>
      <label class="field">
        <span>Classic setups</span>
        <select value={setupId} onchange={(e) => chooseSetup(e.currentTarget.value)}>
          <option value="" disabled>Choose one…</option>
          {#each SETUPS as setup}<option value={setup.id}>{setup.name}</option>{/each}
        </select>
      </label>
      <label class="field">
        <span>Growth</span>
        <select value={s.model} onchange={(e) => chooseModel(e.currentTarget.value as Model)}>
          {#each MODELS as m}<option value={m}>{MODEL_NAMES[m]}</option>{/each}
        </select>
      </label>
      <div class="fields">
        {@render numberField('n0', 'Starting size, N₀', '', 'n0', 0, g.problems.n0)}
        {@render numberField('r', 'Growth rate, r', `per ${per}`, 'r', 0, g.problems.r, '0.1')}
        {#if clean.model === 'crash'}
          {@render numberField('k', 'Peak size', '', 'k', 0, g.problems.k)}
        {:else if hasK(clean.model)}
          {@render numberField('k', 'Carrying capacity, K', '', 'k', 0, g.problems.k)}
        {/if}
        {#if clean.model === 'overshoot'}
          {@render numberField('lag', 'Lag, τ', clean.unit, 'lag', 0)}
        {/if}
        {@render numberField('span', 'Time span', clean.unit, 'span', 0)}
        <label class="number-field" for="unit">
          <span>Time in</span>
          <select id="unit" value={s.unit} onchange={(e) => rename(s.organism, e.currentTarget.value as Unit)}>
            {#each Object.keys(UNITS) as u}<option value={u}>{u[0].toUpperCase()}{u.slice(1)}</option>{/each}
          </select>
        </label>
      </div>
      <label class="field">
        <span>Organism <span class="hint">plural, for the axis titles</span></span>
        <input type="text" placeholder="deer, yeast cells, bacteria" value={s.organism} oninput={(e) => rename(e.currentTarget.value, s.unit)} />
      </label>
      {#each ['n0', 'r', 'k'] as key}
        {#if g.problems[key]}<p class="help problem">{g.problems[key]}</p>{/if}
      {/each}
      {#if readout.length}
        <ul class="readout">{#each readout as line}<li>{line}</li>{/each}</ul>
      {/if}
      <div class="fit-row">
        <label class="check"><input type="checkbox" bind:checked={fitting} /> <span>Fit the axes as these change</span></label>
        <button type="button" class="btn-ghost small" onclick={() => refit(true)}>Fit now</button>
      </div>
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Graphs" icon={ChartLine} summary={graphsSummary} open>
      <label class="field setting">
        <span>Show</span>
        <select value={s.graphs} onchange={(e) => chooseGraphs(e.currentTarget.value as Graphs)}>
          <optgroup label="Over time">
            {#each GRAPH_IDS.filter((id) => GRAPHS[id].against === 'time') as id}<option value={id}>{GRAPHS[id].name}</option>{/each}
          </optgroup>
          <optgroup label="Against population size">
            {#each GRAPH_IDS.filter((id) => GRAPHS[id].against === 'size') as id}<option value={id}>{GRAPHS[id].name}</option>{/each}
          </optgroup>
        </select>
      </label>
      <p class="help">
        The growth rate dN/dt is individuals added per {per}; the per capita growth rate, (dN/dt)/N, is per individual.
        {#if stacked}The two graphs share the x-axis.{/if}
      </p>
    </Section>

    <Section title="Curve" icon={Spline} summary={curveSummary}>
      <label class="check"><input type="checkbox" bind:checked={s.curve} /> <span>Draw the curve</span></label>
      {#if s.curve}
        <div class="field setting">
          <span>{clean.model === 'both' ? 'Logistic curve color' : 'Color'}</span>
          {@render swatches('Curve color', s.color, (c) => (s.color = c))}
        </div>
        {#if clean.model === 'both'}
          <div class="field setting">
            <span>Exponential curve color <span class="hint">dashed</span></span>
            {@render swatches('Exponential curve color', s.expColor, (c) => (s.expColor = c))}
          </div>
          <div class="field setting">
            <span>Logistic curve’s label</span>
            <LabelField name="Logistic curve label" placeholder="Logistic growth" bind:mode={s.logLabelMode} bind:text={s.logLabel} />
          </div>
          <div class="field setting">
            <span>Exponential curve’s label</span>
            <LabelField name="Exponential curve label" placeholder="Exponential growth" bind:mode={s.expLabelMode} bind:text={s.expLabel} />
          </div>
        {/if}
      {/if}
    </Section>

    <Section title="Census data" icon={ChartScatter} summary={censusSummary}>
      {#if againstOf(clean) === 'size'}
        <p class="help">Census points go on a graph over time.</p>
      {:else}
        <label class="check"><input type="checkbox" bind:checked={s.census} /> <span>Show census points <span class="hint">on the population graph</span></span></label>
        {#if s.census}
          <div class="fields setting">
            <label class="number-field" for="census-every">
              <span>Count every <span class="unit">({clean.unit})</span></span>
              <input id="census-every" type="number" step="any" min="0" bind:value={s.censusEvery} />
            </label>
            <label class="number-field" for="noise">
              <span>Scatter</span>
              <select id="noise" bind:value={s.noise}>
                {#each NOISES as v}<option value={v}>{v ? `About ${v}%` : 'None, on the curve'}</option>{/each}
              </select>
            </label>
          </div>
          {#if s.noise}
            <button type="button" class="btn-ghost small setting" onclick={() => (s.seed = 1 + Math.floor(Math.random() * 999998))}>
              <Dices size={16} aria-hidden="true" /> New counts
            </button>
          {/if}
          <label class="check"><input type="checkbox" bind:checked={s.table} /> <span>List them in a table beside the graph</span></label>
        {/if}
      {/if}
    </Section>

    <!-- Only growth with a carrying capacity has anything to mark, so the
         section is left out for exponential growth and boom and crash. -->
    {#if hasK(clean.model)}
      <Section title="Marked on the graph" icon={MapPin} summary={markSummary}>
        <label class="check"><input type="checkbox" bind:checked={s.kLine} /> <span>Carrying capacity, K <span class="hint">dashed line</span></span></label>
        {#if s.kLine}
          <div class="field setting">
            <LabelField name="Carrying capacity label" placeholder="Carrying capacity (K)" bind:mode={s.kLabelMode} bind:text={s.kLabel} />
          </div>
        {/if}
        {#if hasLogistic(clean.model)}
          <label class="check"><input type="checkbox" bind:checked={s.inflection} /> <span>Inflection point <span class="hint">where growth is fastest</span></span></label>
          {#if s.inflection}
            <div class="field setting">
              <span>On the population graph</span>
              <LabelField name="Inflection point label" placeholder="Inflection point (N = K/2)" bind:mode={s.inflLabelMode} bind:text={s.inflLabel} />
            </div>
            <div class="field setting">
              <span>On the growth rate graph</span>
              <LabelField name="Fastest growth label" placeholder="Fastest growth (N = K/2)" bind:mode={s.peakLabelMode} bind:text={s.peakLabel} />
            </div>
          {/if}
          {#if againstOf(clean) === 'time'}
            <label class="check"><input type="checkbox" bind:checked={s.phases} /> <span>Growth phases <span class="hint">above the graph</span></span></label>
            {#if s.phases}
              <div class="field setting">
                <LabelField name="Lag phase label" placeholder="Lag phase" bind:mode={s.lagLabelMode} bind:text={s.lagLabel} />
              </div>
              <div class="field setting">
                <LabelField name="Exponential phase label" placeholder="Exponential phase" bind:mode={s.expPhaseLabelMode} bind:text={s.expPhaseLabel} />
              </div>
              <div class="field setting">
                <LabelField name="Stationary phase label" placeholder="Stationary phase" bind:mode={s.statLabelMode} bind:text={s.statLabel} />
              </div>
            {/if}
          {/if}
        {/if}
      </Section>
    {/if}

    <TitleSettings {s} />
    <AxisSettings
      axis="x" read={top.x} problems={g.problems}
      bind:from={s.xFrom} bind:to={s.xTo} bind:step={s.xStep} bind:every={s.xEvery}
      bind:labelMode={s.xLabelMode} bind:label={s.xLabel} bind:startCap={s.xStartCap} bind:endCap={s.xEndCap}
    />
    <AxisSettings
      axis="y" read={top.y} problems={g.problems}
      bind:from={s.yFrom} bind:to={s.yTo} bind:step={s.yStep} bind:every={s.yEvery}
      bind:labelMode={s.yLabelMode} bind:label={s.yLabel} bind:startCap={s.yStartCap} bind:endCap={s.yEndCap}
    />
    {#if stacked}
      <LowerAxisSettings read={low.y} problems={g.problems} bind:from={s.y2From} bind:to={s.y2To} bind:step={s.y2Step} bind:every={s.y2Every} />
    {/if}
    <GridlineSettings bind:minor={s.minor} />
  {/snippet}

  {#snippet figure()}
    <PopulationFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .population { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; }
  .hint { font-weight: 400; color: var(--muted); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .number-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .number-field input, .number-field select { width: 100%; min-width: 0; }
  .unit { font-weight: 400; color: var(--muted); }
  .help { margin: 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .readout { margin: 0; padding: 0.55rem 0.75rem; list-style: none; border-radius: 10px; background: var(--blue-soft); font-size: 0.85rem; font-weight: 600; }
  .readout li + li { margin-top: 0.2rem; }
  .fit-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .fit-row .check { margin: 0; }
  .fit-row .btn-ghost { flex: none; white-space: nowrap; }
  .setting { margin-bottom: 0.75rem; }
  .setting:last-child { margin-bottom: 0; }
  .check { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.6rem; cursor: pointer; }
  .check:last-child { margin-bottom: 0; }
  .check input { width: 1.05rem; height: 1.05rem; accent-color: var(--blue); flex: none; }
  .small { padding: 0.4rem 0.75rem; font-size: 0.86rem; border-radius: 10px; }
  .swatches { display: flex; gap: 0.5rem; }
  .swatch {
    width: 2rem; height: 2rem; border-radius: 999px; border: 3px solid #fff; background: var(--swatch);
    box-shadow: 0 0 0 1.5px var(--border); cursor: pointer;
  }
  .swatch.on { box-shadow: 0 0 0 2.5px var(--ink); }
</style>
