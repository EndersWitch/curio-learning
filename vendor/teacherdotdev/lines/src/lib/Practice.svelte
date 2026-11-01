<script>
  // The student's page. Settings come straight from the link; the drill runs
  // entirely on this device and ends with a report the teacher can read.
  import { onDestroy, tick } from 'svelte'
  import NumberLine from './NumberLine.svelte'
  import { STEPS, explainRounding, fmt, randomProblem, sameNumber, stepAnswer, stepHint, stepQuestion } from './rounding.js'
  import { describeSettings } from './settings.js'

  let { settings } = $props()

  const guided = $derived(settings.mode === 'guided')
  const stepIds = $derived(
    guided
      ? STEPS.filter((s) => settings.plot || s.id !== 'plot').map((s) => s.id)
      : settings.plot ? ['plot', 'round'] : ['round'],
  )

  const newProblem = (avoid = null) => randomProblem(settings, avoid)

  let phase = $state('ready') // ready | running | done
  let problem = $state(newProblem())
  let index = $state(0) // which question, 0-based
  let stepIndex = $state(0)
  let input = $state('')
  let feedback = $state(null) // { ok, msg }
  let locked = $state(false) // waiting for the student to press continue
  let misses = $state([]) // wrong answers on the current question
  let wrongTries = $state(0) // on the current step, for the "show me" button
  let results = $state([])
  let startTime = 0
  let elapsedMs = $state(0)
  let ticker = null
  let inputEl = $state(null)
  let continueEl = $state(null)
  let selectedPlot = $state(null)

  const step = $derived(stepIds[stepIndex])
  const stepInfo = $derived(STEPS.find((s) => s.id === step))
  const plotStepIndex = $derived(stepIds.indexOf('plot'))
  const showTargetPoint = $derived(!settings.plot || stepIndex > plotStepIndex || (step === 'plot' && locked))
  const done = $derived(results.length)
  const correct = $derived(results.filter((r) => r.misses.length === 0).length)
  const revealed = $derived(step === 'round' && locked)

  function start() {
    results = []
    index = 0
    elapsedMs = 0
    startTime = Date.now()
    clearInterval(ticker)
    ticker = setInterval(() => (elapsedMs = Date.now() - startTime), 500)
    phase = 'running'
    loadQuestion(newProblem())
  }

  function loadQuestion(p) {
    problem = p
    stepIndex = 0
    misses = []
    selectedPlot = null
    resetStep()
  }

  function resetStep() {
    input = ''
    feedback = null
    locked = false
    wrongTries = 0
    focusInput()
  }

  async function focusInput() {
    await tick()
    inputEl?.focus()
  }
  async function focusContinue() {
    await tick()
    continueEl?.focus()
  }

  function answer(guess) {
    if (locked) return
    const want = stepAnswer(step, problem)
    if (sameNumber(guess, want)) {
      feedback = {
        ok: true,
        msg: step === 'round'
          ? `Correct! ${explainRounding(problem)}`
          : step === 'plot'
            ? `Yes — ${fmt(problem.n)} belongs ${problem.halfway ? 'at' : problem.n > problem.mid ? 'after' : 'before'} the midpoint (${fmt(problem.mid)}).`
            : `Yes — the ${stepInfo.label} is ${fmt(want)}.`,
      }
      if (step === 'round') {
        locked = true
        focusContinue()
      } else {
        stepIndex += 1
        input = ''
        wrongTries = 0
        if (step === 'plot') selectedPlot = null
        focusInput()
      }
      return
    }

    misses = [...misses, { step, gave: guess, want }]
    wrongTries += 1
    if (settings.retry && step !== 'round') {
      feedback = { ok: false, msg: `Not quite. ${stepHint(step, problem)}` }
      input = ''
      focusInput()
      return
    }
    // One try per step: show the answer and let the student move on when ready.
    feedback = {
      ok: false,
      msg: step === 'round'
        ? `Not quite. ${explainRounding(problem)}`
        : step === 'plot'
          ? `Not quite. The red point shows where ${fmt(problem.n)} belongs. ${stepHint(step, problem)}`
          : `Not quite — the ${stepInfo.label} is ${fmt(want)}. ${stepHint(step, problem)}`,
    }
    locked = true
    focusContinue()
  }

  function submitInput() {
    if (input === '' || input === null) return
    answer(Number(input))
  }

  function showMe() {
    input = String(stepAnswer(step, problem))
    focusInput()
  }

  function plotAt(value) {
    if (locked || step !== 'plot') return
    selectedPlot = value
    answer(value)
  }

  // After a reveal: move to the next step, or wrap the question up.
  function proceed() {
    if (step !== 'round') {
      stepIndex += 1
      selectedPlot = null
      resetStep()
      return
    }
    results = [...results, { ...problem, misses }]
    index += 1
    if (index >= settings.count) {
      finish()
      return
    }
    loadQuestion(newProblem(problem.n))
  }

  function finish() {
    clearInterval(ticker)
    elapsedMs = Date.now() - startTime
    phase = 'done'
  }

  onDestroy(() => clearInterval(ticker))

  // --- the report ---
  const missedByStep = $derived(
    STEPS.map((s) => ({ ...s, count: results.reduce((sum, r) => sum + r.misses.filter((m) => m.step === s.id).length, 0) }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count),
  )
  const percent = $derived(results.length ? Math.round((100 * correct) / results.length) : 0)

  function formatTime(ms) {
    const total = Math.round(ms / 1000)
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
  }
  function stepName(id) {
    return STEPS.find((s) => s.id === id).label
  }
</script>

<div class="practice">
  {#if phase === 'ready'}
    <div class="gate card">
      <h1>Rounding on a Number Line</h1>
      <p class="gate-sub">{describeSettings(settings)}</p>
      <div class="linewrap">
        <NumberLine n={problem.n} start={problem.start} end={problem.end} mid={problem.mid}
          labels={settings.labels} muted />
      </div>
      <p class="gate-help">
        {#if guided}
          For each number you'll find the <b>starting point</b>, the <b>end point</b> and the
          <b>midpoint</b>{settings.plot ? ', plot the number,' : ''} then decide which way it rounds.
        {:else if settings.plot}
          For each number, plot it on the line, compare it with the <b>midpoint</b>, and decide which way it rounds.
        {:else}
          For each number, look at where it sits on the line and decide which way it rounds.
        {/if}
      </p>
      <button type="button" class="btn-primary btn-big" onclick={start}>Start</button>
    </div>
  {:else if phase === 'running'}
    <div class="statusbar">
      <span class="progress">Question <b>{index + 1}</b> of {settings.count}</span>
      <span class="score"><b>{correct}</b>/{done} correct</span>
      <span class="clock">{formatTime(elapsedMs)}</span>
    </div>

    <div class="question card">
      <h2>Round <span class="big">{fmt(problem.n)}</span> to the nearest {fmt(problem.unit)}</h2>

      <NumberLine n={problem.n} start={problem.start} end={problem.end} mid={problem.mid}
        labels={settings.labels}
        showStart={stepIndex > 0 || !guided} showEnd={stepIndex > 1 || !guided} showMid={stepIndex > 2 || !guided}
        showPoint={showTargetPoint} interactive={step === 'plot' && !locked} plotValue={selectedPlot} onplot={plotAt}
        highlight={revealed ? problem.answer : null} />

      {#if guided}
        <ol class="steps" aria-label="Steps">
          {#each STEPS.filter((s) => stepIds.includes(s.id)) as s, i (s.id)}
            <li class:done={i < stepIndex} class:current={i === stepIndex}>{s.label}</li>
          {/each}
        </ol>
      {/if}

      <p class="prompt">{stepQuestion(step, problem)}</p>

      {#if step === 'plot'}
        <p class="plot-help">Tap or click a tick mark to place your point.</p>
      {:else if step === 'round'}
        <div class="choices">
          <button type="button" class="choice down" disabled={locked} onclick={() => answer(problem.start)}>
            ⬇ Round down to {fmt(problem.start)}
          </button>
          <button type="button" class="choice up" disabled={locked} onclick={() => answer(problem.end)}>
            ⬆ Round up to {fmt(problem.end)}
          </button>
        </div>
      {:else}
        <form class="answer" onsubmit={(e) => { e.preventDefault(); submitInput() }}>
          <input type="number" inputmode="decimal" step="any" bind:this={inputEl} bind:value={input} disabled={locked} aria-label="Your answer" />
          <button type="submit" class="btn-primary" disabled={locked}>Check</button>
          {#if settings.retry && wrongTries >= 2}
            <button type="button" class="btn-ghost" onclick={showMe}>Show me</button>
          {/if}
        </form>
      {/if}

      {#if feedback}
        <p class="feedback" class:ok={feedback.ok} class:bad={!feedback.ok}>{feedback.msg}</p>
      {/if}

      {#if locked}
        <button type="button" class="btn-primary continue" bind:this={continueEl} onclick={proceed}>
          {step === 'round' ? (index + 1 >= settings.count ? 'See results' : 'Next question →') : 'Got it →'}
        </button>
      {/if}
    </div>
  {:else}
    <div class="results card">
      <h2>{percent === 100 ? 'Perfect score! 🎉' : 'Practice complete'}</h2>
      <p class="bigscore">{correct}<span class="of">/{results.length}</span></p>
      <p class="detail">{percent}% correct · {formatTime(elapsedMs)}</p>

      <section class="report">
        <h3>Report</h3>
        <p class="summary">{describeSettings(settings)}</p>

        {#if missedByStep.length}
          <p class="focus">
            Most missed:
            {#each missedByStep as s, i (s.id)}
              <span class="pill">{s.label} ×{s.count}</span>
            {/each}
          </p>
        {:else}
          <p class="clean">Nothing missed — every answer was right the first time.</p>
        {/if}

        <table>
          <thead>
            <tr><th>#</th><th>Number</th><th>Nearest</th><th>Answer</th><th>Result</th></tr>
          </thead>
          <tbody>
            {#each results as r, i (i)}
              <tr class:missed={r.misses.length}>
                <td>{i + 1}</td>
                <td>{fmt(r.n)}</td>
                <td>{fmt(r.unit)}</td>
                <td>{fmt(r.answer)}</td>
                <td>
                  {#if r.misses.length === 0}
                    <span class="ok">✓</span>
                  {:else}
                    {#each r.misses as m, j (j)}
                      <span class="miss">✗ {stepName(m.step)}: said {fmt(m.gave)}, was {fmt(m.want)}</span>
                    {/each}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>

      <div class="result-actions no-print">
        <button type="button" class="btn-primary" onclick={start}>Practice again</button>
        <button type="button" class="btn-ghost" onclick={() => window.print()}>Print report</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .practice { max-width: 46rem; margin: 0 auto; padding: 1.5rem 1.25rem 3rem; }

  .gate { text-align: center; padding: 2rem 1.5rem; }
  .gate h1 { font-size: 1.8rem; font-weight: 800; }
  .gate-sub { color: var(--muted); margin: 0.4rem 0 1rem; font-size: 0.95rem; }
  .linewrap { margin: 0.5rem 0; }
  .gate-help { color: var(--ink); max-width: 30rem; margin: 0.75rem auto 1.5rem; }

  .statusbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.9rem;
    font-size: 0.95rem;
    color: var(--muted);
  }
  .statusbar b { color: var(--ink); font-size: 1.1rem; }
  .clock { font-variant-numeric: tabular-nums; }

  .question { padding: 1.25rem 1.5rem 1.5rem; text-align: center; }
  .question h2 { font-size: 1.4rem; font-weight: 800; margin-bottom: 0.25rem; }
  .big { color: var(--purple); font-size: 2rem; }

  .steps {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    list-style: none;
    margin: 0.25rem 0 0.75rem;
    padding: 0;
  }
  .steps li {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: capitalize;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: var(--bg);
    color: var(--muted);
  }
  .steps li.current { background: var(--blue); color: #fff; }
  .steps li.done { background: var(--green-soft); color: var(--green); }

  .prompt { font-size: 1.15rem; font-weight: 600; margin: 0.25rem 0 0.9rem; }
  .plot-help { margin: -0.2rem 0 0; color: var(--muted); }

  .answer { display: flex; justify-content: center; gap: 0.6rem; flex-wrap: wrap; }
  .answer input {
    width: 9rem;
    font: inherit;
    font-size: 1.6rem;
    font-weight: 700;
    text-align: center;
    padding: 0.4rem 0.6rem;
    border: 2px solid var(--blue-border);
    border-radius: 12px;
  }
  .answer input:focus { outline: none; border-color: var(--blue); }
  .answer input:disabled { background: var(--bg); }

  .choices { display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; }
  .choice {
    font-size: 1.15rem;
    font-weight: 800;
    color: #fff;
    padding: 0.9rem 1.4rem;
    border: 0;
    border-radius: 14px;
    transition: transform 0.08s, filter 0.15s;
  }
  .choice:hover:not(:disabled) { filter: brightness(1.08); }
  .choice:active:not(:disabled) { transform: scale(0.97); }
  .choice:disabled { opacity: 0.5; cursor: default; }
  .choice.down { background: var(--amber); }
  .choice.up { background: var(--green); }

  .feedback {
    margin: 1rem auto 0;
    max-width: 34rem;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-weight: 600;
  }
  .feedback.ok { background: var(--green-soft); color: #166534; }
  .feedback.bad { background: var(--red-soft); color: #991b1b; }
  .continue { margin-top: 1rem; }

  .results { padding: 1.75rem 1.5rem; text-align: center; }
  .results h2 { font-size: 1.6rem; font-weight: 800; }
  .bigscore { font-size: 3.2rem; font-weight: 800; margin: 0.25rem 0 0; line-height: 1; color: var(--blue); }
  .of { font-size: 1.6rem; color: var(--muted); }
  .detail { color: var(--muted); margin: 0.4rem 0 1.25rem; }

  .report { text-align: left; border-top: 1px solid var(--border); padding-top: 1.25rem; }
  .report h3 { font-size: 1.1rem; font-weight: 800; }
  .summary { color: var(--muted); font-size: 0.9rem; margin: 0.25rem 0 0.75rem; }
  .focus { margin: 0 0 0.75rem; font-weight: 600; }
  .pill {
    display: inline-block;
    margin-left: 0.4rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background: var(--red-soft);
    color: #991b1b;
    font-size: 0.85rem;
    text-transform: capitalize;
  }
  .clean { color: var(--green); font-weight: 600; }

  table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
  th, td { text-align: left; padding: 0.45rem 0.5rem; border-bottom: 1px solid var(--border); vertical-align: top; }
  th { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); }
  tr.missed td { background: #fff7f7; }
  .ok { color: var(--green); font-weight: 800; }
  .miss { display: block; color: #991b1b; }

  .result-actions { display: flex; justify-content: center; gap: 0.75rem; margin-top: 1.5rem; }
</style>
