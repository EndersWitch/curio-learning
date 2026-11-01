<script lang="ts">
  // The Punnett Square generator: type the cross, name the phenotypes, and
  // choose what the square shows and what's left for students to fill in.
  // Settings live in the page address.
  import { untrack } from 'svelte'
  import { Grid2x2, ListOrdered, PaintBucket, Tags, Type } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import Alleles from './Alleles.svelte'
  import CrossInput from './CrossInput.svelte'
  import { crossText, genotypeKey, parseCross, phenotypeCounts, type Cross, type Dominance } from './genetics'
  import { isBlank } from './layout'
  import PunnettFigure from './PunnettFigure.svelte'
  import {
    COMMON_CROSSES,
    punnettSettings,
    readNames,
    squareOf,
    startingCross,
    withCross,
    withName,
    type Form,
    type ParentLabels,
  } from './settings'
  import { classesOf, phenotypeRuns, plain } from './summary'
  import { genotypeRuns } from './text'

  const gen = generatorState(punnettSettings, 'punnett-square')
  const s = gen.s
  let svg = $state<SVGSVGElement>()

  const t = $derived(gen.snapshot())
  const sq = $derived(squareOf(t))
  const classes = $derived(classesOf(sq))
  const names = $derived(readNames(t.names))
  const n = $derived(sq.top.length)

  const CROSS_NAMES: Record<Cross, string> = { monohybrid: 'Monohybrid', dihybrid: 'Dihybrid', 'x-linked': 'X-linked' }
  const DOMINANCE_NAMES: Record<Dominance, string> = { complete: 'Complete', incomplete: 'Incomplete', codominance: 'Codominance' }
  const LABEL_NAMES: Record<ParentLabels, string> = { genotype: 'Genotype', sex: '♀ ♂', mother: 'Mother', none: 'None' }
  const FORM_NAMES: Record<Form, string> = { ratio: 'Ratio', percent: 'Percent', fraction: 'Fraction' }

  // The cross box keeps what the teacher types; only a cross that reads is
  // drawn and kept in the address, so the figure stays on the last good one.
  let typed = $state(untrack(() => s.parents))
  let kept = untrack(() => s.parents)
  $effect(() => {
    const parents = s.parents
    if (parents !== kept) typed = kept = parents
  })
  /** The address keeps at most 60 characters of the cross. */
  const read = (text: string) => (text.length > 60 ? ({ ok: false, error: 'That’s longer than a cross needs.' } as const) : parseCross(text, s.cross, s.dominance))
  const reading = $derived(read(typed))
  function type(text: string) {
    typed = text
    if (read(text).ok) s.parents = kept = text
  }
  /** Tidied once the teacher leaves the box: "aA x Aa" becomes "Aa × Aa". */
  function tidyTyped() {
    if (reading.ok) type(crossText(reading.value))
  }

  /** Another kind of cross keeps the typed one if it still reads, and
   *  otherwise starts from that kind's usual example. */
  function choose(cross: Cross, dominance: Dominance) {
    const next = cross === 'dihybrid' ? 'complete' : dominance
    if (!parseCross(s.parents, cross, next).ok) {
      const start = startingCross(cross, next)
      s.parents = start.parents
      s.names = start.names
      s.shade = ''
    }
    if (cross !== s.cross) s.blanks = 0
    s.cross = cross
    s.dominance = next
  }

  // The setup picker shows the common cross the square still is; changing
  // any of its settings leaves it blank again.
  const setupName = $derived(
    COMMON_CROSSES.find((cross) => Object.entries(cross.settings).every(([key, value]) => (t as Record<string, unknown>)[key] === value))?.name ?? '',
  )
  function chooseSetup(name: string) {
    const cross = COMMON_CROSSES.find((x) => x.name === name)
    if (cross) gen.apply(withCross(gen.snapshot(), cross.settings))
  }

  const toggleCell = (row: number, column: number) => (s.blanks ^= 1 << (row * n + column))

  const phenotypes = $derived(phenotypeCounts(sq))
  const nameOf = (value: (typeof phenotypes)[number]['value']) => plain(phenotypeRuns(classes, names, value))
  const shadeOptions = $derived([
    ['', 'None'],
    ['each', 'Each phenotype its own, with a key'],
    ...phenotypes.map((p) => [p.key, `Only ${nameOf(p.value)}`]),
  ])

  const crossSummary = $derived(
    `${CROSS_NAMES[t.cross]}${t.cross === 'dihybrid' || t.dominance === 'complete' ? '' : `, ${DOMINANCE_NAMES[t.dominance].toLowerCase()}`}: ${crossText(sq)}`.replace(/[\^_{}]/g, ''),
  )
  const namesSummary = $derived(classes.flat().map((c) => names.get(c.key) || plain(c.unnamed)).join(', '))
  const squareSummary = $derived(
    [
      t.cells === 'filled' ? 'Filled in' : t.cells === 'blank' ? 'Cells blank' : 'Some cells blank',
      t.gametes === 'blank' ? 'gametes blank' : '',
      t.parentLabels === 'none' ? 'no parents' : t.parentGenotypes === 'blank' ? 'parents blank' : '',
    ]
      .filter(Boolean)
      .join(', '),
  )
  const shadeSummary = $derived(shadeOptions.find(([key]) => key === t.shade)?.[1] ?? 'None')
  const lineSummary = (mode: string, what: string) => (mode === 'none' ? '' : mode === 'blank' ? `${what} blank` : what)
  const summarySummary = $derived(
    [lineSummary(t.genotypeRatio, 'genotypes'), lineSummary(t.phenotypeRatio, 'phenotypes')].filter(Boolean).join(', ') || 'None',
  )
  const textSummary = $derived(
    [t.titleMode === 'text' && t.title ? `“${t.title}”` : 'No title', t.question ? 'a question' : 'no question'].join(', '),
  )
</script>

<GeneratorPage name="Punnett Square" filename="punnett-square" settingsWidth={26} {gen} {svg} bind:labelSize={s.labelSize}>
  {#snippet inputs()}
    <div class="inputs">
      <label class="field-label" for="punnett-setup">Classic setups</label>
      <select id="punnett-setup" value={setupName} onchange={(e) => chooseSetup(e.currentTarget.value)}>
        <option value="" disabled>Choose one…</option>
        {#each COMMON_CROSSES as cross (cross.name)}<option value={cross.name}>{cross.name}</option>{/each}
      </select>

      <p class="field-label">Cross</p>
      <div class="segmented" role="radiogroup" aria-label="Cross">
        {#each Object.entries(CROSS_NAMES) as [cross, name] (cross)}
          <button type="button" role="radio" aria-checked={s.cross === cross} class:on={s.cross === cross} onclick={() => choose(cross as Cross, s.dominance)}>
            {name}
          </button>
        {/each}
      </div>
      {#if s.cross !== 'dihybrid'}
        <p class="field-label">Dominance</p>
        <div class="segmented" role="radiogroup" aria-label="Dominance">
          {#each Object.entries(DOMINANCE_NAMES) as [dominance, name] (dominance)}
            <button
              type="button"
              role="radio"
              aria-checked={s.dominance === dominance}
              class:on={s.dominance === dominance}
              onclick={() => choose(s.cross, dominance as Dominance)}
            >
              {name}
            </button>
          {/each}
        </div>
      {/if}

      <label class="field-label" for="punnett-parents">Parents</label>
      <CrossInput
        id="punnett-parents"
        bind:value={() => typed, type}
        onleave={tidyTyped}
        aria-invalid={!reading.ok}
        aria-describedby="punnett-parents-note"
      />
      {#if reading.ok}
        <p class="note" id="punnett-parents-note">
          {#if s.cross === 'x-linked'}
            Mother and father with an × between, each X with its allele: X^H X^h × X^H Y.
          {:else if s.dominance !== 'complete'}
            Type ^ for a superscript and _ for a subscript.
          {:else}
            The first parent goes across the top. Capitals are dominant.
          {/if}
        </p>
      {:else}
        <p class="note error" id="punnett-parents-note" role="status">{reading.error}</p>
      {/if}
    </div>
  {/snippet}

  {#snippet settings()}
    <Section title="Phenotypes" summary={namesSummary} icon={Tags} open>
      <p class="note">Names for what each {s.dominance === 'complete' ? 'allele' : 'genotype'} looks like, for the summary, key and cells.</p>
      {#each classes as gene, g (g)}
        <div class="names" class:split={g > 0}>
          {#each gene as c (c.key)}
            <label class="name">
              <span class="name-alleles"><Alleles runs={c.unnamed} /></span>
              <input
                type="text"
                maxlength="40"
                placeholder="e.g. {c.alleles.length > 1 ? 'pink' : c.unnamed.at(-1)?.text === '_' ? 'tall' : 'short'}"
                value={names.get(c.key) ?? ''}
                oninput={(e) => (s.names = withName(s.names, c.key, e.currentTarget.value))}
              />
            </label>
          {/each}
        </div>
      {/each}
    </Section>

    <Section title="Square" summary={squareSummary} icon={Grid2x2}>
      <p class="field-label">Parents</p>
      <div class="segmented" role="radiogroup" aria-label="Parent labels">
        {#each Object.entries(LABEL_NAMES) as [labels, name] (labels)}
          <button type="button" role="radio" aria-checked={s.parentLabels === labels} class:on={s.parentLabels === labels} onclick={() => (s.parentLabels = labels as ParentLabels)}>
            {name}
          </button>
        {/each}
      </div>
      {#if s.parentLabels !== 'none'}
        <label class="check"><input type="checkbox" checked={s.parentGenotypes === 'blank'} onchange={(e) => (s.parentGenotypes = e.currentTarget.checked ? 'blank' : 'shown')} /> Leave the parents’ genotypes blank</label>
      {/if}
      {#if s.cross !== 'x-linked' && s.parentLabels !== 'genotype' && s.parentLabels !== 'none'}
        <p class="note">The first parent is the mother.</p>
      {/if}
      <label class="check"><input type="checkbox" checked={s.gametes === 'blank'} onchange={(e) => (s.gametes = e.currentTarget.checked ? 'blank' : 'shown')} /> Leave the gametes blank</label>

      <p class="field-label">Offspring</p>
      <div class="segmented" role="radiogroup" aria-label="Offspring cells">
        {#each [['filled', 'Filled in'], ['blank', 'Blank'], ['some', 'Some blank']] as [cells, name] (cells)}
          <button type="button" role="radio" aria-checked={s.cells === cells} class:on={s.cells === cells} onclick={() => (s.cells = cells as typeof s.cells)}>
            {name}
          </button>
        {/each}
      </div>
      {#if s.cells === 'some'}
        <p class="note">Click the cells students fill in.</p>
        <div class="picker" style:--n={n}>
          {#each sq.cells as row, r (r)}
            {#each row as g, c (c)}
              {@const blank = isBlank(t, r, c, n)}
              <button
                type="button"
                class="pick"
                class:blank
                aria-pressed={blank}
                aria-label="{genotypeKey(g).replace(/[\^_{}]/g, '')}, row {r + 1}, column {c + 1}{blank ? ', blank' : ''}"
                onclick={() => toggleCell(r, c)}
              >
                {#if !blank}<Alleles runs={genotypeRuns(g)} />{/if}
              </button>
            {/each}
          {/each}
        </div>
      {/if}
      <label class="check"><input type="checkbox" bind:checked={s.cellNames} /> Write each phenotype under its genotype</label>
    </Section>

    <Section title="Shading" summary={shadeSummary} icon={PaintBucket}>
      <label class="field-label" for="punnett-shade">Shade the cells by phenotype</label>
      <select id="punnett-shade" bind:value={s.shade}>
        {#each shadeOptions as [key, name] (key)}<option value={key}>{name}</option>{/each}
      </select>
      <p class="note">Gray, hatching and dots, so phenotypes stay apart in a photocopy. Blank cells aren’t shaded.</p>
    </Section>

    <Section title="Ratios" summary={summarySummary} icon={ListOrdered}>
      {#each [['genotypeRatio', 'Genotypes'], ['phenotypeRatio', s.cross === 'x-linked' ? 'Phenotypes (daughters and sons)' : 'Phenotypes']] as [key, name] (key)}
        {@const field = key as 'genotypeRatio' | 'phenotypeRatio'}
        <p class="field-label">{name}</p>
        <div class="segmented" role="radiogroup" aria-label={name}>
          {#each [['shown', 'Shown'], ['blank', 'Blank line'], ['none', 'None']] as [mode, label] (mode)}
            <button type="button" role="radio" aria-checked={s[field] === mode} class:on={s[field] === mode} onclick={() => (s[field] = mode as typeof s.genotypeRatio)}>
              {label}
            </button>
          {/each}
        </div>
      {/each}
      <p class="field-label">Written as</p>
      <div class="segmented" role="radiogroup" aria-label="Written as">
        {#each Object.entries(FORM_NAMES) as [form, name] (form)}
          <button type="button" role="radio" aria-checked={s.form === form} class:on={s.form === form} onclick={() => (s.form = form as Form)}>{name}</button>
        {/each}
      </div>
    </Section>

    <Section title="Title and question" summary={textSummary} icon={Type}>
      <p class="field-label">Chart title</p>
      <LabelField name="Chart title" bind:mode={s.titleMode} bind:text={s.title} placeholder="e.g. Pea plant height" blank={false} />
      <label class="field-label" for="punnett-question">Question</label>
      <textarea
        id="punnett-question"
        rows="3"
        maxlength="300"
        placeholder="e.g. Two heterozygous tall pea plants are crossed. Complete the Punnett square."
        bind:value={s.question}
      ></textarea>
    </Section>
  {/snippet}

  {#snippet figure()}
    <PunnettFigure settings={t} bind:svg />
  {/snippet}
</GeneratorPage>

<style>
  .inputs { padding: 1rem 1.1rem 1.1rem; }
  .field-label { display: block; margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0; }
  .note { margin: 0.45rem 0 0; font-size: 0.85rem; color: var(--muted); }
  .note.error { color: var(--red); }
  .check { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.8rem; font-weight: 600; font-size: 0.9rem; cursor: pointer; }
  .check input { width: 1.05rem; height: 1.05rem; margin: 0; accent-color: var(--blue); }
  .names { display: grid; gap: 0.45rem; margin-top: 0.7rem; }
  .names.split { padding-top: 0.7rem; border-top: 1px solid var(--border); }
  .name { display: grid; grid-template-columns: 4.5rem 1fr; align-items: center; gap: 0.6rem; }
  .name-alleles { font-size: 1.1rem; text-align: right; }
  .picker { display: grid; grid-template-columns: repeat(var(--n), 1fr); gap: 3px; max-width: calc(var(--n) * 3.5rem); margin-top: 0.5rem; }
  .pick { aspect-ratio: 1; display: grid; place-items: center; border: 1.5px solid var(--border); border-radius: 6px; background: #fff; color: var(--ink); font-size: 0.95rem; padding: 0; }
  .pick:hover { border-color: var(--blue-border); background: var(--blue-soft); }
  .pick.blank { background: var(--bg); border-style: dashed; }
  textarea { width: 100%; padding: 0.5rem 0.6rem; border: 1.5px solid var(--border); border-radius: 10px; font: inherit; font-size: 0.95rem; resize: vertical; }
  textarea:focus { outline: none; border-color: var(--blue); }
</style>
