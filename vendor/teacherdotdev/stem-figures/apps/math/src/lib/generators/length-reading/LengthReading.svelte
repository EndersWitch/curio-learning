<script lang="ts">
  // Length Reading: pick a metric or imperial ruler and how finely it's
  // marked, type an object's length, and get a figure students measure it
  // from. The object starts lined up with 0; the teacher can slide it along
  // so students read both ends.
  import { ArrowLeftToLine, Circle, MoveHorizontal, Ruler, Type, ZoomIn } from '@lucide/svelte'
  import FigureTextSettings from '$shared/FigureTextSettings.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import MagnifierSettings from '$shared/MagnifierSettings.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { MARBLE_COUNTS, OBJECTS, OBJECT_NAMES } from './objectKinds'
  import LengthField from './LengthField.svelte'
  import LengthFigure from './LengthFigure.svelte'
  import {
    CM_PER_INCH, CM_SIZES, IMPERIAL_MARKS, INCH_SIZES, METRIC_MARKS, METRIC_MARK_NAMES, READS, READ_NAMES, SYSTEMS, SYSTEM_NAMES, UNITS,
    formatLength, marksFit, nearestSize, randomLength, rulerScale, shortest, type System,
  } from './ruler'
  import { LENGTH_VIEWS, LENGTH_VIEW_NAMES, answerLine, endOf, lengthSettings, lengthText, type LengthSettings } from './settings'

  const gen = generatorState(lengthSettings, 'length-reading')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const scale = $derived(rulerScale(s))
  const unit = $derived(UNITS[s.system])

  /** Changes settings, keeping the rest within the rules between them (the
   *  object on the ruler, its ends on what the ruler reads). */
  const set = (patch: Partial<LengthSettings>) => Object.assign(s, lengthSettings.tidy({ ...$state.snapshot(s), ...patch }))

  /** The other system keeps the object the same real length, on the
   *  shortest ruler of that system it fits on, and the magnifiers about as
   *  wide (3 cm across is about 1 inch). */
  function changeSystem(system: System) {
    if (system === s.system) return
    const k = system === 'imperial' ? 1 / CM_PER_INCH : CM_PER_INCH
    const [length, start, across] = [s.length * k, s.start * k, s.span * scale.numbered * k]
    const size = system === 'imperial' ? { inches: nearestSize(INCH_SIZES, start + length) } : { cm: nearestSize(CM_SIZES, start + length) }
    const next = lengthSettings.tidy({ ...$state.snapshot(s), system, ...size, length, start })
    set({ ...next, span: Math.round(across / rulerScale(next).numbered) })
  }

  const marksName = $derived(s.system === 'imperial' ? `${formatLength(scale, scale.minor)} in` : METRIC_MARK_NAMES[s.metricMarks])
  const rulerSummary = $derived(`${scale.size} ${unit}, ${marksName} marks`)
  const objectSummary = $derived(s.object === 'marbles' ? `${s.marbles} marble${s.marbles === 1 ? '' : 's'}` : OBJECT_NAMES[s.object])
  const lengthSummary = $derived(`${lengthText(s, s.length)}${s.start ? `, from ${lengthText(s, s.start)}` : ', from 0'}`)
  const textSummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey ? 'answer key' : 'no answer key'].join(', '),
  )
</script>

<GeneratorPage name="Length Reading Generator" filename="length-reading" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Ruler" summary={rulerSummary} icon={Ruler} open>
      <div class="segmented" role="radiogroup" aria-label="Units">
        {#each SYSTEMS as system (system)}
          <button type="button" role="radio" aria-checked={s.system === system} class:on={s.system === system} onclick={() => changeSystem(system)}>
            {SYSTEM_NAMES[system]}
          </button>
        {/each}
      </div>
      <p class="field-label">Length</p>
      <div class="chips" role="radiogroup" aria-label="Ruler length">
        {#if s.system === 'metric'}
          {#each CM_SIZES as cm (cm)}
            <button type="button" role="radio" aria-checked={s.cm === cm} class="chip" class:on={s.cm === cm} onclick={() => set({ cm })}>{cm} cm</button>
          {/each}
        {:else}
          {#each INCH_SIZES as inches (inches)}
            <button type="button" role="radio" aria-checked={s.inches === inches} class="chip" class:on={s.inches === inches} onclick={() => set({ inches })}>
              {inches} in
            </button>
          {/each}
        {/if}
      </div>
      <p class="field-label">Smallest marks</p>
      <div class="chips" role="radiogroup" aria-label="Smallest marks">
        {#if s.system === 'metric'}
          {#each METRIC_MARKS as metricMarks (metricMarks)}
            <button
              type="button" role="radio" aria-checked={s.metricMarks === metricMarks} class="chip" class:on={s.metricMarks === metricMarks}
              disabled={!marksFit(metricMarks, s.cm)} onclick={() => set({ metricMarks })}
            >
              {METRIC_MARK_NAMES[metricMarks]}
            </button>
          {/each}
        {:else}
          {#each IMPERIAL_MARKS as imperialMarks (imperialMarks)}
            <button
              type="button" role="radio" aria-checked={s.imperialMarks === imperialMarks} class="chip" class:on={s.imperialMarks === imperialMarks}
              onclick={() => set({ imperialMarks })}
            >
              {imperialMarks === '1' ? '1' : `1/${imperialMarks}`} in
            </button>
          {/each}
        {/if}
      </div>
      {#if s.system === 'metric' && !marksFit('ten', s.cm)}
        <p class="note">5 cm and 10 cm marks are for the 50 cm and 100 cm rulers.</p>
      {/if}
      {#if s.system === 'metric'}
        <p class="field-label">Read to</p>
        <div class="segmented" role="radiogroup" aria-label="Read to">
          {#each READS as read (read)}
            <button type="button" role="radio" aria-checked={s.read === read} class:on={s.read === read} onclick={() => set({ read })}>
              {READ_NAMES[read]}
            </button>
          {/each}
        </div>
        <p class="note">
          {s.read === 'estimate'
            ? `Lengths go one digit past the smallest mark, to ${formatLength(scale, scale.step)} cm.`
            : `Lengths land on a mark, to ${formatLength(scale, scale.step)} cm.`}
        </p>
      {:else}
        <p class="note">Lengths land on a mark and are read as fractions of an inch.</p>
      {/if}
    </Section>
    <Section title="Length and position" summary={lengthSummary} icon={MoveHorizontal} open>
      <div class="readings">
        <LengthField
          label="Object’s length"
          value={s.length}
          {scale}
          min={shortest(scale)}
          max={scale.size}
          onchange={(length) => set({ length })}
          onrandom={() => set({ length: randomLength(scale) })}
        />
        <LengthField
          label="Left end at"
          value={s.start}
          {scale}
          min={0}
          max={scale.size - s.length}
          onchange={(start) => set({ start })}
        />
      </div>
      <button type="button" class="btn-ghost zero" disabled={!s.start} onclick={() => set({ start: 0 })}>
        <ArrowLeftToLine size={17} aria-hidden="true" /> Line up with 0
      </button>
      <p class="note">
        {s.start ? `The right end is at ${lengthText(s, endOf(s))}. ` : ''}Tip: drag the object along the ruler in the figure.
      </p>
    </Section>
    <Section title="Object" summary={objectSummary} icon={Circle} open>
      <div class="segmented" role="radiogroup" aria-label="Object">
        {#each OBJECTS as object (object)}
          <button type="button" role="radio" aria-checked={s.object === object} class:on={s.object === object} onclick={() => (s.object = object)}>
            {OBJECT_NAMES[object]}
          </button>
        {/each}
      </div>
      {#if s.object === 'marbles'}
        <p class="field-label">How many, in a row</p>
        <div class="chips" role="radiogroup" aria-label="Number of marbles">
          {#each MARBLE_COUNTS as n (n)}
            <button type="button" role="radio" aria-checked={s.marbles === n} class="chip" class:on={s.marbles === n} onclick={() => (s.marbles = n)}>{n}</button>
          {/each}
        </div>
      {/if}
      <label class="check">
        <input type="checkbox" bind:checked={s.guides} />
        <span>
          <strong>Dashed lines at its ends</strong>
          <small>Down to the ruler, for marbles and rocks, whose ends are above where they touch it.</small>
        </span>
      </label>
    </Section>
    <Section title="Magnifiers" summary={LENGTH_VIEW_NAMES[s.view]} icon={ZoomIn}>
      <MagnifierSettings bind:view={s.view} bind:span={s.span} views={LENGTH_VIEWS} names={LENGTH_VIEW_NAMES} />
      {#if s.view === 'both'}
        <p class="note">One on the object’s right end, and one on its left end when that isn’t lined up with 0.</p>
      {/if}
    </Section>
    <Section title="Title and answer key" summary={textSummary} icon={Type}>
      <FigureTextSettings bind:titleMode={s.titleMode} bind:title={s.title} bind:answerKey={s.answerKey} answer={answerLine(s)} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <LengthFigure settings={s} bind:svg onmove={(start) => set({ start })} />
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .readings { display: flex; flex-direction: column; gap: 0.9rem; }
  .note { margin: 0.7rem 0 0; color: var(--muted); font-size: 0.85rem; }
  .zero { margin-top: 0.8rem; padding: 0.5rem 0.8rem; font-size: 0.9rem; }
  .segmented button { font-size: 0.8rem; }
  .chip:disabled, .chip:disabled:hover { border-color: var(--border); background: #fff; color: var(--muted); opacity: 0.6; cursor: not-allowed; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
</style>
