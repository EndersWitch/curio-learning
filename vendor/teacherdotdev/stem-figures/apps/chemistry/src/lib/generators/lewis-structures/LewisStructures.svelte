<script lang="ts">
  // Lewis Structures: type a formula (or pick a molecule from the list) and
  // get its correct Lewis structure, or an atom's or ion's on its own; then make a "complete this" question
  // from it, or change it into a wrong one for a "find the mistake" question.
  import { tick } from 'svelte'
  import { Atom, Eye, KeyRound, Minus, PencilLine, Plus, RotateCcw, SquareDashed, Type } from '@lucide/svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import HelpTip from '$lib/shared/HelpTip.svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Modal from '$shared/Modal.svelte'
  import Section from '$lib/shared/Section.svelte'
  import { generatorState } from '$shared/generatorState.svelte'
  import { openRequest } from '$shared/request.svelte'
  import LewisFigure from './LewisFigure.svelte'
  import { RULES, type Rule } from './build'
  import { MAX_LONE, setChange, type Change } from './changes'
  import { BOND_STYLES, type BondStyle } from './drawing'
  import type { Selection } from './figureLayout'
  import { chargeText, formulaText, ionMeant, parseFormula, signed } from './formula'
  import { SHAPES, type Shape } from './layout'
  import { LISTED } from './listed'
  import { centralChoices } from './resolve'
  import { MAX_FORMULA, SCAFFOLDS, figureOf, lewisSettings, type Scaffold } from './settings'
  import { hasBrackets, shownCharge, shownFormalCharge } from './structure'

  const gen = generatorState(lewisSettings, 'lewis-structures')
  const s = gen.s
  let svg = $state<SVGSVGElement>()
  let selected = $state<Selection | null>(null)
  /** Bumped to flash the selection in the figure, which then fades so that
   *  a projected figure doesn't show students what was changed. */
  let flash = $state(0)
  let changesBox = $state<HTMLElement>()

  const SHAPE_NAMES: Record<Shape, string> = { flat: 'Flat', shaped: 'Shaped' }
  const SHAPE_NOTES: Record<Shape, string> = {
    flat: 'Atoms and lone pairs on the four sides of each symbol, as most textbooks draw them.',
    shaped: 'Placed to hint at the real shape, like bent H₂O. Still a flat drawing.',
  }
  const BOND_STYLE_NAMES: Record<BondStyle, string> = { lines: 'Lines', dots: 'Dots' }
  const RULE_NAMES: Record<Rule, string> = { octet: 'Octet rule', fewest: 'Fewest formal charges' }
  const SCAFFOLD_NAMES: Record<Scaffold, string> = { full: 'Full structure', bonds: 'Bonds only', skeleton: 'Skeleton' }
  const SCAFFOLD_NOTES: Record<Scaffold, string> = {
    full: 'The whole structure, bonds and lone electrons.',
    bonds: 'The atoms and bonds, for students to add the lone electrons.',
    skeleton: 'The atoms in place, for students to add bonds and lone electrons.',
  }
  const ORDER_NAMES = ['None', 'Single', 'Double', 'Triple']

  const result = $derived(figureOf(s))
  const r = $derived(result.resolved)
  const found = $derived(r.ok ? r : undefined)
  const forms = $derived(found?.correct.length ?? 0)
  /** The settings as drawn: a changed structure is one structure in full. */
  const drawn = $derived(result.settings)
  const changeCount = $derived(result.changes.length + (result.centralChanged ? 1 : 0))
  const canChange = $derived(!!found && drawn.scaffold === 'full' && (drawn.resonance === 'one' || forms < 2))
  /** What's drawn and changed: the structure with the changes made. */
  const current = $derived(result.changed ? result.shown[0] : result.start)
  const centrals = $derived(found ? centralChoices(found) : [])
  const autoCentral = $derived(found?.central !== undefined ? found.formula.atoms[found.central] : '')
  /** An atom or ion on its own, with no bonds and no formal charges. */
  const alone = $derived(found?.formula.atoms.length === 1)
  const electronWord = $derived(alone ? 'valence electron' : 'lone electron')
  /** The ion a formula like N3- may have been meant as, since it's read as three N atoms. */
  const meant = $derived.by(() => {
    const parsed = parseFormula(s.formula)
    const ion = parsed.ok ? ionMeant(parsed.formula.tokens, parsed.formula.charge) : undefined
    return ion && parsed.ok ? { ...ion, read: formulaText(parsed.formula) } : undefined
  })

  /** "O 2" when there's more than one O, "S" when there's only one. */
  function atomName(i: number) {
    const atoms = current?.atoms ?? []
    const el = atoms[i]?.element ?? ''
    const same = atoms.filter((a) => a.element === el).length
    return same > 1 ? `${el} ${atoms.slice(0, i + 1).filter((a) => a.element === el).length}` : el
  }

  const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

  /** The question asked before clearing the changes, with what to do once
   *  they're cleared; null while no one is being asked. */
  let clearing = $state<{ message: string; then: () => void } | null>(null)

  /** Clears the changes and selection, then does `then`: something that
   *  starts from another structure. With changes, it asks first in a dialog,
   *  and nothing happens if the teacher would rather keep them. */
  function clearThen(then: () => void) {
    if (!changeCount) {
      reset()
      then()
    } else clearing = { message: `This clears your ${plural(changeCount, 'change')} to the structure.`, then }
  }

  function confirmClear() {
    const then = clearing!.then
    clearing = null
    reset()
    then()
  }

  function setFormula(e: Event & { currentTarget: HTMLInputElement }) {
    const formula = e.currentTarget.value
    // Put back until the teacher agrees to clear the changes.
    if (changeCount) e.currentTarget.value = s.formula
    clearThen(() => {
      s.formula = formula
      s.which = ''
      s.form = 1
    })
  }

  /** The listed structure drawn now, shown picked in the list. */
  const listedId = $derived(found?.listed?.id ?? '')

  function pickListed(e: Event & { currentTarget: HTMLSelectElement }) {
    const l = LISTED.find((x) => x.id === e.currentTarget.value)
    e.currentTarget.value = listedId
    if (!l) return
    clearThen(() => {
      s.formula = l.formula
      s.which = l.id
      s.form = 1
    })
  }

  /** Another central atom rebuilds the skeleton, so the other changes go. */
  function setCentral(e: Event & { currentTarget: HTMLSelectElement }) {
    const central = e.currentTarget.value === autoCentral ? '' : e.currentTarget.value
    const n = s.changes.length
    if (!n) {
      reset()
      s.central = central
      return
    }
    e.currentTarget.value = s.central || autoCentral
    clearing = { message: `This clears your other ${plural(n, 'change')} to the structure.`, then: () => (s.central = central) }
  }

  /** Selects an atom or bond and flashes it in the figure. */
  function highlight(selection: Selection) {
    selected = selection
    flash++
  }

  function change(c: Change) {
    if (!result.start) return
    s.changes = setChange(s.changes, c, result.start)
    if (c.kind === 'bond') highlight({ kind: 'bond', index: c.bond })
    else if (c.kind === 'lone' || c.kind === 'label') highlight({ kind: 'atom', index: c.atom })
  }

  function reset() {
    s.changes = []
    s.central = ''
    selected = null
  }

  async function select(selection: Selection) {
    highlight(selection)
    const details = changesBox?.closest('details')
    if (details) details.open = true
    await tick()
    const row = document.getElementById(`lewis-${selection.kind}-${selection.index}`)
    row?.scrollIntoView({ block: 'nearest' })
    row?.querySelector<HTMLElement>('button:not(:disabled), select')?.focus({ preventScroll: true })
  }

  const listedLabel = (id: string) => {
    const l = LISTED.find((x) => x.id === id)!
    const parsed = parseFormula(l.formula)
    return `${parsed.ok ? formulaText(parsed.formula) : l.formula}, ${l.names[0]}`
  }

  const structureSummary = $derived(found ? (found.listed ? `${found.name}, ${found.listed.names[0]}` : found.name) : 'No structure')
  const lookSummary = $derived(
    [SHAPE_NAMES[s.shape], s.bondStyle === 'dots' ? 'bonds as dots' : '', drawn.formalCharges ? 'formal charges' : '', found?.ruleMatters ? RULE_NAMES[s.rule].toLowerCase() : '', forms > 1 && drawn.resonance === 'all' ? 'all resonance structures' : '']
      .filter(Boolean)
      .join(', '),
  )
  const changesSummary = $derived(
    !result.changed ? 'Correct structure' : `${plural(changeCount, 'change')}, ${result.mistakes.length ? plural(result.mistakes.length, 'mistake') : 'still correct'}`,
  )
  /** Formal charges to pick from: the usual ones, and whatever the atom has now. */
  const chargeOptions = (now: number) => [...new Set([-4, -3, -2, -1, 0, 1, 2, 3, 4, now])].sort((a, b) => a - b)

  const keySummary = $derived(
    [s.titleMode === 'text' && s.title ? `“${s.title}”` : 'No title', s.answerKey && result.key.kind !== 'none' ? 'answer key' : 'no answer key'].join(', '),
  )
</script>

{#snippet segmented<T extends string>(name: string, options: readonly T[], value: T, names: Record<T, string>, set: (v: T) => void, disabled = false)}
  <div class="segmented" role="radiogroup" aria-label={name}>
    {#each options as option (option)}
      <button type="button" role="radio" aria-checked={value === option} class:on={value === option} {disabled} onclick={() => set(option)}>
        {names[option]}
      </button>
    {/each}
  </div>
{/snippet}

<GeneratorPage name="Lewis Structures" filename="lewis-structure" settingsWidth={27} {gen} {svg}>
  {#snippet settings()}
    <Section title="Structure" summary={structureSummary} icon={Atom} open>
      <label class="field">
        <span class="field-head">
          Formula or name
          <HelpTip id="formula-tip" label="How to type a formula">
            Type a formula like CH4, NO3- or SO4 2-, or one atom or ion like N or Ca 2+, with a space or ^ before a charge of 2 or more. You can
            also type a name from the list, like ethanol.
          </HelpTip>
        </span>
        <input type="text" maxlength={MAX_FORMULA} value={s.formula} oninput={setFormula} spellcheck="false" autocomplete="off" />
      </label>
      {#if !r.ok}
        <p class="warning" role="status">{r.message}</p>
        {#if r.request}
          <button type="button" class="btn-ghost small request" onclick={() => openRequest(`Lewis structure of ${s.formula}`)}>Request it</button>
        {/if}
      {:else if r.choices.length}
        <p class="field-label">Which one?</p>
        <div class="chips" role="radiogroup" aria-label="Which one">
          {#each r.choices as l (l.id)}
            <button
              type="button"
              role="radio"
              aria-checked={r.listed?.id === l.id}
              class="chip small"
              class:on={r.listed?.id === l.id}
              onclick={() => r.listed?.id !== l.id && clearThen(() => ((s.which = l.id), (s.form = 1)))}
            >
              {listedLabel(l.id)}
            </button>
          {/each}
        </div>
      {:else}
        <p class="note">
          {r.listed
            ? `From the list of structures with more than one central atom.`
            : !alone
              ? `Built around ${autoCentral} as the central atom.`
              : r.formula.charge < 0
                ? 'One ion, with the electrons it gains, in brackets with its charge.'
                : r.formula.charge > 0
                  ? 'One ion, without the electrons it loses, in brackets with its charge.'
                  : 'One atom, its valence electrons one to a side, then paired.'}
        </p>
      {/if}
      {#if meant}
        <p class="note">Read as {meant.read}. For the {meant.name} ion, type {meant.typed}.</p>
      {/if}
      <label class="field">
        <span class="field-head">Or pick from the list</span>
        <select onchange={pickListed} value={listedId}>
          <option value="">Molecules with more than one central atom…</option>
          {#each LISTED as l (l.id)}
            <option value={l.id}>{listedLabel(l.id)}</option>
          {/each}
        </select>
      </label>
    </Section>

    <Section title="Look" summary={lookSummary} icon={Eye}>
      <p class="field-label">Shape</p>
      {@render segmented('Shape', SHAPES, s.shape, SHAPE_NAMES, (v) => (s.shape = v))}
      <p class="note">{SHAPE_NOTES[s.shape]}</p>
      <p class="field-label spaced">Bonds</p>
      {@render segmented('Bonds', BOND_STYLES, s.bondStyle, BOND_STYLE_NAMES, (v) => (s.bondStyle = v))}
      <p class="note">{s.bondStyle === 'dots' ? 'Each shared pair as two dots between the atoms.' : 'Each shared pair as a line between the atoms.'}</p>
      <label class="check" class:off={alone}>
        <input type="checkbox" bind:checked={s.formalCharges} disabled={alone} />
        <span>
          <strong>Formal charges</strong>
          <small>{alone ? 'Not for one atom or ion: its charge is written after it.' : 'Label each atom whose formal charge isn’t 0.'}</small>
        </span>
      </label>
      {#if found?.ruleMatters}
        <p class="field-label spaced">
          Structure rule
          <HelpTip id="rule-tip" label="About the structure rule">
            Textbooks disagree about ions like SO₄²⁻. The octet rule gives every atom eight electrons, with formal charges where needed. Fewest formal
            charges lets atoms in period 3 and lower have more than eight, making double bonds until the formal charges are as small as they can be.
          </HelpTip>
        </p>
        {@render segmented('Structure rule', RULES, s.rule, RULE_NAMES, (v) => v !== s.rule && clearThen(() => ((s.rule = v), (s.form = 1))))}
      {/if}
      {#if forms > 1}
        <p class="field-label spaced">Resonance structures</p>
        {@render segmented('Resonance structures', ['one', 'all'] as const, drawn.resonance, { one: 'Show one', all: `Show all ${forms}` }, (v) => {
          if (v !== drawn.resonance) clearThen(() => (s.resonance = v))
        })}
        {#if drawn.resonance === 'one'}
          <div class="chips forms" role="radiogroup" aria-label="Which resonance structure">
            {#each Array.from({ length: forms }, (_, i) => i + 1) as n (n)}
              <button
                type="button"
                role="radio"
                aria-checked={Math.min(s.form, forms) === n}
                aria-label="Resonance structure {n}"
                class="chip small"
                class:on={Math.min(s.form, forms) === n}
                onclick={() => n !== s.form && clearThen(() => (s.form = n))}
              >
                {n}
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </Section>

    <Section title="Question" summary={SCAFFOLD_NAMES[drawn.scaffold]} icon={SquareDashed}>
      <p class="field-label">Give students</p>
      <div class="chips" role="radiogroup" aria-label="Give students">
        {#each SCAFFOLDS as scaffold (scaffold)}
          <button
            type="button"
            role="radio"
            aria-checked={drawn.scaffold === scaffold}
            class="chip small"
            class:on={drawn.scaffold === scaffold}
            disabled={(result.changed && scaffold !== 'full') || (alone && scaffold === 'bonds')}
            onclick={() => (s.scaffold = scaffold)}
          >
            {SCAFFOLD_NAMES[scaffold]}
          </button>
        {/each}
      </div>
      <p class="note">
        {result.changed
          ? 'A changed structure is always drawn in full. Reset it to make a “complete this” question.'
          : alone && drawn.scaffold === 'skeleton'
            ? 'The symbol alone, for students to add the electrons.'
            : SCAFFOLD_NOTES[drawn.scaffold]}
      </p>
    </Section>

    <Section title="Changes" summary={changesSummary} icon={PencilLine}>
      <div bind:this={changesBox}>
        {#if !found}
          <p class="note">Type a formula first.</p>
        {:else if drawn.scaffold !== 'full'}
          <p class="note">Changes need the full structure. Set Question to Full structure to make a “find the mistake” question.</p>
        {:else if !canChange}
          <p class="note">Changes need one structure. Show one resonance structure to change it.</p>
        {:else}
          <p class="note">Make a wrong structure for a “find the mistake” question. Click an atom or bond in the figure, or change one below.</p>

          {#if centrals.length}
            <label class="inline">
              <span>Central atom</span>
              <select value={s.central || autoCentral} onchange={setCentral}>
                <option value={autoCentral}>{autoCentral} (correct)</option>
                {#each centrals as c (c)}<option value={c}>{c}</option>{/each}
              </select>
            </label>
          {/if}

          {#if current}
            <p class="part">Atoms</p>
            {#each current.atoms as atom, i (i)}
              <div
                class="row"
                class:selected={selected?.kind === 'atom' && selected.index === i}
                id="lewis-atom-{i}"
                role="group"
                aria-label={atomName(i)}
                onfocusin={() => highlight({ kind: 'atom', index: i })}
              >
                <strong>{atomName(i)}</strong>
                <span class="stepper">
                  <button type="button" class="icon-btn" aria-label="Fewer {electronWord}s on {atomName(i)}" disabled={atom.lone <= 0} onclick={() => change({ kind: 'lone', atom: i, lone: atom.lone - 1 })}>
                    <Minus size={16} />
                  </button>
                  <span class="count" aria-live="polite">{plural(atom.lone, electronWord)}</span>
                  <button type="button" class="icon-btn" aria-label="More {electronWord}s on {atomName(i)}" disabled={atom.lone >= MAX_LONE} onclick={() => change({ kind: 'lone', atom: i, lone: atom.lone + 1 })}>
                    <Plus size={16} />
                  </button>
                </span>
                {#if drawn.formalCharges}
                  <label class="inline small-label">
                    <span>Formal charge</span>
                    <select value={String(shownFormalCharge(current, i))} onchange={(e) => change({ kind: 'label', atom: i, label: Number(e.currentTarget.value) })}>
                      {#each chargeOptions(shownFormalCharge(current, i)) as n (n)}<option value={String(n)}>{n ? signed(n) : 'None'}</option>{/each}
                    </select>
                  </label>
                {/if}
              </div>
            {/each}

            {#if current.bonds.length}<p class="part">Bonds</p>{/if}
            {#each current.bonds as bond, k (k)}
              <div
                class="row"
                class:selected={selected?.kind === 'bond' && selected.index === k}
                id="lewis-bond-{k}"
                role="group"
                aria-label="Bond {atomName(bond.a)} to {atomName(bond.b)}"
                onfocusin={() => highlight({ kind: 'bond', index: k })}
              >
                <strong>{atomName(bond.a)}–{atomName(bond.b)}</strong>
                <div class="segmented orders" role="radiogroup" aria-label="Bond {atomName(bond.a)} to {atomName(bond.b)}">
                  {#each ORDER_NAMES as name, order (order)}
                    <button type="button" role="radio" aria-checked={bond.order === order} class:on={bond.order === order} onclick={() => change({ kind: 'bond', bond: k, order })}>
                      {name}
                    </button>
                  {/each}
                </div>
              </div>
            {/each}

            {#if current.charge !== 0}
              <p class="part">Ion</p>
              <label class="check">
                <input type="checkbox" checked={hasBrackets(current)} onchange={(e) => change({ kind: 'brackets', on: e.currentTarget.checked })} />
                <span><strong>Brackets</strong><small>An ion’s structure goes in square brackets.</small></span>
              </label>
              <label class="inline">
                <span>Charge written</span>
                <select value={String(shownCharge(current))} onchange={(e) => change({ kind: 'charge', label: Number(e.currentTarget.value) })}>
                  {#each [-4, -3, -2, -1, 0, 1, 2, 3, 4] as n (n)}<option value={String(n)}>{n ? chargeText(n) : 'None'}</option>{/each}
                </select>
              </label>
            {/if}
          {/if}

          <!-- Under the changes so that the controls stay put as mistakes come and go. -->
          {#if result.changed}
            <div class="status" class:after={!!current}>
              <span>{plural(changeCount, 'change')} from the correct structure</span>
              <button type="button" class="btn-ghost small" onclick={reset}><RotateCcw size={16} aria-hidden="true" /> Reset to correct</button>
            </div>
            {#if result.mistakes.length}
              <ul class="mistakes" aria-label="Mistakes">
                {#each result.mistakes as m, i (i)}<li>{m}</li>{/each}
              </ul>
            {:else}
              <p class="note good" role="status">The structure is still correct.</p>
            {/if}
          {/if}
        {/if}
      </div>
    </Section>

    <Section title="Title and answer key" summary={keySummary} icon={Type}>
      <p class="field-label">Chart title</p>
      <LabelField name="Chart title" bind:mode={s.titleMode} bind:text={s.title} placeholder="e.g. Draw the Lewis structure" blank={false} />
      <label class="check" class:off={!result.changed && drawn.scaffold === 'full'}>
        <input type="checkbox" bind:checked={s.answerKey} disabled={!result.changed && drawn.scaffold === 'full'} />
        <span>
          <strong><KeyRound size={15} aria-hidden="true" /> Answer key</strong>
          <small>
            {result.changed
              ? 'List the structure’s mistakes under the figure.'
              : drawn.scaffold !== 'full'
                ? 'Draw the full structure under the figure.'
                : 'Choose a question or change the structure to add an answer key.'}
          </small>
        </span>
      </label>
    </Section>
  {/snippet}
  {#snippet figure()}
    <LewisFigure figure={result} bind:svg {selected} {flash} onselect={canChange ? select : undefined} />
  {/snippet}
</GeneratorPage>

{#if clearing}
  <Modal title="Clear your changes?" onclose={() => (clearing = null)}>
    <p>{clearing.message}</p>
    <div class="actions">
      <button type="button" class="btn-ghost" data-autofocus onclick={() => (clearing = null)}>Keep changes</button>
      <button type="button" class="btn-primary" onclick={confirmClear}>Clear changes</button>
    </div>
  </Modal>
{/if}

<style>
  .field { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.35rem; font-size: 0.9rem; font-weight: 700; }
  .field + .field, .note + .field, .chips + .field, .request + .field { margin-top: 1rem; }
  .field input, .field select { font-weight: 400; }
  .field-head, .field-label { display: flex; align-items: center; gap: 0.25rem; }
  .field-label { margin: 0.9rem 0 0.45rem; font-weight: 700; font-size: 0.9rem; }
  .field-label:first-child { margin-top: 0; }
  .spaced { margin-top: 1.1rem; }
  .note { margin: 0.5rem 0 0; color: var(--muted); font-size: 0.82rem; }
  .note.good { color: #166534; }
  .warning { margin: 0.75rem 0 0; padding: 0.55rem 0.75rem; border-radius: 10px; background: var(--red-soft); color: #991b1b; font-size: 0.85rem; }
  .request { margin-top: 0.6rem; }
  .small { padding: 0.5rem 0.85rem; font-size: 0.9rem; }
  .chip.small { padding: 0.35rem 0.75rem; font-size: 0.86rem; }
  .chip:disabled { opacity: 0.45; cursor: default; }
  .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .forms { margin-top: 0.6rem; }
  .check { display: flex; align-items: flex-start; gap: 0.6rem; margin-top: 1rem; cursor: pointer; }
  .check.off { cursor: default; opacity: 0.6; }
  .check input { width: 1.1rem; height: 1.1rem; margin: 0.15rem 0 0; accent-color: var(--blue); }
  .check span { display: flex; flex-direction: column; }
  .check strong { display: flex; align-items: center; gap: 0.3rem; font-size: 0.9rem; }
  .check small { color: var(--muted); font-size: 0.82rem; }
  .actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
  .status.after { margin-top: 1.1rem; padding-top: 0.9rem; border-top: 1.5px solid var(--border); }
  .status { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; font-weight: 700; font-size: 0.9rem; }
  .mistakes { margin: 0.6rem 0 0; padding: 0.55rem 0.75rem 0.55rem 1.6rem; border-radius: 10px; background: var(--red-soft); color: #991b1b; font-size: 0.84rem; }
  .mistakes li + li { margin-top: 0.25rem; }
  .part { margin: 1.1rem 0 0.2rem; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted); }
  .row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem 0.75rem; padding: 0.45rem 0.5rem; margin: 0 -0.5rem; border-radius: 9px; scroll-margin: 1rem; }
  .row.selected { background: var(--blue-soft); }
  .row strong { min-width: 4.2rem; font-size: 0.9rem; }
  .stepper { display: inline-flex; align-items: center; gap: 0.2rem; }
  .count { min-width: 7.2rem; text-align: center; font-size: 0.85rem; font-variant-numeric: tabular-nums; }
  .orders { flex: 1; min-width: 15rem; }
  .orders button { font-size: 0.82rem; padding-inline: 0.4rem; }
  .inline { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.9rem; font-size: 0.9rem; font-weight: 700; }
  .inline select { width: auto; font-weight: 400; }
  .small-label { margin-top: 0; font-size: 0.84rem; font-weight: 400; color: var(--muted); }
</style>
