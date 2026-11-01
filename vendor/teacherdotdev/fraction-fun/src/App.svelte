<script lang="ts">
  import { fly, scale } from 'svelte/transition'
  import Confetti from './components/Confetti.svelte'
  import Donut, { type LandedSprinkle } from './components/Donut.svelte'
  import Island, { type Highlight } from './components/Island.svelte'
  import BrandBox from './components/BrandBox.svelte'
  import SiteChrome from './components/SiteChrome.svelte'
  import { embedded, report } from './lib/curio'
  import Stepper from './components/Stepper.svelte'
  import { playStep } from './lib/autoplay'
  import { countingOrder, dealTo, sprinkleSlots } from './lib/donut'
  import type { Point } from './lib/donut'
  import { launchPoint, planFlight, positionAt, type Flight } from './lib/flight'
  import { ITEM_TOPPING } from './components/items'
  import { ARRIVAL, ITEM_WORDS, itemFromParams, toppingsFor } from './lib/items'
  import {
    answerOf,
    fractionName,
    fractionWords,
    MAX_DENOMINATOR,
    MAX_WHOLE,
    modeFromParams,
    problemFromParams,
    shareOf,
  } from './lib/problem'
  import { bloop, chopThud, isMuted, play, poof, setMuted, stepDown, swoosh, stepUp, unlockAudio } from './lib/sound'
  import { hintFor, nextStep, STEPS, targetFor, type Step } from './lib/steps'

  const problem = problemFromParams(new URLSearchParams(location.search))
  /** Watch mode: no −/+ or taps; each press plays the next step by itself. */
  const watch = modeFromParams(new URLSearchParams(location.search)) === 'watch'
  // The food being shared (?item=pizza), and its words: "sprinkles" or "pepperoni".
  const item = itemFromParams(new URLSearchParams(location.search))
  const words = ITEM_WORDS[item]
  /** Seeds and holes pop up where they're dealt; everything else is thrown. */
  const pops = ARRIVAL[item] === 'pop'
  /** Drawn toppings (chocolate chips, candles) fly as their own drawing. */
  const FlyingTopping = item === 'donut' || item === 'pizza' ? null : ITEM_TOPPING[item]
  const share = shareOf(problem)
  const pieces = fractionName(problem.denominator, 2)
  const COLORS = ['#ff4d4d', '#ffb020', '#ffe14d', '#2fbf71', '#3d8bff', '#9b5cff']
  const COUNTED_GROUP = 0
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  type Flying = { id: number; color: string; rotation: number; x: number; y: number; spin: number }
  type Poof = { id: number; x: number; y: number; size: number }

  let step = $state<Step>('question')
  let groups = $state(1)
  let chopped = $state(false)
  let chopping = $state(false)
  let landed: LandedSprinkle[] = $state([])
  let flying: Flying[] = $state([])
  /** Sprinkles thrown so far, including ones still in the air. */
  let thrown = $state(0)
  /** Sprinkle ids in the order the student tapped them. */
  let countOrder: number[] = $state([])
  let poofs: Poof[] = $state([])
  let kept = $state(new Set<number>())
  let fallen = $state(new Set<number>())
  let attempts = $state(0)
  /** Wrong confirms across the whole problem, reported to curio when it is finished. */
  let mistakes = 0
  let wobble = $state(false)
  let busy = $state(false)
  /** Watch mode is playing a step; the button hides until the next step begins. */
  let autoplaying = $state(false)
  let muted = $state(isMuted())
  let donut: Donut | undefined = $state()
  // The answer reveal.
  let revealing = $state(false)
  let answerSoFar: number | null = $state(null)
  let landings = $state(0)
  let showWhole = $state(false)
  let launched = $state(new Set<number>())

  let nextId = 0
  type FlightEntry = { flight: Flight; started: number; onLand?: () => void; deal?: number }
  const flights = new Map<number, FlightEntry>()
  let frame = 0

  const hint = $derived(hintFor(problem, step, attempts, item))
  const target = $derived(targetFor(problem, step))

  const highlight: Highlight = $derived(
    revealing
      ? null
      : step === 'groups'
        ? 'denominator'
        : step === 'sprinkles'
          ? 'whole'
          : step === 'pick'
            ? 'numerator'
            : null,
  )

  function promptFor(s: Step) {
    return {
      question: '',
      groups: 'How many equal groups do we need?',
      sprinkles: `What are we splitting into ${pieces}?`,
      count: `How many ${words.toppings} in one group?`,
      pick: `How many ${pieces} do we need?`,
      answer: '',
    }[s]
  }

  // From Keep! on, the prompt and controls stay laid out exactly as on Pick (just
  // invisible), so the donut never moves or resizes through the ending.
  const hold = $derived(revealing)
  const shownStep: Step = $derived(hold ? 'pick' : step)

  /** The counted group's sprinkles, swept clockwise, for counting from the keyboard. */
  const countedSprinkles = $derived.by(() => {
    const inGroup = landed.filter((s) => s.group === COUNTED_GROUP)
    const slots = sprinkleSlots(COUNTED_GROUP, problem.denominator, Math.ceil(MAX_WHOLE / problem.denominator), item)
    const order = countingOrder(slots, COUNTED_GROUP, problem.denominator)
    return order.flatMap((slot) => inGroup.filter((s) => s.slot === slot))
  })

  const counts = $derived(new Map(countOrder.map((id, i) => [id, i + 1] as const)))
  const allCounted = $derived(countOrder.length > 0 && countOrder.length === countedSprinkles.length)

  const greyed = $derived.by(() => {
    // While counting, the other groups' sprinkles go grey too.
    if (step === 'count') return new Set(range(problem.denominator).filter((g) => g !== COUNTED_GROUP))
    if (step === 'pick' || step === 'answer') {
      return new Set(range(problem.denominator).filter((g) => !glazed.has(g)))
    }
    return new Set<number>()
  })

  /** "5 = 5", "5 + 5 = 10"… for the groups picked so far. */
  const pickedMath = $derived(
    kept.size ? `${Array(kept.size).fill(share).join(' + ')} = ${kept.size * share}` : '',
  )

  const instruction = $derived(
    watch
      ? ''
      : shownStep === 'count'
      ? `Tap or click each ${words.topping} to count it.`
      : shownStep === 'pick'
        ? `Tap or click the ${pieces} you need.`
        : '',
  )

  const dimmed = $derived.by(() => {
    // The other groups stay faded until the zoom-out finishes, then fade back in.
    if (step === 'count' || (step === 'pick' && zoomingOut)) {
      return new Set(range(problem.denominator).filter((i) => i !== COUNTED_GROUP))
    }
    return new Set<number>()
  })

  const glazed = $derived.by(() => {
    if (step === 'count') return new Set([COUNTED_GROUP])
    if (step === 'pick') return kept
    if (step === 'answer') return kept
    return new Set<number>()
  })

  const groupBadges = $derived.by(() => {
    if (step === 'pick' || (step === 'answer' && !showWhole)) {
      return new Map([...glazed].map((g) => [g, share] as const))
    }
    return new Map<number, number>()
  })

  const pulse = $derived.by((): 'minus' | 'plus' | null => {
    if (!hint?.pulse || target === null) return null
    const value = step === 'groups' ? groups : thrown
    return value < target ? 'plus' : 'minus'
  })

  const pulseGroups = $derived.by(() => {
    if (step !== 'pick' || !hint?.pulse) return new Set<number>()
    const tooFew = kept.size < problem.numerator
    return new Set(range(problem.denominator).filter((g) => kept.has(g) !== tooFew))
  })

  function range(n: number) {
    return Array.from({ length: n }, (_, i) => i)
  }

  function wait(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
  }

  async function advance(delay = 0, sound: 'whoosh' | 'intro' = 'whoosh') {
    busy = true
    const run = epoch
    await wait(delay)
    if (run !== epoch) return
    attempts = 0
    hintShown = false
    const from = step
    step = nextStep(step)
    autoplaying = false
    pushStep(step)
    play(sound, { volume: sound === 'intro' ? 0.8 : 0.35 })
    busy = false
    if (from === 'count') settleZoom()
    if (step === 'answer') {
      celebrate()
      report('complete', { mistakes, watch })
    }
  }

  let zoomingOut = $state(false)
  function settleZoom() {
    zoomingOut = true
    setTimeout(() => (zoomingOut = false), 750)
  }

  // ——— Browser history ———
  // Each step gets its own history entry (…&step=sprinkles), so the browser's Back
  // button returns to the step before instead of leaving the page. Forward is ignored,
  // because a later step can't be rebuilt from the URL alone.
  // Bumped on every jump back, so timers and animations from the old step stop.
  let epoch = 0

  function urlFor(s: Step) {
    const url = new URL(location.href)
    if (s === 'question') url.searchParams.delete('step')
    else url.searchParams.set('step', s)
    return url
  }

  function pushStep(s: Step) {
    history.pushState({ step: s }, '', urlFor(s))
  }

  // A refresh always starts from the question.
  history.replaceState({ step: 'question' }, '', urlFor('question'))

  function onHistory(event: PopStateEvent) {
    const target: Step = event.state?.step ?? 'question'
    if (STEPS.indexOf(target) > STEPS.indexOf(step)) history.back()
    else if (target !== step) goBackTo(target)
  }

  /** Puts everything back as it was when `target` began. */
  function goBackTo(target: Step) {
    epoch += 1
    busy = false
    autoplaying = false
    chopping = false
    attempts = 0
    hintShown = false
    flights.clear()
    flying = []
    poofs = []
    confetti?.clear()
    donut?.settle()
    revealing = false
    answerSoFar = null
    landings = 0
    showWhole = false
    launched = new Set()
    fallen = new Set()
    const at = STEPS.indexOf(target)
    if (at <= STEPS.indexOf('pick')) kept = new Set()
    if (at <= STEPS.indexOf('sprinkles')) countOrder = []
    if (at <= STEPS.indexOf('groups')) {
      chopped = false
      landed = []
      thrown = 0
    }
    if (target === 'question') groups = 1
    step = target
    play('whoosh', { volume: 0.35 })
  }

  const HINT_SECONDS = 4
  // The hint floats over the donut for a few seconds, then slides away.
  let hintShown = $state(false)
  let hintTimer = 0

  function miss() {
    attempts += 1
    mistakes += 1
    play('wrong')
    hintShown = true
    clearTimeout(hintTimer)
    hintTimer = setTimeout(() => (hintShown = false), HINT_SECONDS * 1000)
    if (reduceMotion) return
    wobble = false
    requestAnimationFrame(() => (wobble = true))
    setTimeout(() => (wobble = false), 520)
  }

  // ——— Question ———
  function start() {
    unlockAudio()
    advance(0, 'intro')
  }

  // ——— Groups ———
  function changeGroups(delta: number) {
    const value = groups + delta
    if (value < 1 || value > MAX_DENOMINATOR) return play('limit')
    groups = value
    if (delta > 0) stepUp(value - 1)
    else stepDown(value - 1)
  }

  async function chop() {
    if (groups !== problem.denominator) return miss()
    busy = true
    // The knife swishes down each cut line in turn…
    chopping = true
    play('chop')
    const run = epoch
    await wait(220 + 70 * (groups - 1) + 60)
    if (run !== epoch) return
    // …then the pieces thunk apart.
    chopping = false
    chopped = true
    await wait(40)
    chopThud()
    advance(950)
  }

  // ——— Sprinkles ———
  /** Deals the next topping: thrown in from the edge, or popping up in place. */
  function throwSprinkle() {
    if (pops) return popTopping()
    if (thrown >= MAX_WHOLE || !donut) return play('limit')
    const { group, slot } = dealTo(thrown, problem.denominator)
    const aim = donut.screenPoint(group, slot)
    if (!aim) return
    thrown += 1
    stepUp(thrown - 1)
    play('throw', { volume: 0.4, rate: 0.9 + Math.random() * 0.3 })
    const id = nextId++
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const rotation = Math.round(Math.random() * 180)
    const flight = planFlight(
      launchPoint(innerWidth, innerHeight),
      aim,
      reduceMotion ? 0.4 : 0.75 + Math.random() * 0.2,
    )
    const deal = thrown - 1
    launch(
      { id, color, rotation, spin: (Math.random() - 0.5) * 900 },
      flight,
      () => {
        landed = [...landed, { id, deal, group, slot, color, rotation }]
        play('land', { volume: 0.7, rate: 0.9 + Math.random() * 0.25 })
      },
      deal,
    )
  }

  /** A seed or hole appears straight away in its slot, with a bloop; nothing flies. */
  function popTopping() {
    if (thrown >= MAX_WHOLE || !donut) return play('limit')
    const { group, slot } = dealTo(thrown, problem.denominator)
    thrown += 1
    stepUp(thrown - 1)
    bloop()
    const deal = thrown - 1
    landed = [...landed, { id: nextId++, deal, group, slot, color: '', rotation: Math.round(Math.random() * 180) }]
  }

  /** Takes back the most recent sprinkle with a poof, whether it's landed or still in the air. */
  function unthrowSprinkle() {
    if (thrown === 0) return play('limit')
    thrown -= 1
    stepDown(thrown)
    poof()
    // Throws land at slightly different times, so find the sprinkle by its place in
    // the dealing order. Otherwise the next throw would land on a group that's full.
    const deal = thrown
    const inAir = [...flights].find(([, entry]) => entry.deal === deal)?.[0]
    if (inAir !== undefined) {
      const at = flying.find((f) => f.id === inAir)
      flights.delete(inAir)
      flying = flying.filter((f) => f.id !== inAir)
      if (at) puff(at)
      return
    }
    const gone = landed.find((s) => s.deal === deal)
    if (!gone || !donut) return
    landed = landed.filter((s) => s !== gone)
    const at = donut.screenPoint(gone.group, gone.slot)
    if (at) puff(at)
  }

  /** ±5: five throws in quick succession; pop-ups come a little quicker still. */
  function repeat(times: number, action: () => void) {
    const run = epoch
    const gap = pops ? 70 : 90
    for (let i = 0; i < times; i += 1) setTimeout(() => run === epoch && action(), i * gap)
  }

  function puff(at: { x: number; y: number }) {
    const id = nextId++
    poofs = [...poofs, { id, x: at.x, y: at.y, size: (donut?.unitScale() ?? 1) * 46 }]
    setTimeout(() => (poofs = poofs.filter((p) => p.id !== id)), 650)
  }

  async function share_() {
    if (thrown !== problem.whole) return miss()
    busy = true
    // Let the last throws land before moving on.
    while (flights.size) await wait(60)
    advance()
  }

  // ——— Count ———
  function countSprinkle(id: number) {
    if (countOrder.includes(id)) return play('limit', { volume: 0.4 })
    countOrder = [...countOrder, id]
    play('pop', { rate: 0.9 + countOrder.length * 0.04 })
  }

  /** Keyboard counting: the next sprinkle not counted yet, going clockwise. */
  function countNext() {
    const next = countedSprinkles.find((s) => !countOrder.includes(s.id))
    if (!next) return play('limit')
    countSprinkle(next.id)
  }

  function doneCounting() {
    // Done! only shows once every sprinkle has a number.
    if (!allCounted) return
    advance()
  }

  // ——— Pick ———
  function toggleGroup(group: number) {
    const next = new Set(kept)
    if (next.has(group)) {
      next.delete(group)
      stepDown(next.size)
    } else {
      next.add(group)
      play('pop')
    }
    kept = next
  }

  async function keep() {
    if (kept.size !== problem.numerator) return miss()
    busy = true
    revealing = true
    fallen = new Set(range(problem.denominator).filter((g) => !kept.has(g)))
    play('fall')
    advance(950)
  }

  // ——— Answer ———
  // The question swings down into "¾ of 20 =", then each kept group swings out to
  // the right and back into the answer, fading to just its number. Each landing
  // adds on (5, 10, 15…). Then the cheer, and the whole donut and summary return.
  let island: Island | undefined = $state()
  let confetti: Confetti | undefined = $state()
  const keptInOrder = $derived([...kept].sort((a, b) => a - b))

  async function celebrate() {
    const run = epoch
    // Pieces take off one after another, each sooner and quicker than the last,
    // so a long sum builds up speed on its way to the answer.
    const landed: Promise<void>[] = []
    for (const [n, group] of keptInOrder.entries()) {
      if (!donut || !island || run !== epoch) return
      const slot = island.slotPoint()
      const duration = Math.max(480, 800 * 0.88 ** n)
      // The swoosh starts as the number lifts off, once its piece has faded.
      setTimeout(() => run === epoch && swoosh(duration / 1000, 1 + n * 0.06), 350)
      landed.push(
        donut.launchGroup(group, slot, slot.size, duration).then(() => {
          if (run !== epoch) return
          launched = new Set([...launched, group])
          answerSoFar = (answerSoFar ?? 0) + share
          landings += 1
          play('pop', { rate: 0.9 + landings * 0.1 })
        }, () => {}),
      )
      if (n < keptInOrder.length - 1) await wait(Math.max(150, 520 * 0.75 ** n))
    }
    await Promise.all(landed)
    await wait(250)
    if (run !== epoch) return
    play('success')
    play('cheer', { volume: 0.7 })
    confetti?.burst({ few: reduceMotion })
    await wait(900)
    if (run !== epoch) return
    // The whole donut fades back in, with the groups we didn't need in grey.
    donut?.settle()
    launched = new Set()
    fallen = new Set()
    showWhole = true
  }

  /** Back to the question, through history, so Back doesn't return to the answer. */
  function again() {
    play('click')
    const steps = STEPS.indexOf(step)
    if (steps > 0) history.go(-steps)
    else goBackTo('question')
  }

  // ——— Flights ———
  function launch(sprinkle: Omit<Flying, 'x' | 'y'>, flight: Flight, onLand?: () => void, deal?: number) {
    flights.set(sprinkle.id, { flight, started: performance.now(), onLand, deal })
    flying = [...flying, { ...sprinkle, x: flight.start.x, y: flight.start.y }]
    if (!frame) frame = requestAnimationFrame(tick)
  }

  function tick(now: number) {
    const done: number[] = []
    flying = flying.map((f) => {
      const entry = flights.get(f.id)
      if (!entry) return f
      const seconds = (now - entry.started) / 1000
      if (seconds >= entry.flight.duration) done.push(f.id)
      const p = positionAt(entry.flight, seconds)
      return { ...f, x: p.x, y: p.y, rotation: f.rotation + f.spin / 60 }
    })
    for (const id of done) {
      const entry = flights.get(id)
      flights.delete(id)
      entry?.onLand?.()
    }
    flying = flying.filter((f) => flights.has(f.id))
    frame = flights.size ? requestAnimationFrame(tick) : 0
  }

  // ——— Controls ———
  function confirm() {
    if (busy || autoplaying) return
    if (watch) return watchStep()
    if (step === 'question') start()
    else if (step === 'groups') chop()
    else if (step === 'sprinkles') share_()
    else if (step === 'count') doneCounting()
    else if (step === 'pick') keep()
    else again()
  }

  // ——— Watch mode ———
  /** Plays the current step with the same actions a student's taps would trigger. */
  function watchStep() {
    const run = epoch
    if (step !== 'question' && step !== 'answer') autoplaying = true
    if (step === 'question') unlockAudio()
    void playStep(step, problem, {
      groups: () => groups,
      changeGroups,
      chop,
      thrown: () => thrown,
      throwSprinkle,
      share: share_,
      uncounted: () => countedSprinkles.length - countOrder.length,
      countNext,
      doneCounting,
      kept: () => kept,
      toggleGroup,
      keep,
      start,
      again,
      wait,
      current: () => run === epoch,
    })
  }

  function onKey(event: KeyboardEvent) {
    if (busy || autoplaying || (event.repeat && event.key === 'Enter')) return
    const more = ['+', '=', 'ArrowRight', 'ArrowUp'].includes(event.key)
    const less = ['-', '_', 'ArrowLeft', 'ArrowDown'].includes(event.key)
    if (more || less) {
      event.preventDefault()
      if (watch) return
      if (step === 'groups') changeGroups(more ? 1 : -1)
      else if (step === 'sprinkles') (more ? throwSprinkle : unthrowSprinkle)()
      else if (step === 'count' && more) countNext()
    } else if (event.key === 'Enter' || event.key === ' ') {
      // A focused button or link (sound, settings, menu) handles its own key.
      if ((event.target as Element).closest?.('button, a, input, [role="button"]')) return
      event.preventDefault()
      confirm()
    }
  }

  function toggleMute() {
    muted = !muted
    setMuted(muted)
    if (!muted) play('click')
  }

  // Watch mode names what each press is about to play; Confirm! and Done! only make
  // sense after the student has done the work themselves.
  const confirmLabel = $derived(
    watch
      ? { question: 'Start!', groups: 'Chop!', sprinkles: 'Share!', count: 'Count!', pick: 'Keep!', answer: 'Again!' }[shownStep]
      : { question: 'Start!', groups: 'Chop!', sprinkles: 'Confirm!', count: 'Done!', pick: 'Keep!', answer: 'Again!' }[shownStep],
  )
  /** The main button keeps its space but hides while it has nothing to do. */
  const goHidden = $derived(
    (hold && !showWhole) || (watch ? autoplaying : step === 'count' && !allCounted),
  )
</script>

<svelte:window onkeydown={onKey} onpopstate={onHistory} />

<main class="app" class:started={step !== 'question'}>
  <Island
    bind:this={island}
    {problem}
    mode={step === 'question' ? 'full' : revealing ? 'answer' : 'pinned'}
    {highlight}
    answer={answerSoFar}
    {landings}
    done={showWhole}
  />
  <Confetti bind:this={confetti} />

  <button class="mute" onclick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'}>
    {#if muted}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 9l5 6M21 9l-5 6" class="line" /></svg>
    {:else}
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" class="line" /></svg>
    {/if}
  </button>

  {#if !embedded}
  <!-- Teacher setup, beside the sound button. Opens with this problem filled in. -->
  <a class="settings" href={`${import.meta.env.BASE_URL}teacher${location.search}`} aria-label="Teacher settings">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  </a>
  {/if}

  {#if step !== 'question'}
    <ol class="dots" class:gone={revealing} aria-label="Progress">
      {#each STEPS.slice(1) as s, i (s)}
        <li class:done={STEPS.indexOf(step) > i + 1} class:current={step === s}></li>
      {/each}
    </ol>

    <section class="prompt" aria-live="polite">
      {#key shownStep}
        <!-- Kept (invisibly) while groups fly, so the donut doesn't resize mid-flight. -->
        <h2 class:hold in:fly={{ y: 24, duration: 400, delay: 150 }}>{promptFor(shownStep)}</h2>
      {/key}
    </section>

    <section class="stage" in:scale={{ start: 0.6, duration: 500, delay: 200 }}>
      <div class="donut-box">
        <Donut
          bind:this={donut}
          {item}
          groups={chopped ? problem.denominator : groups}
          {chopped}
          {chopping}
          sprinkles={landed}
          {glazed}
          dimmed={step === 'answer' ? new Set(range(problem.denominator).filter((g) => !glazed.has(g))) : dimmed}
          {fallen}
          counts={step === 'count' ? counts : new Map()}
          {groupBadges}
          {launched}
          reappear={showWhole}
          {wobble}
          {pulseGroups}
          {greyed}
          greyArt={step === 'count'}
          focus={step === 'count' ? COUNTED_GROUP : null}
          onSprinkleTap={step === 'count' && !watch ? countSprinkle : undefined}
          onGroupTap={step === 'pick' && !busy && !watch ? toggleGroup : undefined}
        />
      </div>
      {#if step === 'pick' && pickedMath && !hold}
        <!-- Floats under the donut so it never pushes the layout around. -->
        {#key pickedMath}
          <p class="math-bubble" in:scale={{ start: 0.85, duration: 200 }}>{pickedMath}</p>
        {/key}
      {/if}
    </section>
  {/if}

  <footer class="control" class:hold class:finished={showWhole}>
    {#if step === 'answer'}
      <!-- Laid over the controls' (hidden) space, so the donut never resizes. -->
      <div class="summary" class:shown={showWhole}>
        <p>{fractionWords(problem)} of {problem.whole} = <strong>{answerOf(problem)}</strong></p>
        {#if problem.numerator > 1}
          <p>{Array(problem.numerator).fill(share).join(' + ')} = {answerOf(problem)}</p>
        {/if}
        <p>
          {problem.numerator} {problem.numerator === 1 ? 'group' : 'groups'} of {share} → {problem.numerator} × {share} = {answerOf(problem)}
        </p>
        <p class="soft">{problem.denominator} groups of {share} = {problem.whole}</p>
      </div>
    {/if}

    <!-- Floats above the controls, over the donut, so showing it never moves anything. -->
    <div class="hint-spot" aria-live="polite">
      {#if hint && hintShown}
        {#key attempts}
          <p class="hint" in:fly={{ y: 16, duration: 280 }} out:fly={{ y: 16, duration: 320 }}>{hint.text}</p>
        {/key}
      {/if}
    </div>
    {#if step !== 'question'}
      <!-- Always there, blank when unused, so the controls never change height. -->
      <p class="instruction">{instruction || '\u00a0'}</p>
    {/if}
    {#if watch && (step === 'groups' || step === 'sprinkles')}
      <!-- Watch mode shows the number ticking up in the stepper's place, at its height. -->
      {@const value = step === 'groups' ? groups : thrown}
      <div class="picked" aria-live="polite">
        {#key value}<span class="number">{value}</span>{/key}
        <span class="label">{step === 'groups' ? (value === 1 ? 'group' : 'groups') : toppingsFor(item, value)}</span>
      </div>
    {:else if step === 'groups'}
      <Stepper value={groups} label={groups === 1 ? 'group' : 'groups'} onMinus={() => changeGroups(-1)} onPlus={() => changeGroups(1)} {pulse} />
    {:else if step === 'sprinkles'}
      <Stepper
        value={thrown}
        label={toppingsFor(item, thrown)}
        onMinusFive={() => repeat(5, unthrowSprinkle)}
        onMinus={unthrowSprinkle}
        onPlus={throwSprinkle}
        onPlusFive={() => repeat(5, throwSprinkle)}
        {pulse}
      />
    {:else if step === 'count'}
      <div class="picked" aria-live="polite">
        {#key countOrder.length}<span class="number">{countOrder.length}</span>{/key}
        <span class="label">counted</span>
      </div>
    {:else if shownStep === 'pick'}
      <div class="picked" aria-live="polite">
        {#key kept.size}<span class="number">{kept.size}</span>{/key}
        <span class="label">{fractionName(problem.denominator, kept.size)}</span>
      </div>
    {/if}
    <!-- Done! keeps its space while hidden, so the donut doesn't jump when it appears. -->
    <button
      class="go"
      class:big={step === 'question'}
      class:waiting={goHidden}
      onclick={confirm}
      disabled={busy || goHidden}
      aria-hidden={goHidden}
      >{showWhole ? 'Again!' : confirmLabel}</button
    >
  </footer>

  <div class="flying" aria-hidden="true">
    {#each poofs as p (p.id)}
      <span class="poof" style={`transform: translate(${p.x}px, ${p.y}px); --size: ${p.size}px`}>
        {#each Array.from({ length: 6 }) as _, i (i)}
          <span class="puff" style={`--angle: ${i * 60 + 15}deg`}></span>
        {/each}
      </span>
    {/each}
    {#each flying as f (f.id)}
      {#if FlyingTopping}
        <!-- The same drawing as the landed topping, spinning as it flies. -->
        <svg
          class="topping"
          viewBox="-16 -16 32 32"
          style={`transform: translate(${f.x}px, ${f.y}px) scale(${donut?.unitScale() ?? 1})`}
        ><FlyingTopping rotation={f.rotation} toward={f.rotation} /></svg>
      {:else}
      <span
        class="sprinkle"
        class:pepperoni={item === 'pizza'}
        style={`transform: translate(${f.x}px, ${f.y}px) rotate(${f.rotation}deg) scale(${donut?.unitScale() ?? 1});${item === 'pizza' ? '' : ` background: ${f.color}`}`}
      ></span>
      {/if}
    {/each}
  </div>
</main>

<BrandBox />
{#if !embedded}<SiteChrome />{/if}

<style>
  .app {
    height: 100dvh;
    display: grid;
    grid-template-rows: 104px auto minmax(0, 1fr) auto;
    /* Never wider than the screen, even if a row's content asks for more. */
    grid-template-columns: minmax(0, 1fr);
    overflow: hidden;
    position: relative;
  }

  .mute {
    position: fixed;
    top: 18px;
    right: 18px;
    z-index: 6;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: #fff;
    box-shadow: 0 4px 16px #2b2b3a1f;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  .mute svg {
    width: 26px;
    height: 26px;
    fill: var(--ink);
  }

  .mute .line {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2.2;
    stroke-linecap: round;
  }

  .settings {
    position: fixed;
    top: 18px;
    right: 82px;
    z-index: 6;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 4px 16px #2b2b3a1f;
    display: grid;
    place-items: center;
  }

  .settings svg {
    width: 26px;
    height: 26px;
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .settings:focus-visible {
    outline: 4px solid #ffd23f;
    outline-offset: 3px;
  }

  /* Too narrow to sit beside the sound button without meeting the question, so it
     sits under it instead. */
  @media (max-width: 560px) {
    .settings {
      top: 80px;
      right: 18px;
    }
  }

  .dots {
    grid-row: 1;
    align-self: end;
    justify-self: center;
    display: flex;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .dots li {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #2b2b3a26;
    transition: background-color 0.3s, transform 0.3s;
  }

  .dots .done {
    background: var(--accent);
  }

  .dots .current {
    background: var(--ink);
    transform: scale(1.3);
  }

  .prompt {
    grid-row: 2;
    text-align: center;
    padding: 18px 16px 0;
    display: grid;
    justify-items: center;
    gap: 10px;
  }

  .prompt h2 {
    margin: 0;
    font: 700 clamp(24px, 3.4vw, 40px) / 1.2 var(--font);
  }

  /* On narrow screens some prompts wrap, so every prompt gets room for two lines
     and the donut doesn't resize between steps. */
  @media (max-width: 700px) {
    .prompt h2 {
      min-height: 2.4em;
      display: grid;
      align-items: center;
    }
  }

  .hint-spot {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(100% + 4px);
    display: grid;
    justify-items: center;
    padding: 0 16px;
    pointer-events: none;
  }

  /* Stack the old and new hint in one spot while they cross-fade. */
  .hint-spot > * {
    grid-area: 1 / 1;
  }

  .hint {
    margin: 0;
    box-shadow: 0 6px 20px #2b2b3a26;
    text-align: center;
    padding: 8px 18px;
    border-radius: 999px;
    background: #ffd23f;
    font: 700 clamp(17px, 2vw, 22px) / 1.3 var(--font-text);
  }

  .summary {
    position: absolute;
    /* Centred with auto margins: the build's CSS minifier drops \`translate\` here. */
    left: 0;
    right: 0;
    margin-inline: auto;
    bottom: 96px;
    z-index: 2;
    width: max-content;
    max-width: calc(100vw - 32px);
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 8px 24px 10px;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 6px 24px #2b2b3a1a;
    font: 400 clamp(15px, 1.7vw, 19px) / 1.3 var(--font-text);
    opacity: 0;
    transform: translateY(12px);
    transition:
      opacity 0.45s,
      transform 0.45s;
  }

  .summary.shown {
    opacity: 1;
    transform: none;
  }

  .summary p {
    margin: 0;
  }

  .summary strong {
    color: var(--accent);
  }

  .hold .instruction,
  .hold .picked,
  h2.hold {
    visibility: hidden;
  }

  .dots {
    transition: opacity 0.4s;
  }

  .dots.gone {
    opacity: 0;
  }

  .math-bubble {
    position: absolute;
    left: 0;
    right: 0;
    width: max-content;
    bottom: 6px;
    margin: 0 auto;
    padding: 8px 22px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 6px 20px #2b2b3a26;
    font: 700 clamp(20px, 2.4vw, 28px) / 1.2 var(--font);
    color: var(--accent);
    white-space: nowrap;
  }




  .soft {
    color: var(--ink-soft);
    font-weight: 600;
  }

  .stage {
    position: relative;
    grid-row: 3;
    min-height: 0;
    display: grid;
    /* A definite row, so the donut box's height: 100% has something to fill. Left
       auto, the box falls back to the SVG's default 300px and, on short screens,
       spills under the controls, which then swallow taps meant for its toppings. */
    grid-template-rows: minmax(0, 1fr);
    place-items: center;
    padding: 12px;
  }

  .donut-box {
    transition: opacity 0.5s;
    height: 100%;
    aspect-ratio: 1;
    max-width: 92vw;
    max-height: 100%;
  }

  .control {
    position: relative;
    grid-row: 4;
    display: grid;
    justify-items: center;
    gap: 14px;
    padding: 8px 16px 28px;
    z-index: 4;
  }

  .go {
    min-width: 200px;
    padding: 14px 36px;
    border: none;
    border-radius: 999px;
    background: var(--go);
    color: #fff;
    font: 700 30px/1 var(--font);
    box-shadow: 0 6px 0 #00000033;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 0.2s;
  }

  .go:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 #00000033;
  }

  .go:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .go.waiting {
    visibility: hidden;
    transform: scale(0.6);
  }

  .go.big {
    font-size: 40px;
    padding: 20px 56px;
  }

  @media (hover: hover) {
    .go.big:hover {
      animation: breathe 1.4s ease-in-out infinite;
    }
  }

  @keyframes breathe {
    50% { transform: scale(1.06); }
  }

  .picked {
    display: grid;
    justify-items: center;
    line-height: 1;
    min-height: 76px;
    align-content: center;
  }

  .picked .number {
    font: 700 56px/1 var(--font);
  }

  .picked .label {
    font: 600 18px/1.2 var(--font);
    color: var(--ink-soft);
  }

  .instruction {
    margin: 0;
    font: 400 clamp(16px, 1.8vw, 20px) / 1.3 var(--font-text);
    color: var(--ink-soft);
  }

  .poof {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
  }

  /* Six little clouds that burst outward and fade. */
  .puff {
    position: absolute;
    left: calc(var(--size) * -0.22);
    top: calc(var(--size) * -0.22);
    width: calc(var(--size) * 0.44);
    height: calc(var(--size) * 0.44);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 2px #2b2b3a14;
    animation: puff 0.6s ease-out forwards;
  }

  @keyframes puff {
    from {
      transform: rotate(var(--angle)) translateX(0) scale(0.4);
      opacity: 1;
    }
    to {
      transform: rotate(var(--angle)) translateX(calc(var(--size) * 0.6)) scale(1.1);
      opacity: 0;
    }
  }

  .flying {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }

  .flying .sprinkle {
    position: absolute;
    left: -13px;
    top: -4.5px;
    width: 26px;
    height: 9px;
    border-radius: 4.5px;
    box-shadow: 1px 2.5px 0 #2b2b3a2e;
  }

  /* A thrown pepperoni: matches the landed one (rim, red middle, flecks of fat). */
  .flying .pepperoni {
    left: -11.5px;
    top: -11.5px;
    width: 23px;
    height: 23px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 34% 39%, #f3b892 0 1.9px, transparent 2.3px),
      radial-gradient(circle at 65% 57%, #f3b892 0 1.6px, transparent 2px),
      radial-gradient(circle at 48% 70%, #f3b892 0 1.7px, transparent 2.1px),
      radial-gradient(circle at 48% 48%, #c4372b 0 9px, #a3261f 9.4px);
    box-shadow: 1px 2.5px 0 #2b2b3a33;
  }

  /* A thrown chocolate chip or candle: its own drawing, 32 units across like the landed one. */
  .flying .topping {
    position: absolute;
    left: -16px;
    top: -16px;
    width: 32px;
    height: 32px;
    overflow: visible;
  }

  .app:not(.started) {
    grid-template-rows: 1fr auto;
  }

  .app:not(.started) .control {
    grid-row: 2;
    padding-bottom: 8vh;
  }

  @media (prefers-reduced-motion: reduce) {
    .go.waiting {
    visibility: hidden;
    transform: scale(0.6);
  }

  .go.big { animation: none; }
  }
</style>
