<script lang="ts">
  // Predator–Prey Cycles: pick a predator and its prey (or name your own),
  // set where both populations start, what they average and how long a cycle
  // takes (or the model's four rates), and get both populations rising and
  // falling out of step on a graph, from the Lotka–Volterra model. The grid
  // and axes are $shared/graph's, the same as Chemistry's titration curve.
  import { ChartLine, Dices, MapPin, MoveUp } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import AxisSettings from '$shared/graph/AxisSettings.svelte'
  import GridlineSettings from '$shared/graph/GridlineSettings.svelte'
  import TitleSettings from '$shared/graph/TitleSettings.svelte'
  import { readAxes } from '$shared/graph/axes'
  import { buildPredatorPrey, rangesOf, timeText, type Ranges } from './figure'
  import { balanceOf, periodOf } from './model'
  import { PAIRS, UNITS, pairNamed, type Units } from './pairs'
  import PredatorPreyFigure from './PredatorPreyFigure.svelte'
  import {
    MARK_LABELS, MARK_LABEL_NAMES, SHOW_NAMES, autoTitles, pairSettings, predatorPreySettings, ratesOf,
  } from './settings'

  const gen = generatorState(predatorPreySettings, 'predator-prey')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const g = $derived(buildPredatorPrey(clean))
  const phase = $derived(clean.view === 'phase')
  const two = $derived(!phase && clean.scale === 'two')
  let svg = $state<SVGSVGElement>()

  const sig = (v: number) => Number(v.toPrecision(3))
  const count = (v: number) => (v >= 100 ? String(Math.round(v)) : String(sig(v)))

  /** A change that keeps the titles this page wrote in step with it, leaving ones the teacher typed. */
  function retitle(change: () => void) {
    const before = autoTitles(s)
    change()
    const after = autoTitles(s)
    for (const key of Object.keys(before) as (keyof typeof before)[]) if (s[key].trim() === before[key]) s[key] = after[key]
  }

  const pair = $derived(pairNamed(clean.preyName, clean.predatorName))
  /** A pair sets everything it comes with; your own pair just empties the names. */
  function choosePair(id: string) {
    const p = PAIRS.find((p) => p.id === id)
    if (p) retitle(() => Object.assign(s, pairSettings(p), { xFit: true, yFit: true }))
    else retitle(() => Object.assign(s, { preyName: '', predatorName: '' }))
  }

  // Populations work the rates out; switching keeps the same cycle either way.
  function chooseSource(source: 'simple' | 'rates') {
    if (source === clean.source) return
    if (source === 'rates') {
      const r = ratesOf(clean)
      Object.assign(s, { alpha: sig(r.alpha), beta: sig(r.beta), gamma: sig(r.gamma), delta: sig(r.delta) })
    } else {
      // Rates still as they were copied keep the populations they came from.
      const r = ratesOf(clean)
      const from = ratesOf({ ...clean, source: 'simple' })
      if ((['alpha', 'beta', 'gamma', 'delta'] as const).every((k) => sig(from[k]) === r[k])) {
        s.source = source
        return
      }
      const b = balanceOf(r)
      Object.assign(s, { preyAverage: sig(b.prey), predatorAverage: sig(b.predators), period: sig(periodOf(r, { prey: clean.prey, predators: clean.predators })) })
    }
    s.source = source
  }

  // While an axis fits the populations, its boxes show the fitted range;
  // typing in one takes over for that axis. The right y-axis goes with the left.
  const shown = $derived<Ranges>(rangesOf(clean, g.fitted))
  const shownAxes = $derived(readAxes(shown))
  function typeRange(key: keyof Ranges, v: string) {
    const f = g.fitted
    if (key.startsWith('x') && s.xFit) Object.assign(s, { xFrom: f.xFrom, xTo: f.xTo, xStep: f.xStep, xFit: false })
    if (key.startsWith('y') && s.yFit) Object.assign(s, { yFrom: f.yFrom, yTo: f.yTo, yStep: f.yStep, y2From: f.y2From, y2Step: f.y2Step, yFit: false })
    s[key] = v
  }

  // The populations drawn, one box each; the phase plane's loop needs both.
  const preyDrawn = $derived(s.show === 'both' || s.show === 'prey')
  const predatorsDrawn = $derived(s.show === 'both' || s.show === 'predators')
  const draw = (prey: boolean, predators: boolean) =>
    (s.show = prey && predators ? 'both' : prey ? 'prey' : predators ? 'predators' : 'neither')
  const capital = (name: string, fallback: string) => (name.trim() || fallback).replace(/^./, (c) => c.toUpperCase())

  const r = $derived(g.readout)
  const unitName = (u: Units) => u[0].toUpperCase() + u.slice(1)
  const graphSummary = $derived(
    [phase ? 'Phase plane' : 'Over time', SHOW_NAMES[clean.show].toLowerCase(), !phase && two ? 'two y-axes' : '', clean.color ? 'color' : 'black and white']
      .filter(Boolean)
      .join(' · '),
  )
  const dataSummary = $derived(
    clean.data === 'curves'
      ? 'Smooth curves'
      : `Census every ${timeText(clean.every, clean.units)}${clean.noise ? `, ±${clean.noise}%` : ''}`,
  )
  const marked = $derived(
    [clean.peaks ? 'peaks' : '', clean.lag ? 'lag' : '', clean.cycle ? 'period' : ''].filter(Boolean),
  )
  const markSummary = $derived(marked.length ? `${marked.join(', ')}`.replace(/^./, (c) => c.toUpperCase()) : 'Nothing marked')
  const rightSummary = $derived(
    `${clean.yFit ? 'Fitted' : 'Typed'} · from ${shown.y2From} by ${shown.y2Step}${clean.y2TitleMode === 'text' && clean.y2Title.trim() ? ` · “${clean.y2Title.trim()}”` : ''}`,
  )
  const filename = $derived(
    (clean.titleMode === 'text' && clean.title.trim() ? clean.title.trim() : `${clean.preyName}-${clean.predatorName}`)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'predator-prey',
  )
</script>

{#snippet numberField(id: string, name: string, unit: string, key: 'prey' | 'predators' | 'preyAverage' | 'predatorAverage' | 'period' | 'alpha' | 'beta' | 'gamma' | 'delta' | 'span', min: number)}
  <label class="number-field" for={id}>
    <span>{name}{#if unit}&nbsp;<span class="unit">({unit})</span>{/if}</span>
    <input {id} type="number" step="any" {min} bind:value={s[key]} />
  </label>
{/snippet}

{#snippet check(label: string, hint: string, value: boolean, set: (v: boolean) => void)}
  <label class="check">
    <input type="checkbox" checked={value} onchange={(e) => set(e.currentTarget.checked)} />
    <span><strong>{label}</strong>{#if hint}<small>{hint}</small>{/if}</span>
  </label>
{/snippet}

<GeneratorPage name="Predator–Prey Cycles" {filename} {gen} {svg} settingsWidth={26} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="cycle">
      <div class="head-row">
        <h2 class="card-head">Predator and prey</h2>
        <HelpTip id="cycle-tip" label="How the cycle is worked out">
          From the Lotka–Volterra model: prey grow and are eaten, predators grow on the prey they eat and die off. The
          populations swing around their averages, the predators’ peaks a little after the prey’s.
        </HelpTip>
      </div>
      <label class="field">
        <span>Pair</span>
        <select value={pair?.id ?? 'own'} onchange={(e) => choosePair(e.currentTarget.value)}>
          {#each PAIRS as p}<option value={p.id}>{p.name}</option>{/each}
          <option value="own">Your own pair</option>
        </select>
      </label>
      <div class="fields">
        <label class="number-field">
          <span>Prey</span>
          <input type="text" maxlength="30" value={s.preyName} oninput={(e) => { const v = e.currentTarget.value; retitle(() => (s.preyName = v)) }} />
        </label>
        <label class="number-field">
          <span>Predators</span>
          <input type="text" maxlength="30" value={s.predatorName} oninput={(e) => { const v = e.currentTarget.value; retitle(() => (s.predatorName = v)) }} />
        </label>
      </div>
      {#if !pair}<p class="help">Type your own names, or pick a pair to start from.</p>{/if}

      <div class="segmented" role="radiogroup" aria-label="Work the cycle out from">
        <button type="button" role="radio" aria-checked={s.source === 'simple'} class:on={s.source === 'simple'} onclick={() => chooseSource('simple')}>Populations</button>
        <button type="button" role="radio" aria-checked={s.source === 'rates'} class:on={s.source === 'rates'} onclick={() => chooseSource('rates')}>Model rates (α β γ δ)</button>
      </div>
      <div class="fields">
        {@render numberField('prey-start', `${clean.preyName.trim() || 'Prey'} at the start`, '', 'prey', 0.001)}
        {@render numberField('predators-start', `${clean.predatorName.trim() || 'Predators'} at the start`, '', 'predators', 0.001)}
        {#if s.source === 'simple'}
          {@render numberField('prey-average', `Average ${clean.preyName.trim().toLowerCase() || 'prey'}`, '', 'preyAverage', 0.001)}
          {@render numberField('predator-average', `Average ${clean.predatorName.trim().toLowerCase() || 'predators'}`, '', 'predatorAverage', 0.001)}
        {/if}
      </div>
      {#if s.source === 'simple'}
        <div class="fields">
          {@render numberField('period', 'Cycle length', clean.units, 'period', 0.001)}
        </div>
      {:else}
        <div class="fields">
          {@render numberField('alpha', 'α, prey growth', '', 'alpha', 0)}
          {@render numberField('beta', 'β, prey eaten', '', 'beta', 0)}
          {@render numberField('gamma', 'γ, predator deaths', '', 'gamma', 0)}
          {@render numberField('delta', 'δ, predator growth', '', 'delta', 0)}
        </div>
        <p class="help">
          dx/dt = αx − βxy for the prey and dy/dt = δxy − γy for the predators, per {timeText(1, clean.units).replace(/^1 /, '')}.
        </p>
      {/if}
      <div class="fields">
        {@render numberField('span', 'Time shown', '', 'span', 0.001)}
        <label class="number-field">
          <span>Units</span>
          <select value={s.units} onchange={(e) => { const v = e.currentTarget.value as Units; retitle(() => (s.units = v)) }}>
            {#each UNITS as u}<option value={u}>{unitName(u)}</option>{/each}
          </select>
        </label>
      </div>
      <ul class="readout">
        {#if r.still}
          <li>Starting at the averages, neither population changes. Start one of them higher or lower.</li>
        {:else}
          <li>A cycle every {timeText(r.period, clean.units)}; the predators peak {timeText(r.lag, clean.units)} after the prey</li>
          <li>{clean.preyName.trim() || 'Prey'}: {count(r.prey.low)} to {count(r.prey.high)}, averaging {count(r.balance.prey)}</li>
          <li>{clean.predatorName.trim() || 'Predators'}: {count(r.predators.low)} to {count(r.predators.high)}, averaging {count(r.balance.predators)}</li>
        {/if}
        {#if s.source === 'simple'}
          <li class="rates">α = {sig(r.rates.alpha)}, β = {sig(r.rates.beta)}, γ = {sig(r.rates.gamma)}, δ = {sig(r.rates.delta)}</li>
        {/if}
      </ul>
      {#if r.cycles > 30}<p class="help problem">That’s {Math.round(r.cycles)} cycles, too many to read. Show less time, or make the cycle longer.</p>{/if}
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Graph" icon={ChartLine} summary={graphSummary}>
      <div class="segmented setting" role="radiogroup" aria-label="Graph">
        <button type="button" role="radio" aria-checked={s.view === 'time'} class:on={s.view === 'time'} onclick={() => (s.view = 'time')}>Over time</button>
        <button type="button" role="radio" aria-checked={s.view === 'phase'} class:on={s.view === 'phase'} onclick={() => (s.view = 'phase')}>Phase plane</button>
      </div>
      {#if phase}
        <p class="help setting">Predators against prey: one cycle is one trip round the loop, the way the arrows go.</p>
      {/if}
      <div class="field setting">
        <span>Populations drawn <span class="hint">leave some off for students to sketch</span></span>
        {#if phase}
          {@render check('The loop', '', s.show !== 'neither', (v) => draw(v, v))}
        {:else}
          {@render check(capital(clean.preyName, 'Prey'), '', preyDrawn, (v) => draw(v, predatorsDrawn))}
          {@render check(capital(clean.predatorName, 'Predators'), '', predatorsDrawn, (v) => draw(preyDrawn, v))}
        {/if}
      </div>
      {#if !phase}
        <div class="field setting">
          <span>y-axis</span>
          <div class="segmented" role="radiogroup" aria-label="y-axis">
            <button type="button" role="radio" aria-checked={s.scale === 'shared'} class:on={s.scale === 'shared'} onclick={() => retitle(() => (s.scale = 'shared'))}>One for both</button>
            <button type="button" role="radio" aria-checked={s.scale === 'two'} class:on={s.scale === 'two'} onclick={() => retitle(() => (s.scale = 'two'))}>Predators on the right</button>
          </div>
        </div>
      {/if}
      <div class="segmented" role="radiogroup" aria-label="Lines">
        <button type="button" role="radio" aria-checked={s.color} class:on={s.color} onclick={() => (s.color = true)}>Color</button>
        <button type="button" role="radio" aria-checked={!s.color} class:on={!s.color} onclick={() => (s.color = false)}>Black and white</button>
      </div>
    </Section>

    <Section title="Data" icon={Dices} summary={dataSummary}>
      <div class="segmented setting" role="radiogroup" aria-label="Data">
        <button type="button" role="radio" aria-checked={s.data === 'curves'} class:on={s.data === 'curves'} onclick={() => (s.data = 'curves')}>Smooth curves</button>
        <button type="button" role="radio" aria-checked={s.data === 'census'} class:on={s.data === 'census'} onclick={() => (s.data = 'census')}>Census counts</button>
      </div>
      {#if s.data === 'census'}
        <div class="fields setting">
          <label class="number-field">
            <span>Counted every <span class="unit">({clean.units})</span></span>
            <input type="number" step="any" min="0.001" bind:value={s.every} />
          </label>
          <label class="number-field">
            <span>Counts off by about <span class="unit">(%)</span></span>
            <input type="number" step="1" min="0" max="50" bind:value={s.noise} />
          </label>
        </div>
        {#if g.problems.every}<p class="help problem setting">{g.problems.every}</p>{/if}
        {#if clean.noise}
          <button type="button" class="btn-ghost small setting" onclick={() => (s.seed = Math.floor(Math.random() * 999_998) + 1)}>
            <Dices size={16} aria-hidden="true" /> New counts
          </button>
        {/if}
        {@render check('Join the counts', 'with lines, solid for prey and dashed for predators', s.connect, (v) => (s.connect = v))}
      {/if}
    </Section>

    {#if !phase}
      <Section title="Marked" icon={MapPin} summary={markSummary}>
        {@render check('Peaks', 'a dot on each peak, with a dotted line down to the time axis', s.peaks, (v) => (s.peaks = v))}
        {@render check('Lag', 'from a prey peak to the predator peak after it', s.lag, (v) => (s.lag = v))}
        {@render check('Period', 'from one peak to the next', s.cycle, (v) => (s.cycle = v))}
        {#if s.lag || s.cycle}
          <label class="field marks-label">
            <span>Lag and period labels</span>
            <select bind:value={s.markLabels}>
              {#each MARK_LABELS as v}<option value={v}>{MARK_LABEL_NAMES[v]}</option>{/each}
            </select>
          </label>
        {/if}
      </Section>
    {/if}

    {#if phase}
      <TitleSettings
        bind:title={s.title} bind:titleMode={s.titleMode} bind:xTitle={s.pxTitle} bind:xTitleMode={s.pxTitleMode}
        bind:yTitle={s.pyTitle} bind:yTitleMode={s.pyTitleMode}
        placeholders={{ title: 'Hare and lynx populations', xTitle: 'Hares (thousands)', yTitle: 'Lynx (thousands)' }}
      />
    {:else}
      <TitleSettings
        bind:title={s.title} bind:titleMode={s.titleMode} bind:xTitle={s.xTitle} bind:xTitleMode={s.xTitleMode}
        bind:yTitle={s.yTitle} bind:yTitleMode={s.yTitleMode}
        placeholders={{ title: 'Hare and lynx populations', xTitle: 'Time (years)', yTitle: 'Number of animals (thousands)' }}
      />
      <AxisSettings
        axis="x" read={shownAxes.x} problems={g.problems}
        bind:from={() => shown.xFrom, (v) => typeRange('xFrom', v)}
        bind:to={() => shown.xTo, (v) => typeRange('xTo', v)}
        bind:step={() => shown.xStep, (v) => typeRange('xStep', v)}
        bind:every={s.xEvery} bind:labelMode={s.xLabelMode} bind:label={s.xLabel} bind:startCap={s.xStartCap} bind:endCap={s.xEndCap}
        extras={[clean.xFit ? 'fitted' : '']}
      >
        {@render check('Fit to the time shown', '', s.xFit, (v) => (s.xFit = v))}
      </AxisSettings>
      <AxisSettings
        axis="y" read={shownAxes.y} problems={g.problems}
        bind:from={() => shown.yFrom, (v) => typeRange('yFrom', v)}
        bind:to={() => shown.yTo, (v) => typeRange('yTo', v)}
        bind:step={() => shown.yStep, (v) => typeRange('yStep', v)}
        bind:every={s.yEvery} bind:labelMode={s.yLabelMode} bind:label={s.yLabel} bind:startCap={s.yStartCap} bind:endCap={s.yEndCap}
        extras={[clean.yFit ? 'fitted' : '']}
      >
        {@render check('Fit to the populations', two ? 'room for both lines up the side, and the right y-axis with it' : 'room for both lines up the side', s.yFit, (v) => (s.yFit = v))}
      </AxisSettings>
      {#if two}
        <Section title="Right y-axis" icon={MoveUp} summary={rightSummary}>
          <p class="help setting">For the predators, with as many blocks as the left; numbered like it.</p>
          <div class="fields setting">
            <label class="number-field">
              <span>From</span>
              <input type="text" inputmode="decimal" aria-invalid={!!g.problems.y2From} value={shown.y2From} oninput={(e) => typeRange('y2From', e.currentTarget.value)} />
            </label>
            <label class="number-field">
              <span>Count by</span>
              <input type="text" inputmode="decimal" aria-invalid={!!g.problems.y2Step} value={shown.y2Step} oninput={(e) => typeRange('y2Step', e.currentTarget.value)} />
            </label>
          </div>
          {#each ['y2From', 'y2Step'] as key}
            {#if g.problems[key]}<p class="help problem setting">{g.problems[key]}</p>{/if}
          {/each}
          <div class="field">
            <span>Its title</span>
            <LabelField name="Right y-axis title" placeholder="Lynx (thousands)" bind:mode={s.y2TitleMode} bind:text={s.y2Title} />
          </div>
        </Section>
      {/if}
    {/if}
    <GridlineSettings bind:minor={s.minor} />
  {/snippet}

  {#snippet figure()}
    <PredatorPreyFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
  .cycle { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; }
  .field .hint { font-weight: 400; color: var(--muted); }
  .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; align-items: end; }
  .number-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .number-field input, .number-field select { width: 100%; min-width: 0; }
  .unit { font-weight: 400; color: var(--muted); }
  .help { margin: 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .readout { margin: 0; padding: 0.55rem 0.75rem; list-style: none; border-radius: 10px; background: var(--blue-soft); font-size: 0.85rem; font-weight: 600; }
  .readout li + li { margin-top: 0.2rem; }
  .readout .rates { font-weight: 400; color: var(--muted); }
  .setting { margin-bottom: 0.75rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-bottom: 0.75rem; cursor: pointer; font-size: 0.9rem; }
  .check:last-child { margin-bottom: 0; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; flex: none; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check small { color: var(--muted); font-size: 0.82rem; }
  .marks-label { margin-top: 0.25rem; }
  .small { padding: 0.45rem 0.8rem; font-size: 0.88rem; }
</style>
