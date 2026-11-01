<script lang="ts">
  // The Number Line Generator: presets, the equations and the line's settings
  // on the left, the figure card on the right. Settings are mirrored into the page
  // address so a bookmark or shared link brings back exactly this number line,
  // and the server renders that same line on first load.
  import { Plus, Ruler, X } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import HelpTip from '$shared/HelpTip.svelte'
  import MathInput from '$lib/shared/MathInput.svelte'
  import RowStyle from '$lib/shared/RowStyle.svelte'
  import Section from '$shared/Section.svelte'
  import { niceText } from '$shared/graph/numbering'
  import NRange from './NRange.svelte'
  import NumberLine from './NumberLine.svelte'
  import { ROW_DEFAULTS, cleanSettings, readLine, settingsFromParams, settingsToQuery, type Row, type RawSettings, type Settings } from './settings.js'

  // There's always a row to type the next equation in.
  const blankRow = (): Row => ({ ...ROW_DEFAULTS })
  const withRow = (s: Settings): Settings => (s.equations.length ? s : { ...s, equations: [blankRow()] })

  // Undo history and presets keep the names they were first saved under.
  const gen = generatorState(
    {
      tidy: (s) => withRow(cleanSettings(s as RawSettings)),
      fromParams: (params) => withRow(settingsFromParams(params)),
      toQuery: settingsToQuery,
      keyOf: settingsToQuery,
    },
    'number-line',
    { history: 'mathfigures.number-line.history', presets: 'mathfigures.number-line.presets' },
  )
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const line = $derived(readLine(clean))

  // A new row, unless the last one is still empty, which gets the focus instead.
  function addRow() {
    if (s.equations.at(-1)?.text.trim() !== '') s.equations.push(blankRow())
    const i = s.equations.length - 1
    requestAnimationFrame(() => document.getElementById(`eq-${i}`)?.focus())
  }
  function removeRow(i: number) {
    s.equations.splice(i, 1)
    if (!s.equations.length) s.equations.push(blankRow())
  }

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

  const lineSummary = $derived.by(() => {
    const { from, to, step } = line.range
    const n = (v: number) => niceText(v, line.numbering)
    return [
      `${n(from)} to ${n(to)}`,
      `by ${n(step)}`,
      clean.every ? (clean.every === 1 ? 'numbered' : `numbered every ${clean.every}`) : 'unnumbered',
    ].join(' · ')
  })

  let svg = $state<SVGSVGElement>()
  const filename = 'number-line'
</script>

<GeneratorPage name="Number Line Generator" {filename} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <section class="equations">
      <div class="head-row">
        <h2 class="card-head">Equations</h2>
        <HelpTip id="equation-tip" label="How to type an equation">
          Try x &lt; −1 or x ≥ 3, x ≠ 2, all real numbers or no solution, points like 3 or −1, 2.5, π/2, labeled points like
          P(0.35), Q(−2), or a sequence like aₙ = 1/n. Type &lt;= for ≤, != for ≠, pi for π, / for a fraction and _ for a
          subscript. Leave it empty for a blank line.
        </HelpTip>
      </div>
      {#each s.equations as row, i}
        {@const read = line.rows[i]}
        <div class="row">
          <RowStyle
            {row} id="eq-{i}-style" label="equation {i + 1}" colorOnly
            isPoints={!!read?.points || !!read?.sequence} canLabel={!read?.sequence} labelExample="A(0.35)"
          />
          <MathInput
            kind="inequality"
            id="eq-{i}"
            aria-label="Equation {i + 1}"
            placeholder={i === 0 ? '−2 < x ≤ 5' : ''}
            aria-invalid={!!read?.problem}
            aria-describedby={read?.problem ? `eq-${i}-problem` : undefined}
            bind:value={row.text}
          />
          <button class="icon-btn" aria-label="Remove equation {i + 1}" data-tip="Remove" onclick={() => removeRow(i)}><X size={17} /></button>
        </div>
        {#if read?.sequence}
          <div class="row-extra"><NRange bind:first={row.first} bind:last={row.last} label="Equation {i + 1}" /></div>
        {/if}
        {#if read?.problem}<p id="eq-{i}-problem" class="help problem">{read.problem}</p>{/if}
        {#if read?.note}<p class="help">{read.note}</p>{/if}
      {/each}
      <button class="add" onclick={addRow}><Plus size={16} aria-hidden="true" /> Add equation</button>
    </section>
  {/snippet}

  {#snippet settings()}
    <Section title="Line" icon={Ruler} summary={lineSummary}>
      <div class="range-fields">
        {#each RANGE_FIELDS as [key, name]}
          <div class="range-field">
            <label for="range-{key}">{name}</label>
            <MathInput id="range-{key}" aria-invalid={!!line.problems[key]} bind:value={s[key]} />
          </div>
        {/each}
      </div>
      {#each RANGE_FIELDS as [key]}
        {#if line.problems[key]}<p class="help problem">{line.problems[key]}</p>{/if}
      {/each}
      <label class="field">
        Numbers
        <select bind:value={s.every}>
          {#each EVERY_OPTIONS as [v, label]}<option value={v}>{label}</option>{/each}
        </select>
      </label>
    </Section>
  {/snippet}

  {#snippet figure()}
    <NumberLine settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .card-head { font-size: 0.8rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }

  .equations { padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .head-row { display: flex; align-items: center; justify-content: space-between; }
  .row { display: flex; align-items: center; gap: 0.25rem; }
  .row > :global(.caret-field) { flex: 1; min-width: 0; margin-right: 0.2rem; }
  .equations .help { margin: -0.2rem 0 0; }
  /* Under a points or sequence row, lined up with its math field. */
  .row-extra { display: flex; margin: -0.15rem 2.2rem 0 calc(2.86rem + 0.25rem); }
  .add {
    align-self: flex-start; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.6rem;
    border: 1.5px dashed var(--border); border-radius: 999px; background: none; color: var(--blue-dark); font-weight: 700; font-size: 0.85rem;
  }
  .add:hover { background: var(--blue-soft); }
  .help { margin: 0.45rem 0 0; font-size: 0.84rem; color: var(--muted); }
  .help.problem { color: var(--red); font-weight: 600; }

  .range-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
  .range-field { display: flex; flex-direction: column; gap: 0.3rem; font-weight: 600; font-size: 0.88rem; min-width: 0; }
  .range-fields { margin-bottom: 0.75rem; }
  .range-fields ~ .help { margin: -0.3rem 0 0.75rem; }
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
</style>
