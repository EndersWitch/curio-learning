<script lang="ts">
  // Line Spectrum: stack strips of an element's lines, lines you type, or a
  // mixture of other strips, on one wavelength scale, as bright lines on
  // black, dark lines across a rainbow, or black lines on white to print.
  import { ArrowDown, ArrowUp, Blend, Palette, PencilLine, Plus, Rows3, Ruler, Tag, Trash2, Type } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import FigureTextSettings from '$lib/shared/FigureTextSettings.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { VISIBLE_FROM, VISIBLE_TO } from './color'
  import { ELEMENTS, type ElementSymbol } from './elements'
  import { answerLines, buildSpectrum } from './figure'
  import { AXES, LABELS, NUMBERS, STRENGTHS, STYLES, TICKS, spectrumSettings, type Labels, type Style } from './settings'
  import SpectrumFigure from './SpectrumFigure.svelte'
  import { MAX_LINES_TEXT, MAX_NAME, MAX_STRIPS, asCustom, nextId, parseLines, stripName, type Strip } from './strips'

  const gen = generatorState(spectrumSettings, 'line-spectrum')
  const s = gen.s
  const clean = $derived(gen.snapshot())
  const f = $derived(buildSpectrum(clean))
  const answers = $derived(answerLines(clean))
  let svg = $state<SVGSVGElement>()

  const STYLE_NAMES: Record<Style, string> = { emission: 'Emission', absorption: 'Absorption', print: 'Print' }
  const STYLE_NOTES: Record<Style, string> = {
    emission: 'Bright colored lines on black, as a glowing gas gives off.',
    absorption: 'Dark lines across a rainbow, as a cool gas takes out of white light.',
    print: 'Black lines on white, for a black-and-white copier.',
  }
  const STRENGTH_NAMES = { uniform: 'All equal', relative: 'Relative' }
  const LABEL_NAMES: Record<Labels, string> = { names: 'Names', symbols: 'Symbols', blank: 'Blank', none: 'None' }
  const LABEL_NOTES: Record<Labels, string> = {
    names: 'Each element strip’s name, e.g. Hydrogen.',
    symbols: 'Each element strip’s symbol, e.g. H.',
    blank: 'A line left of each element strip for students to write its name.',
    none: 'No labels at all, not even on your own strips.',
  }
  const AXIS_NAMES = { bottom: 'Under the last', each: 'Under each', none: 'None' }
  const TYPE_NAMES = { element: 'Element', custom: 'Your own lines', mixture: 'Mixture' }

  const stripsSummary = $derived(clean.strips.map((x) => stripName(x) || TYPE_NAMES[x.type]).join(', '))
  const lookSummary = $derived(`${STYLE_NAMES[clean.style]}, ${clean.strength === 'relative' ? 'relative' : 'equal'} brightness`)
  const axisSummary = $derived(`${clean.from}–${clean.to} nm, numbered every ${clean.numbers}`)
  const textSummary = $derived(
    [clean.titleMode === 'text' && clean.title ? `“${clean.title}”` : '', clean.answerKey && answers.length ? 'Answer key' : '']
      .filter(Boolean)
      .join(', ') || 'None',
  )

  /** The strips a mixture can take in: every one that isn't a mixture. */
  const mixable = $derived(s.strips.filter((x) => x.type !== 'mixture'))

  function add(strip: Strip) {
    if (s.strips.length < MAX_STRIPS) s.strips.push(strip)
  }

  function remove(i: number) {
    const [gone] = s.strips.splice(i, 1)
    for (const x of s.strips) if (x.type === 'mixture') x.of = x.of.filter((id) => id !== gone.id)
  }

  function move(i: number, by: number) {
    const j = i + by
    if (j < 0 || j >= s.strips.length) return
    ;[s.strips[i], s.strips[j]] = [s.strips[j], s.strips[i]]
  }

  function toggle(mixture: Strip, id: number, on: boolean) {
    if (mixture.type !== 'mixture') return
    mixture.of = on ? [...mixture.of, id] : mixture.of.filter((x) => x !== id)
  }
</script>

{#snippet numberField(label: string, value: number, set: (v: number) => void)}
  <label class="number">
    <span>{label}</span>
    <input
      type="number"
      min={VISIBLE_FROM}
      max={VISIBLE_TO}
      {value}
      oninput={(e) => Number.isFinite(e.currentTarget.valueAsNumber) && set(e.currentTarget.valueAsNumber)}
      onchange={(e) => (e.currentTarget.value = String(value))}
    />
  </label>
{/snippet}

{#snippet segmented(name: string, options: readonly string[], names: Record<string, string>, value: string, set: (v: any) => void)}
  <div class="segmented" role="radiogroup" aria-label={name}>
    {#each options as option (option)}
      <button type="button" role="radio" aria-checked={value === option} class:on={value === option} onclick={() => set(option)}>
        {names[option]}
      </button>
    {/each}
  </div>
{/snippet}

<GeneratorPage name="Line Spectrum" filename="line-spectrum" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Strips" summary={stripsSummary} icon={Rows3} open>
      {#each s.strips as strip, i (strip.id)}
        {@const title = stripName(strip) || TYPE_NAMES[strip.type]}
        {@const drawn = f.strips[i]}
        <div class="strip">
          <div class="strip-head">
            <strong>{i + 1}. {TYPE_NAMES[strip.type]}</strong>
            <button type="button" class="icon-btn" aria-label="Move {title} up" data-tip="Move up" disabled={i === 0} onclick={() => move(i, -1)}>
              <ArrowUp size={17} />
            </button>
            <button
              type="button" class="icon-btn" aria-label="Move {title} down" data-tip="Move down"
              disabled={i === s.strips.length - 1} onclick={() => move(i, 1)}
            >
              <ArrowDown size={17} />
            </button>
            {#if s.strips.length > 1}
              <button type="button" class="icon-btn" aria-label="Remove {title}" data-tip="Remove" onclick={() => remove(i)}>
                <Trash2 size={17} />
              </button>
            {/if}
          </div>
          {#if strip.type === 'element'}
            <div class="row">
              <select aria-label="Strip {i + 1} element" bind:value={strip.element}>
                {#each ELEMENTS as el (el.symbol)}<option value={el.symbol}>{el.symbol} – {el.name}</option>{/each}
              </select>
              <button type="button" class="btn-ghost small" onclick={() => (s.strips[i] = asCustom(strip))}>
                <PencilLine size={16} aria-hidden="true" /> Edit lines
              </button>
            </div>
          {:else if strip.type === 'custom'}
            {@const bad = parseLines(strip.lines).bad}
            <label class="text-field">
              <span>Name</span>
              <input type="text" maxlength={MAX_NAME} placeholder="e.g. Element X" bind:value={strip.name} />
            </label>
            <label class="text-field">
              <span>Wavelengths <span class="hint">in nm, separated by commas</span></span>
              <input type="text" maxlength={MAX_LINES_TEXT} placeholder="e.g. 450, 520.5, 610" aria-invalid={bad.length > 0} bind:value={strip.lines} />
            </label>
            {#if bad.length}
              <p class="warning" role="status">Not wavelengths, so left out: {bad.join(', ')}.</p>
            {/if}
          {:else}
            <label class="text-field">
              <span>Name</span>
              <input type="text" maxlength={MAX_NAME} placeholder="e.g. Unknown" bind:value={strip.name} />
            </label>
            <p class="field-label">Made of</p>
            {#if mixable.length}
              <div class="parts">
                {#each mixable as part (part.id)}
                  <label class="part-check">
                    <input type="checkbox" checked={strip.of.includes(part.id)} onchange={(e) => toggle(strip, part.id, e.currentTarget.checked)} />
                    <span>{stripName(part) || `Strip ${s.strips.indexOf(part) + 1}`}</span>
                  </label>
                {/each}
              </div>
            {:else}
              <p class="note">Add an element or your own lines to mix.</p>
            {/if}
          {/if}
          {#if drawn?.outside}
            <p class="note">
              {drawn.outside} line{drawn.outside === 1 ? ' is' : 's are'} outside {clean.from}–{clean.to} nm, so not drawn. Widen the axis to show
              {drawn.outside === 1 ? 'it' : 'them'}.
            </p>
          {/if}
        </div>
      {/each}
      {#if s.strips.length < MAX_STRIPS}
        <div class="actions">
          <button type="button" class="btn-ghost small" onclick={() => add({ type: 'element', id: nextId(s.strips), element: 'H' as ElementSymbol })}>
            <Plus size={17} aria-hidden="true" /> Element
          </button>
          <button type="button" class="btn-ghost small" onclick={() => add({ type: 'custom', id: nextId(s.strips), name: '', lines: '' })}>
            <Plus size={17} aria-hidden="true" /> Your own lines
          </button>
          <button type="button" class="btn-ghost small" onclick={() => add({ type: 'mixture', id: nextId(s.strips), name: 'Unknown', of: [] })}>
            <Blend size={17} aria-hidden="true" /> Mixture
          </button>
        </div>
      {/if}
      <p class="note">
        Elements show a few of their strongest visible lines, not every one. A mixture shows every line of the strips in it.
      </p>
    </Section>

    <Section title="Look" summary={lookSummary} icon={Palette} open>
      {@render segmented('Style', STYLES, STYLE_NAMES, s.style, (v) => (s.style = v))}
      <p class="note">{STYLE_NOTES[s.style]}</p>
      <p class="field-label spaced">Brightness</p>
      {@render segmented('Brightness', STRENGTHS, STRENGTH_NAMES, s.strength, (v) => (s.strength = v))}
      <p class="note">
        {s.strength === 'relative'
          ? 'Element lines as bright as NIST lists them against the element’s strongest (roughly), faint ones never fainter than 30%. Your own lines are all full strength.'
          : 'Every line drawn equally bright, so only where they are matters.'}
      </p>
    </Section>

    <Section title="Labels" summary={LABEL_NAMES[clean.labels]} icon={Tag}>
      {@render segmented('Labels', LABELS, LABEL_NAMES, s.labels, (v) => (s.labels = v))}
      <p class="note">{LABEL_NOTES[s.labels]}</p>
      {#if s.labels !== 'none'}
        <p class="note">Your own strips and mixtures show the names you give them. Leave a name empty for no label.</p>
      {/if}
    </Section>

    <Section title="Wavelength axis" summary={axisSummary} icon={Ruler}>
      <div class="numbers">
        {@render numberField('From (nm)', s.from, (v) => (s.from = v))}
        {@render numberField('To (nm)', s.to, (v) => (s.to = v))}
      </div>
      <p class="note">Visible light runs from about 380 to 780 nm; every strip is the same width whatever the range.</p>
      <div class="numbers">
        <label class="number">
          <span>Tick every</span>
          <select bind:value={s.ticks}>{#each TICKS as t (t)}<option value={t}>{t === 'none' ? 'No small ticks' : `${t} nm`}</option>{/each}</select>
        </label>
        <label class="number">
          <span>Number every</span>
          <select bind:value={s.numbers}>{#each NUMBERS as n (n)}<option value={n}>{n} nm</option>{/each}</select>
        </label>
      </div>
      <p class="field-label spaced">Axis</p>
      {@render segmented('Axis', AXES, AXIS_NAMES, s.axis, (v) => (s.axis = v))}
      {#if s.axis !== 'none'}
        <p class="field-label spaced">Axis title</p>
        <LabelField name="Axis title" bind:mode={s.axisTitleMode} bind:text={s.axisTitle} placeholder="Wavelength (nm)" blank={false} />
      {/if}
    </Section>

    <Section title="Chart title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings
        bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey}
        answer={answers.join(' · ') || 'nothing yet'}
      />
      {#if !answers.length}
        <p class="note">The answer key names what’s in each mixture, and the elements when their labels are blank. Add a mixture or blank the labels to use it.</p>
      {/if}
    </Section>
  {/snippet}
  {#snippet figure()}
    <SpectrumFigure settings={clean} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .strip { padding: 0.8rem 0; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.55rem; }
  .strip:first-child { padding-top: 0.35rem; }
  .strip-head { display: flex; align-items: center; gap: 0.25rem; }
  .strip-head strong { flex: 1; font-size: 0.92rem; }
  .row { display: flex; gap: 0.5rem; align-items: center; }
  .row select { flex: 1; min-width: 0; }
  .text-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.88rem; font-weight: 700; }
  .text-field input { font-weight: 400; }
  .hint { font-weight: 400; color: var(--muted); }
  .parts { display: flex; flex-wrap: wrap; gap: 0.4rem 1rem; }
  .part-check { display: flex; align-items: center; gap: 0.4rem; font-size: 0.88rem; cursor: pointer; }
  .part-check input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--blue); }
  .number { display: flex; align-items: center; gap: 0.45rem; font-size: 0.84rem; color: var(--muted); }
  .number input { width: 5rem; font-variant-numeric: tabular-nums; }
  .numbers { display: flex; flex-wrap: wrap; gap: 0.6rem 1.1rem; margin-top: 0.35rem; }
  .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.85rem; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .strip .note { margin: 0; }
  .warning { margin: 0; padding: 0.55rem 0.75rem; border-radius: 10px; background: var(--red-soft); color: #991b1b; font-size: 0.85rem; }
  .field-label { margin: 0; font-weight: 700; font-size: 0.88rem; }
  .field-label.spaced { margin: 0.9rem 0 0.45rem; }
</style>
