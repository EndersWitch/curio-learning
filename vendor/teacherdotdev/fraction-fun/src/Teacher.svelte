<script lang="ts">
  import BrandBox from './components/BrandBox.svelte'
  import Donut, { type LandedSprinkle } from './components/Donut.svelte'
  import SiteChrome from './components/SiteChrome.svelte'
  import { dealTo } from './lib/donut'
  import { ITEM_WORDS, ITEMS, itemFromParams, type Item } from './lib/items'
  import {
    answerOf,
    MAX_DENOMINATOR,
    MAX_WHOLE,
    MIN_DENOMINATOR,
    modeFromParams,
    problemFromParams,
    problemIssues,
    problemQuery,
    shareOf,
    type Mode,
    type Problem,
    type ProblemField,
  } from './lib/problem'

  // Opened from a student link (the settings button), the form starts on that problem,
  // and Back returns to it.
  const params = new URLSearchParams(location.search)
  const backTo = `/${location.search}`
  const start = problemFromParams(params)

  let numerator = $state<number | null>(start.numerator)
  let denominator = $state<number | null>(start.denominator)
  let whole = $state<number | null>(start.whole)
  let item = $state<Item>(itemFromParams(params))
  let mode = $state<Mode>(modeFromParams(params))
  let copied = $state(false)
  let copyTimer = 0
  let linkField: HTMLInputElement | undefined = $state()

  const problem: Problem = $derived({
    numerator: numerator ?? NaN,
    denominator: denominator ?? NaN,
    whole: whole ?? NaN,
  })
  const issues = $derived(problemIssues(problem))
  const issueFor = (field: ProblemField) => issues.find((issue) => issue.field === field)
  const valid = $derived(issues.length === 0)
  const link = $derived(`${location.origin}${import.meta.env.BASE_URL}?${problemQuery(problem, { item, mode })}`)

  function valueOf(field: ProblemField): number | null {
    return field === 'numerator' ? numerator : field === 'denominator' ? denominator : whole
  }

  function set(field: ProblemField, value: number | null) {
    copied = false
    if (field === 'numerator') numerator = value
    else if (field === 'denominator') denominator = value
    else whole = value
  }

  function onInput(field: ProblemField, event: Event) {
    const text = (event.currentTarget as HTMLInputElement).value
    set(field, text === '' ? null : Number(text))
  }

  async function copy() {
    if (!valid) return
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // Older browsers or no permission: select the link so Ctrl/Cmd+C works.
      linkField?.select()
      document.execCommand?.('copy')
    }
    copied = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied = false), 2500)
  }

  function open() {
    if (valid) window.open(link, '_blank', 'noopener')
  }

  const words = $derived(ITEM_WORDS[item])

  // The preview: the item cut and shared as students will see it, with the kept groups in colour.
  const COLORS = ['#ff4d4d', '#ffb020', '#ffe14d', '#2fbf71', '#3d8bff', '#9b5cff']
  const toppings: LandedSprinkle[] = $derived(
    valid
      ? Array.from({ length: problem.whole }, (_, n) => ({
          id: n,
          deal: n,
          ...dealTo(n, problem.denominator),
          color: COLORS[(n * 5) % COLORS.length],
          rotation: (n * 53) % 180,
        }))
      : [],
  )
  // A few toppings on each thumbnail, so a pizza reads as pepperoni pizza.
  const sample: LandedSprinkle[] = Array.from({ length: 8 }, (_, n) => ({
    id: n,
    deal: n,
    group: 0,
    slot: n,
    color: COLORS[(n * 5) % COLORS.length],
    rotation: (n * 53) % 180,
  }))
  const notKept = $derived(
    new Set(Array.from({ length: valid ? problem.denominator : 0 }, (_, g) => g).filter((g) => g >= problem.numerator)),
  )
</script>

<svelte:head>
  <title>Teacher setup · Fraction Fun</title>
</svelte:head>

<div class="teacher">
  <div class="page">
  <BrandBox href={backTo} scrolls />

  <main>
    <header>
      <a class="back" href={backTo}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        Back
      </a>
      <h1>Teacher setup</h1>
      <p class="lede">Choose a problem, then share the link with your students. Each link is one problem.</p>
    </header>

    <div class="columns">
    <section class="card" aria-labelledby="problem-heading">
      <h2 id="problem-heading" class="sr-only">Problem</h2>

      <fieldset class="choice">
        <legend>Item</legend>
        <div class="items">
          {#each ITEMS as it (it)}
            <label class="item" class:on={item === it}>
              <input type="radio" bind:group={item} value={it} onchange={() => (copied = false)} />
              <span class="thumb"><Donut item={it} groups={1} chopped sprinkles={sample} /></span>
              {ITEM_WORDS[it].label}
            </label>
          {/each}
        </div>
      </fieldset>

      <div class="choice">
        <span class="legend" id="sentence-label">Problem</span>
        <p class="sentence" role="group" aria-labelledby="sentence-label">
          <span>What is</span>
          <span class="frac">
            {@render number('numerator', 'Numerator', 1, 11)}
            <span class="bar" aria-hidden="true"></span>
            {@render number('denominator', 'Denominator', 2, 12)}
          </span>
          <span>of</span>
          {@render number('whole', 'Whole', 1, 48)}
          <span>?</span>
        </p>
        <p class="help">
          Denominator {MIN_DENOMINATOR}–{MAX_DENOMINATOR}. The whole is at most {MAX_WHOLE} and must split evenly
          into the groups.
        </p>
        <div class="issues" aria-live="polite">
          {#each issues as issue (issue.field + issue.message)}
            <p class="issue">
              {issue.message}
              {#if issue.suggestions?.length}
                Try
                {#each issue.suggestions as suggestion, i (suggestion)}
                  {#if i > 0}{' or '}{/if}<button type="button" class="suggestion" onclick={() => set('whole', suggestion)}>{suggestion}</button>
                {/each}
              {/if}
            </p>
          {/each}
        </div>
      </div>

      <fieldset class="choice">
        <legend>Mode</legend>
        <div class="modes">
          <label class="mode" class:on={mode === 'interactive'}>
            <input type="radio" bind:group={mode} value="interactive" onchange={() => (copied = false)} />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.9-2.6L4.3 15.3a1.6 1.6 0 0 1 2.5-2L9 15.5" />
            </svg>
            <span><strong>Interactive</strong>Students do each step</span>
          </label>
          <label class="mode" class:on={mode === 'watch'}>
            <input type="radio" bind:group={mode} value="watch" onchange={() => (copied = false)} />
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" /><path d="M10 8.5v7l6-3.5z" class="fill" /></svg>
            <span><strong>Watch</strong>Each press plays a step</span>
          </label>
        </div>
      </fieldset>
    </section>

    <section class="preview" class:stale={!valid} aria-labelledby="preview-heading">
      <h2 id="preview-heading" class="sr-only">Students see</h2>
      <div class="art">
        {#if valid}
          <Donut {item} groups={problem.denominator} chopped sprinkles={toppings} greyed={notKept} />
        {:else}
          <Donut {item} groups={1} chopped={false} />
        {/if}
      </div>
      <p class="question" aria-label={`What is ${numerator ?? '?'} over ${denominator ?? '?'} of ${whole ?? '?'}?`}>
        <span>What is</span>
        <span class="fraction" aria-hidden="true">
          <span>{numerator ?? '?'}</span>
          <span class="bar"></span>
          <span>{denominator ?? '?'}</span>
        </span>
        <span>of {whole ?? '?'}?</span>
      </p>
      {#if valid}
        <p class="working">
          {problem.denominator} equal groups of {shareOf(problem)} {shareOf(problem) === 1 ? words.topping : words.toppings};
          keep {problem.numerator}. Answer: <strong>{answerOf(problem)}</strong>
        </p>
      {:else}
        <p class="working">Fix the problem to get a link.</p>
      {/if}

      <div class="card share">
      <label class="link-label" for="link">Student link</label>
      <input
        id="link"
        class="link"
        bind:this={linkField}
        readonly
        value={valid ? link : ''}
        placeholder="No link yet"
        onfocus={(event) => event.currentTarget.select()}
      />
      <div class="actions">
        <button type="button" class="primary" disabled={!valid} onclick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
        <button type="button" class="secondary" disabled={!valid} onclick={open}>Open</button>
      </div>
      </div>
    </section>
    </div>
  </main>
  <SiteChrome scrolls />
  </div>
</div>

{#snippet number(field: ProblemField, name: string, min: number, max: number)}
  {@const issue = issueFor(field)}
  <input
    class="num"
    class:invalid={issue}
    type="number"
    inputmode="numeric"
    {min}
    {max}
    step="1"
    aria-label={name}
    value={valueOf(field) ?? ''}
    oninput={(event) => onInput(field, event)}
    aria-invalid={issue ? 'true' : undefined}
  />
{/snippet}

<style>
  .teacher {
    height: 100dvh;
    overflow-y: auto;
    user-select: text;
    -webkit-user-select: text;
  }

  /* The corner buttons sit on this, so they scroll with the page. */
  .page {
    position: relative;
    min-height: 100%;
  }

  main {
    max-width: 1040px;
    margin: 0 auto;
    padding: 96px 20px 72px;
    display: grid;
    gap: 20px;
  }

  header {
    display: grid;
    gap: 6px;
  }

  .back {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: -6px;
    padding: 4px 10px 4px 4px;
    border-radius: 999px;
    color: var(--go);
    font: 700 18px/1.2 var(--font);
    text-decoration: none;
  }

  .back svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .back:hover {
    background: #1f7ae014;
  }

  h1 {
    margin: 0;
    font: 700 clamp(30px, 6vw, 40px) / 1.1 var(--font);
  }

  .lede {
    margin: 0;
    color: var(--ink-soft);
    font: 400 18px/1.4 var(--font-text);
  }

  .columns {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 20px;
    align-items: start;
  }

  .card {
    display: grid;
    gap: 22px;
    padding: 22px;
    border-radius: 24px;
    background: #fff;
    box-shadow: 0 6px 24px #2b2b3a1a;
  }

  .preview {
    position: sticky;
    top: 20px;
    display: grid;
    gap: 14px;
    padding-top: 22px;
  }

  .share {
    gap: 12px;
    padding: 18px;
  }

  h2 {
    margin: 0;
    font: 700 22px/1.2 var(--font);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .choice {
    margin: 0;
    padding: 0;
    border: none;
    display: grid;
    gap: 10px;
  }

  legend,
  .legend,
  .link-label {
    padding: 0;
    margin-bottom: 10px;
    font: 700 18px/1.2 var(--font);
  }

  .legend {
    margin-bottom: 0;
  }

  /* Radios are visually replaced by the cards around them. */
  .choice input[type='radio'] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }

  .item,
  .mode {
    border: 2px solid #2b2b3a1a;
    border-radius: 18px;
    background: #fff;
    color: var(--ink-soft);
    cursor: pointer;
    transition:
      border-color 0.15s,
      background-color 0.15s,
      transform 0.15s;
  }

  .item {
    display: grid;
    justify-items: center;
    gap: 6px;
    padding: 10px 6px 10px;
    font: 700 16px/1.2 var(--font);
  }

  .thumb {
    width: 64px;
    height: 64px;
    pointer-events: none;
  }

  .item:hover,
  .mode:hover {
    border-color: #2b2b3a40;
  }

  .item.on,
  .mode.on {
    border-color: var(--go);
    background: #1f7ae00f;
    color: var(--ink);
  }

  .item:has(input:focus-visible),
  .mode:has(input:focus-visible) {
    outline: 3px solid #ffd23f;
    outline-offset: 2px;
  }

  /* The problem written the way students see it, with each number editable. */
  .sentence {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    font: 700 34px/1 var(--font);
  }

  .frac {
    display: inline-grid;
    justify-items: center;
    gap: 6px;
  }

  .frac .bar {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--ink);
  }

  .num {
    width: 76px;
    height: 56px;
    border: 2px dashed #2b2b3a40;
    border-radius: 14px;
    background: var(--bg);
    text-align: center;
    color: var(--ink);
    font: 700 30px/1 var(--font);
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .frac .num {
    width: 68px;
    height: 48px;
    font-size: 26px;
  }

  .num::-webkit-inner-spin-button,
  .num::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .num:hover {
    border-color: #2b2b3a80;
  }

  .num:focus {
    outline: none;
    border-style: solid;
    border-color: var(--go);
    background: #fff;
  }

  .num.invalid {
    border-style: solid;
    border-color: #d9363e;
    background: #fff4f4;
  }

  .help {
    margin: 0;
    color: var(--ink-soft);
    font: 400 15px/1.4 var(--font-text);
  }

  .issues {
    display: grid;
    gap: 8px;
  }

  .issues:empty {
    display: none;
  }

  .issue {
    margin: 0;
    padding: 10px 14px;
    border-radius: 14px;
    background: #fff1d6;
    color: var(--ink);
    font: 400 16px/1.5 var(--font-text);
  }

  .suggestion {
    padding: 2px 12px;
    margin: 0 2px;
    border: 2px solid var(--go);
    border-radius: 999px;
    background: #fff;
    color: var(--go);
    font: 700 16px/1.3 var(--font);
    cursor: pointer;
  }

  .suggestion:hover {
    background: var(--go);
    color: #fff;
  }

  .modes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .mode {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
  }

  .mode svg {
    flex: none;
    width: 30px;
    height: 30px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .mode .fill {
    fill: currentColor;
  }

  .mode.on svg {
    color: var(--go);
  }

  .mode span {
    display: grid;
    gap: 2px;
    font: 400 14px/1.3 var(--font-text);
  }

  .mode strong {
    color: var(--ink);
    font: 700 17px/1.2 var(--font);
  }

  .art {
    width: min(100%, 220px);
    aspect-ratio: 1;
    justify-self: center;
    transition: opacity 0.2s;
  }

  .question {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.3em;
    font: 700 34px/1.15 var(--font);
    transition: opacity 0.2s;
  }

  .fraction {
    display: inline-grid;
    justify-items: center;
    font-size: 0.6em;
    line-height: 1;
  }

  .fraction .bar {
    width: 100%;
    min-width: 0.9em;
    height: 0.1em;
    margin: 0.06em 0;
    background: currentColor;
  }

  .stale .question,
  .stale .art {
    opacity: 0.4;
  }

  .working {
    margin: 0;
    text-align: center;
    color: var(--ink-soft);
    font: 400 16px/1.4 var(--font-text);
  }

  .working strong {
    color: var(--accent);
  }

  .link-label {
    margin: 0;
    font-size: 16px;
  }

  .link {
    width: 100%;
    padding: 12px 14px;
    border: 2px solid #2b2b3a26;
    border-radius: 14px;
    background: var(--bg);
    color: var(--ink);
    font: 400 15px/1.3 var(--font-text);
  }

  .link:focus {
    outline: 3px solid #ffd23f;
    outline-offset: 1px;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .actions button {
    flex: 1;
    padding: 12px 20px;
    border-radius: 999px;
    font: 700 20px/1 var(--font);
    cursor: pointer;
    touch-action: manipulation;
  }

  .primary {
    border: none;
    background: var(--go);
    color: #fff;
    box-shadow: 0 4px 0 #00000033;
  }

  .primary:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #00000033;
  }

  .secondary {
    border: 2px solid var(--ink);
    background: #fff;
    color: var(--ink);
  }

  .actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  /* One column: the preview follows the form. */
  @media (max-width: 860px) {
    .columns {
      grid-template-columns: minmax(0, 1fr);
    }

    .preview {
      position: static;
    }
  }

  @media (max-width: 520px) {
    main {
      padding-inline: 14px;
    }

    .card {
      padding: 16px;
    }

    .sentence {
      font-size: 28px;
      gap: 8px;
    }

    .num {
      width: 64px;
    }

    .modes {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .question,
    .art,
    .item,
    .mode {
      transition: none;
    }
  }
</style>
