<script lang="ts">
  // The Box Plot Generator: presets, the data sets and the figure's settings
  // on the left, the figure card on the right. Settings are mirrored into the
  // page address so a bookmark or shared link brings back exactly this box
  // plot, and the server renders that same figure on first load.
  import { BoxSelect, Heading, Plus, Ruler, X } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import CapPicker from '$shared/graph/CapPicker.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import Section from '$shared/Section.svelte'
  import { niceText } from '$shared/graph/numbering'
  import BoxPlot from './BoxPlot.svelte'
  import { CAPS, SUMMARY_KEYS, cleanSettings, fmt, readPlot, settingsFromParams, settingsToQuery, type DataRow, type LabelMode, type RawSettings, type Settings } from './settings.js'

  // There's always a row to type the next data set in.
  const blankRow = (): DataRow => ({ text: '', name: '', asData: false })
  const withRow = (s: Settings): Settings => (s.rows.length ? s : { ...s, rows: [blankRow()] })

  const gen = generatorState(
    {
      tidy: (s) => withRow(cleanSettings(s as RawSettings)),
      fromParams: (params) => withRow(settingsFromParams(params)),
      toQuery: settingsToQuery,
      keyOf: settingsToQuery,
    },
    'box-plot',
    { history: 'mathfigures.box-plot.history', presets: 'mathfigures.box-plot.presets' },
  )
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const plot = $derived(readPlot(clean))

  // A new row, unless the last one is still empty, which gets the focus instead.
  function addRow() {
    const last = s.rows.at(-1)
    if (!last || last.text.trim() !== '') s.rows.push(blankRow())
    const i = s.rows.length - 1
    requestAnimationFrame(() => document.getElementById(`data-${i}`)?.focus())
  }
  function removeRow(i: number) {
    s.rows.splice(i, 1)
    if (!s.rows.length) s.rows.push(blankRow())
  }

  const PART_NAMES = { min: 'Minimum', q1: 'Q1', median: 'Median', q3: 'Q3', max: 'Maximum' } as const
  const LABEL_OPTIONS: [LabelMode, string][] = [['none', 'None'], ['measure', 'Value'], ['text', 'Text']]
  const EVERY_OPTIONS: [number, string][] = [
    [1, 'Every tick'],
    [2, 'Every 2nd tick'],
    [4, 'Every 4th tick'],
    [5, 'Every 5th tick'],
    [10, 'Every 10th tick'],
    [0, 'No numbers'],
  ]
  const RANGE_FIELDS = [
    ['from', 'From'],
    ['to', 'To'],
    ['step', 'Count by'],
  ] as const
  const ENDS = [
    ['startCap', 'Left end', 'left'],
    ['endCap', 'Right end', 'right'],
  ] as const
  const TITLES = [
    { key: 'title', name: 'Chart title', placeholder: 'Test scores' },
    { key: 'axisTitle', name: 'Axis title', placeholder: 'Score (points)' },
  ] as const

  /** A row's summary, for the teacher to check. It's never drawn unless labeled. */
  const summaryText = (i: number) => {
    const r = plot.rows[i]
    if (!r?.summary) return ''
    const { min, q1, median, q3, max } = r.summary
    const numbers = `Min ${fmt(min)} · Q1 ${fmt(q1)} · Median ${fmt(median)} · Q3 ${fmt(q3)} · Max ${fmt(max)}`
    if (r.isSummary) return numbers
    const outliers = r.outliers.length ? ` · outliers ${r.outliers.map(fmt).join(', ')}` : ''
    return `${numbers}${outliers} (${r.count} ${r.count === 1 ? 'value' : 'values'})`
  }

  const boxSummary = $derived.by(() => {
    const labeled = SUMMARY_KEYS.filter((k) => clean[`${k}Label`] !== 'none').map((k) => PART_NAMES[k])
    return [labeled.length ? `labels on ${labeled.join(', ')}` : 'no labels', clean.outliers ? 'outliers apart' : 'whiskers to min and max'].join(' · ')
  })
  const titlesSummary = $derived.by(() => {
    const parts = TITLES.map(({ key, name }) =>
      clean[`${key}Mode`] === 'blank' ? `${name}: blank line` : clean[`${key}Mode`] === 'text' && clean[key].trim() ? `“${clean[key].trim()}”` : '',
    )
    return parts.filter(Boolean).join(' · ') || 'None'
  })
  const lineSummary = $derived.by(() => {
    const { from, to, step } = plot.range
    const n = (v: number) => niceText(v, plot.numbering)
    const fitted = !clean.from.trim() && !clean.to.trim() && !clean.step.trim() && plot.rows.some((r) => r?.summary)
    return [
      `${n(from)} to ${n(to)}`,
      `by ${n(step)}`,
      fitted && 'fits the data',
      clean.every ? (clean.every === 1 ? 'numbered' : `numbered every ${clean.every}`) : 'unnumbered',
    ].filter(Boolean).join(' · ')
  })

  let svg = $state<SVGSVGElement>()
  const filename = 'box-plot'
</script>

<GeneratorPage name="Box Plot Generator" {filename} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
      <section class="data">
        <div class="head-row">
          <h2 class="card-head">Data</h2>
          <HelpTip id="data-tip" label="How to type data">
            Type or paste numbers separated by commas or spaces, like 12, 15, 15, 18, 22. Five numbers in order are read as a
            five-number summary: minimum, Q1, median, Q3 and maximum. Add a data set to compare box plots over the same line,
            and name each one. Leave it empty for a blank number line.
          </HelpTip>
        </div>
        {#each s.rows as row, i}
          <div class="row">
            <input type="text" class="name" aria-label="Name of data set {i + 1}" placeholder="Name" bind:value={row.name} />
            <input
              type="text"
              class="numbers"
              id="data-{i}"
              aria-label="Data set {i + 1}"
              placeholder={i === 0 ? '12, 15, 15, 18, 22, 30' : ''}
              inputmode="decimal"
              aria-invalid={!!plot.rows[i]?.problem}
              aria-describedby={plot.rows[i]?.problem ? `data-${i}-problem` : undefined}
              bind:value={row.text}
            />
            <button class="icon-btn" aria-label="Remove data set {i + 1}" data-tip="Remove" onclick={() => removeRow(i)}><X size={17} /></button>
          </div>
          {#if plot.rows[i]?.problem}
            <p id="data-{i}-problem" class="help problem">{plot.rows[i].problem}</p>
          {/if}
          {#if plot.rows[i]?.summary}
            <p class="help">
              {#if plot.rows[i].isSummary}<strong>Five-number summary:</strong>{/if}
              {summaryText(i)}
              {#if plot.rows[i].couldBeData}
                <button class="link" onclick={() => (row.asData = !row.asData)}>
                  {row.asData ? 'Read as a five-number summary' : 'Read as data instead'}
                </button>
              {/if}
            </p>
          {/if}
        {/each}
        <button class="add" onclick={addRow}><Plus size={16} aria-hidden="true" /> Add data set</button>
      </section>

  {/snippet}

  {#snippet settings()}
        <Section title="Box plot" icon={BoxSelect} summary={boxSummary}>
          <p class="hint intro">Labels write the five-number summary on the figure. Leave them off for students to find.</p>
          {#each SUMMARY_KEYS as key}
            <div class="part">
              <span class="part-name" id="{key}-label">{PART_NAMES[key]}</span>
              <div class="segmented" role="radiogroup" aria-labelledby="{key}-label">
                {#each LABEL_OPTIONS as [value, title]}
                  <button type="button" role="radio" aria-checked={clean[`${key}Label`] === value} class:on={clean[`${key}Label`] === value} onclick={() => (s[`${key}Label`] = value)}>{title}</button>
                {/each}
              </div>
              {#if clean[`${key}Label`] === 'text'}
                <MathInput id="{key}-text" aria-label="Label text for {PART_NAMES[key]}" placeholder="x" bind:value={s[`${key}Text`]} />
              {/if}
            </div>
          {/each}
          <label class="check">
            <input type="checkbox" bind:checked={s.outliers} />
            <span>Show outliers <span class="hint">values more than 1.5 box widths past the box, drawn as dots</span></span>
          </label>
          <label class="check">
            <input type="checkbox" bind:checked={s.whiskerCaps} />
            <span>Lines at the whisker ends <span class="hint">a short upright line at the minimum and maximum</span></span>
          </label>
        </Section>

        <Section title="Titles" icon={Heading} summary={titlesSummary}>
          {#each TITLES as { key, name, placeholder }}
            <div class="field">
              <span>{name}</span>
              <LabelField {name} {placeholder} bind:mode={s[`${key}Mode`]} bind:text={s[key]} />
            </div>
          {/each}
        </Section>

        <Section title="Number line" icon={Ruler} summary={lineSummary}>
          <div class="range-fields">
            {#each RANGE_FIELDS as [key, name]}
              <div class="range-field">
                <label for="range-{key}">{name}</label>
                <MathInput id="range-{key}" placeholder={niceText(plot.auto[key], 'decimal')} aria-invalid={!!plot.problems[key]} bind:value={s[key]} />
              </div>
            {/each}
          </div>
          {#each RANGE_FIELDS as [key]}
            {#if plot.problems[key]}<p class="help problem">{plot.problems[key]}</p>{/if}
          {/each}
          <p class="hint range-hint">Leave these empty to fit the data.</p>
          <label class="field">
            Numbers
            <select bind:value={s.every}>
              {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
            </select>
          </label>
          <div class="ends">
            {#each ENDS as [key, name, direction]}
              <div class="field">
                <span>{name}</span>
                <CapPicker options={CAPS} label="Number line {name.toLowerCase()}" {direction} bind:value={s[key]} />
              </div>
            {/each}
          </div>
        </Section>
  {/snippet}

  {#snippet figure()}
    <BoxPlot settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

  .data { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .row { display: flex; align-items: center; gap: 0.35rem; }
  .row .name { width: 6.5rem; flex: none; }
  .row .numbers { flex: 1; min-width: 0; }
  .data .help { margin: -0.2rem 0 0; }
  .link { border: 0; padding: 0; background: none; color: var(--blue-dark); font-weight: 700; font-size: inherit; text-decoration: underline; cursor: pointer; }
  .add {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem;
    border: 1.5px dashed var(--border); border-radius: 999px; background: none; color: var(--blue-dark); font-weight: 700; font-size: 0.85rem;
  }
  .add:hover { background: var(--blue-soft); }
  .help { margin: 0.45rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }
  .hint { font-weight: 400; color: var(--muted); font-size: 0.84rem; margin: 0; }
  .intro { margin-bottom: 0.75rem; }

  .part { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.75rem; }
  .part-name { font-weight: 600; font-size: 0.88rem; }
  .segmented button { flex: 1; }
  .check { display: flex; align-items: flex-start; gap: 0.5rem; font-weight: 600; font-size: 0.88rem; margin: 0; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0.08rem 0 0; accent-color: var(--blue); flex: none; }
  .check .hint { display: block; }

  .range-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; margin-bottom: 0.5rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-fields ~ .help { margin: -0.1rem 0 0.5rem; }
  .range-hint { margin-bottom: 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
  .ends { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; }
  .ends .field { margin-bottom: 0; }
</style>
