<script lang="ts">
  // Cell Diagram: pick an animal, plant or bacterial cell, choose which
  // structures it shows and which are labeled, and label them with names,
  // numbers or blank lines for students. Clicking a structure in the figure
  // opens a small menu to label or remove it. Settings live in the page
  // address.
  import { List, Microscope, Shapes, Tag, Type, X } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import CellFigure from './CellFigure.svelte'
  import { PLANS } from './cells'
  import { STYLES, STYLE_NAMES } from './look'
  import {
    LABEL_MODES,
    LABEL_MODE_NAMES,
    QUICK,
    cellSettings,
    isQuick,
    withLabel,
    withPart,
    type Quick,
  } from './settings'
  import { CELLS, CELL_NAMES, PARTS, chosen, drawnParts, partName, partsOf, type PartId } from './structures'

  const gen = generatorState(cellSettings, 'cell-diagram')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const parts = $derived(partsOf(s.cell))
  const drawn = $derived(drawnParts(s))
  const labeledCount = $derived(s.labels === 'none' ? 0 : drawn.filter((id) => !s.unlabeled.includes(id) && PLANS[s.cell].anchors[id]).length)
  const name = (id: PartId) => partName(id, s.naming)

  const cellSummary = $derived(`${CELL_NAMES[s.cell]} cell, ${STYLE_NAMES[s.style].toLowerCase()}`)
  const partsSummary = $derived(`${drawn.length} structures, ${labeledCount} labeled`)
  const labelsSummary = $derived(
    s.labels === 'none'
      ? 'No labels'
      : [
          s.labels === 'numbers' ? (s.marker === 'letters' ? 'Letters' : 'Numbers') : LABEL_MODE_NAMES[s.labels],
          (s.labels === 'numbers' || s.labels === 'blanks') && s.wordBank && 'word bank',
          (s.labels === 'numbers' || s.labels === 'blanks') && s.answerKey && 'answer key',
          s.naming === 'simple' && 'simple names',
        ]
          .filter(Boolean)
          .join(', '),
  )

  const setPart = (id: PartId, on: boolean) => Object.assign(s, withPart(s, id, on))
  const setLabel = (id: PartId, on: boolean) => (s.unlabeled = withLabel(s, id, on))
  const labelAll = (on: boolean) => (s.unlabeled = on ? [] : [...parts])
  const applyQuick = (q: Quick) => Object.assign(s, q.set)

  // The menu for a structure clicked in the figure, beside where it was clicked.
  let picked = $state<{ id: PartId; x: number; y: number }>()
  function onpick(id: PartId, event: MouseEvent) {
    picked = picked?.id === id ? undefined : { id, x: event.clientX, y: event.clientY }
  }
  function onwindowclick(event: MouseEvent) {
    const target = event.target as Element
    if (picked && !target.closest('.pick-menu') && !target.closest('[data-part]')) picked = undefined
  }
</script>

<svelte:window onclick={onwindowclick} onkeydown={(e) => e.key === 'Escape' && (picked = undefined)} onscroll={() => (picked = undefined)} onresize={() => (picked = undefined)} />

{#snippet check(label: string, note: string, checked: boolean, set: (v: boolean) => void)}
  <label class="check">
    <input type="checkbox" {checked} onchange={(e) => set(e.currentTarget.checked)} />
    <span><strong>{label}</strong><small>{note}</small></span>
  </label>
{/snippet}

<GeneratorPage name="Cell Diagram" filename="cell-diagram" settingsWidth={26} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet settings()}
    <Section title="Cell" summary={cellSummary} icon={Microscope} open>
      <div class="segmented" role="radiogroup" aria-label="Cell">
        {#each CELLS as cell (cell)}
          <button type="button" role="radio" aria-checked={s.cell === cell} class:on={s.cell === cell} onclick={() => (s.cell = cell)}>
            {CELL_NAMES[cell]}
          </button>
        {/each}
      </div>
      <p class="field-label">Drawn in</p>
      <div class="segmented" role="radiogroup" aria-label="Drawn in">
        {#each STYLES as style (style)}
          <button type="button" role="radio" aria-checked={s.style === style} class:on={s.style === style} onclick={() => (s.style = style)}>
            {STYLE_NAMES[style]}
          </button>
        {/each}
      </div>
      <p class="note">Black and white is line art on white, for photocopies and coloring in.</p>
      <p class="field-label">Quick start</p>
      <div class="quick">
        {#each QUICK as q (q.id)}
          <button type="button" class="chip small" class:on={isQuick(s, q)} onclick={() => applyQuick(q)}>{q.name}</button>
        {/each}
      </div>
    </Section>

    <Section title="Structures" summary={partsSummary} icon={Shapes} open>
      <p class="note first">Tick what the cell shows, and the tag to label it. Or click a structure in the figure.</p>
      <ul class="parts">
        {#each parts as id (id)}
          {@const p = PARTS[id]}
          {@const parentOff = !!p.parent && !chosen(s, p.parent)}
          {@const on = chosen(s, id) && !parentOff}
          {@const labeled = !s.unlabeled.includes(id)}
          <li class:child={p.parent} class:picked={picked?.id === id}>
            <label class="part">
              <input type="checkbox" checked={on} disabled={!!p.always || parentOff} onchange={(e) => setPart(id, e.currentTarget.checked)} />
              <span class:off={!on}>{name(id)}</span>
            </label>
            {#if s.labels !== 'none'}
              <button
                type="button"
                class="tag"
                class:on={labeled && on}
                disabled={!on}
                aria-pressed={labeled}
                aria-label="Label {name(id)}"
                data-tip={labeled ? 'Labeled' : 'Not labeled'}
                onclick={() => setLabel(id, !labeled)}
              >
                <Tag size={16} aria-hidden="true" />
              </button>
            {/if}
          </li>
        {/each}
      </ul>
      {#if s.labels !== 'none'}
        <div class="all">
          <button type="button" class="btn-ghost small" onclick={() => labelAll(true)}>Label all</button>
          <button type="button" class="btn-ghost small" onclick={() => labelAll(false)}>Label none</button>
        </div>
      {/if}
    </Section>

    <Section title="Labels" summary={labelsSummary} icon={List}>
      <div class="segmented" role="radiogroup" aria-label="Labels">
        {#each LABEL_MODES as mode (mode)}
          <button type="button" role="radio" aria-checked={s.labels === mode} class:on={s.labels === mode} onclick={() => (s.labels = mode)}>
            {LABEL_MODE_NAMES[mode]}
          </button>
        {/each}
      </div>
      <p class="note">
        {s.labels === 'names'
          ? 'Each structure’s name at the end of its leader line.'
          : s.labels === 'numbers'
            ? 'A number at the end of each leader line, for students to name.'
            : s.labels === 'blanks'
              ? 'A blank line at the end of each leader line, for students to write the name on.'
              : 'Just the cell, with no leader lines.'}
      </p>
      {#if s.labels === 'numbers'}
        <p class="field-label">Count with</p>
        <div class="segmented" role="radiogroup" aria-label="Count with">
          <button type="button" role="radio" aria-checked={s.marker === 'numbers'} class:on={s.marker === 'numbers'} onclick={() => (s.marker = 'numbers')}>1, 2, 3</button>
          <button type="button" role="radio" aria-checked={s.marker === 'letters'} class:on={s.marker === 'letters'} onclick={() => (s.marker = 'letters')}>A, B, C</button>
        </div>
      {/if}
      {#if s.labels === 'numbers' || s.labels === 'blanks'}
        {@render check('Word bank', 'List the labeled names in a box under the cell, in alphabetical order.', s.wordBank, (v) => (s.wordBank = v))}
        {@render check(
          'Answer key',
          s.labels === 'numbers' ? 'List each number’s name under the cell.' : 'Write each name on its line.',
          s.answerKey,
          (v) => (s.answerKey = v),
        )}
      {/if}
      {#if s.labels !== 'none'}
        <p class="field-label">Names</p>
        <div class="segmented" role="radiogroup" aria-label="Names">
          <button type="button" role="radio" aria-checked={s.naming === 'textbook'} class:on={s.naming === 'textbook'} onclick={() => (s.naming = 'textbook')}>Textbook</button>
          <button type="button" role="radio" aria-checked={s.naming === 'simple'} class:on={s.naming === 'simple'} onclick={() => (s.naming = 'simple')}>Simple</button>
        </div>
        <p class="note">
          {s.naming === 'textbook'
            ? 'As in high school and college textbooks: plasma membrane, Golgi apparatus, rough endoplasmic reticulum.'
            : 'Shorter names many middle school worksheets use: cell membrane, Golgi body, rough ER.'}
        </p>
      {/if}
    </Section>

    <Section title="Chart title" summary={s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title'} icon={Type}>
      <LabelField name="Chart title" bind:mode={s.titleMode} bind:text={s.title} placeholder="e.g. Label the animal cell" blank={false} />
    </Section>
  {/snippet}
  {#snippet figure()}
    <CellFigure settings={s} bind:svg selected={picked?.id} {onpick} />
    {#if picked}
      {@const id = picked.id}
      {@const p = PARTS[id]}
      {@const labeled = !s.unlabeled.includes(id)}
      <div class="pick-menu no-print" role="dialog" aria-label={name(id)} style:left="{picked.x}px" style:top="{picked.y}px">
        <div class="pick-head">
          <strong>{name(id)}</strong>
          <button type="button" class="icon-btn close" aria-label="Close" onclick={() => (picked = undefined)}><X size={16} /></button>
        </div>
        {#if s.labels !== 'none'}
          <button type="button" class="btn-ghost small" onclick={() => setLabel(id, !labeled)}>
            <Tag size={16} aria-hidden="true" />
            {labeled ? 'Remove its label' : 'Label it'}
          </button>
        {/if}
        {#if !p.always}
          <button
            type="button"
            class="btn-ghost small"
            onclick={() => {
              setPart(id, false)
              picked = undefined
            }}>Take it out of the cell</button
          >
        {/if}
      </div>
    {/if}
  {/snippet}
</GeneratorPage>

<style>
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .note.first { margin: 0.35rem 0 0.5rem; }
  .quick { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .small { padding: 0.35rem 0.75rem; font-size: 0.86rem; }
  .parts { list-style: none; margin: 0; padding: 0; }
  .parts li { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding: 0.12rem 0.3rem; border-radius: 8px; }
  .parts li.child { padding-left: 1.6rem; }
  .parts li.picked { background: var(--blue-soft); }
  .part { display: flex; align-items: center; gap: 0.55rem; flex: 1; min-width: 0; padding: 0.22rem 0; font-size: 0.9rem; cursor: pointer; }
  .part input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--blue); }
  .part .off { color: var(--muted); }
  .tag { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; padding: 0; border: 1.5px solid var(--border); border-radius: 8px; background: #fff; color: #9aa0aa; }
  .tag.on { border-color: var(--blue-border); background: var(--blue-soft); color: var(--blue-dark); }
  .tag:disabled { opacity: 0.4; cursor: default; }
  .all { display: flex; gap: 0.5rem; margin-top: 0.7rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
  .pick-menu {
    position: fixed;
    z-index: 30;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 13rem;
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 10px 30px -10px rgba(16, 24, 40, 0.35);
    transform: translate(12px, 12px);
  }
  .pick-head { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; padding-left: 0.2rem; }
  .pick-head .close { width: 1.8rem; height: 1.8rem; }
  .pick-menu .btn-ghost { justify-content: flex-start; }
  /* The figure card sizes every svg in it to fill the card; not these icons. */
  .pick-menu :global(svg) { flex: none; width: 16px; height: 16px; max-height: none; }
</style>
