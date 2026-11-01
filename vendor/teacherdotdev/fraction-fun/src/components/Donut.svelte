<script lang="ts" module>
  export type LandedSprinkle = {
    id: number
    /** Its place in the dealing order: 0 for the first sprinkle thrown. */
    deal: number
    group: number
    slot: number
    color: string
    rotation: number
  }
</script>

<script lang="ts">
  import { FROSTING_PATH } from '../lib/donutArt'
  import {
    CENTER,
    chopOffset,
    focusOn,
    groupCentre,
    PEPPERONI_RADIUS,
    SHAPES,
    sprinkleSlots,
    wedgePath,
    type Point,
  } from '../lib/donut'
  import { ARRIVAL, ITEM_WORDS, type Item } from '../lib/items'
  import { CHEESE_BLOBS, CHEESE_PATH, SAUCE_PATH } from '../lib/pizzaArt'
  import { MAX_WHOLE } from '../lib/problem'
  import { ITEM_ART, ITEM_TOPPING } from './items'

  type Props = {
    /** The food being shared: a donut with sprinkles, a pizza with pepperoni, and so on. */
    item?: Item
    /** Groups shown as cut lines before the chop, or as pieces after it. */
    groups: number
    chopped: boolean
    /** Briefly true while the knife goes through. */
    chopping?: boolean
    sprinkles?: LandedSprinkle[]
    glazed?: Set<number>
    dimmed?: Set<number>
    fallen?: Set<number>
    /** Numbers popped over sprinkles while counting, by sprinkle id. */
    counts?: Map<number, number>
    /** Big number on a whole group, by group index. */
    groupBadges?: Map<number, number>
    wobble?: boolean
    pulseGroups?: Set<number>
    /** Groups that have flown off to the answer, hidden until the donut comes back. */
    launched?: Set<number>
    /** Fades every group back in place at once, for the final picture. */
    reappear?: boolean
    /** Zoom in so this group fills the view. */
    focus?: number | null
    /** Groups drawn in greyscale, sprinkles and all, so colour marks what matters. */
    greyed?: Set<number>
    /** Grey the donut itself but keep every sprinkle in colour. */
    greyArt?: boolean
    onSprinkleTap?: (id: number) => void
    onGroupTap?: (group: number) => void
  }

  let {
    item = 'donut',
    groups,
    chopped,
    chopping = false,
    sprinkles = [],
    glazed = new Set(),
    dimmed = new Set(),
    fallen = new Set(),
    counts = new Map(),
    groupBadges = new Map(),
    wobble = false,
    pulseGroups = new Set(),
    focus = null,
    launched = new Set(),
    reappear = false,
    greyed = new Set(),
    greyArt = false,
    onSprinkleTap,
    onGroupTap,
  }: Props = $props()

  const words = $derived(ITEM_WORDS[item])
  const shape = $derived(SHAPES[item])
  const FROSTING = '#f28ab0'
  const CHEESE = '#ffd970'
  // Kept groups keep the normal frosting (picked vs not is shown by greying the
  // rest); a hot-pink glaze made the red sprinkles hard to see.
  const GLAZE = FROSTING
  /** Where the cut lines start: just inside the hole, or the very centre of a pizza. */
  const cutFrom = $derived(CENTER - Math.max(shape.hole - 6, 0))
  /** How far a count number sits above its piece, so the piece still shows. */
  const countLift = $derived(item === 'donut' ? 9 : shape.toppingRadius + 2.5)
  /** Seeds and holes grow out of the food where they're dealt, instead of landing. */
  const pops = $derived(ARRIVAL[item] === 'pop')
  const RING = (r: number) =>
    `M${CENTER - r} ${CENTER}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

  let svg: SVGSVGElement
  const groupEls: SVGGElement[] = $state([])
  // Groups burst apart one frame after the chop so the move animates, then snap
  // back into a neat ring.
  let spread = $state(false)
  let snapped = $state(false)

  $effect(() => {
    if (!chopped) {
      spread = false
      snapped = false
      return
    }
    // Two frames: one for the pieces to paint in place, one to start the move.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => (spread = true))
    })
    const snap = setTimeout(() => (snapped = true), 700)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(snap)
    }
  })

  const slots = $derived(
    Array.from({ length: groups }, (_, i) => sprinkleSlots(i, groups, Math.ceil(MAX_WHOLE / groups), item)),
  )
  // Pre-compute fall directions so each piece tumbles its own way.
  const tumbles = $derived(
    Array.from({ length: groups }, (_, i) => ({
      x: (i % 2 ? 1 : -1) * (40 + ((i * 53) % 90)),
      spin: (i % 2 ? 1 : -1) * (25 + ((i * 37) % 40)),
    })),
  )

  /** Where a sprinkle slot is on screen, for aiming throws at it. */
  export function screenPoint(group: number, slot: number): Point | null {
    const el = groupEls[group] ?? svg
    const matrix = el?.getScreenCTM()
    const point = slots[group]?.[slot]
    if (!matrix || !point) return null
    const p = new DOMPoint(point.x, point.y).matrixTransform(matrix)
    return { x: p.x, y: p.y }
  }

  /**
   * Flies a group to `target`: it swings out to the right, then curves back in,
   * fading away until only its number badge is left, grown to `size` px across.
   */
  export function launchGroup(i: number, target: Point, size: number, duration = 1000): Promise<void> {
    const el = groupEls[i]
    const from = badgePoint(i)
    if (!el || !from) return Promise.resolve()
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const fade = reduce ? 1 : 350
    if (reduce) duration = 1
    const k = unitScale()
    const offset = chopOffset(i, groups)
    const dx = (target.x - from.x) / k
    const dy = (target.y - from.y) / k
    // A quadratic curve whose control point sits well out to the right.
    const control = { x: Math.max(dx, 0) + 330 / k, y: dy * 0.35 }
    const frames: Keyframe[] = []
    for (let n = 0; n <= 24; n += 1) {
      const t = n / 24
      const x = 2 * (1 - t) * t * control.x + t * t * dx
      const y = 2 * (1 - t) * t * control.y + t * t * dy
      const tilt = offset.tilt * (1 - t) + Math.sin(t * Math.PI) * 18
      frames.push({ transform: `translate(${offset.x + x}px, ${offset.y + y}px) rotate(${tilt}deg)` })
    }
    // First the piece fades away in place, leaving just its number…
    el.querySelector('.body')?.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: fade,
      easing: 'ease-out',
      fill: 'forwards',
    })
    // …then the number swings out to the right and lands on the answer.
    const flight = el.animate(frames, {
      duration,
      delay: fade,
      easing: 'cubic-bezier(0.45, 0, 0.25, 1)',
      fill: 'forwards',
    })
    el.querySelector('.badge.big .pop')?.animate(
      [{ transform: 'scale(1)' }, { transform: `scale(${size / (badgeRadius * 2 * k)})` }],
      { duration, delay: fade, easing: 'ease-in-out', fill: 'forwards' },
    )
    return flight.finished.then(() => undefined)
  }

  /** Group badges shrink on thin pieces (11ths, 12ths) so neighbours don't overlap. */
  const badgeRadius = $derived(Math.min(28, shape.badgeAt * Math.sin(Math.PI / groups) * 0.8))

  /** Drops every launch animation, so groups sit back where they belong. */
  export function settle() {
    for (const el of groupEls) el?.getAnimations({ subtree: true }).forEach((a) => a.cancel())
  }

  /** Where a group's big number badge sits on screen. */
  export function badgePoint(group: number): Point | null {
    const matrix = (groupEls[group] ?? svg)?.getScreenCTM()
    if (!matrix) return null
    const at = groupCentre(group, groups, item)
    const p = new DOMPoint(at.x, at.y).matrixTransform(matrix)
    return { x: p.x, y: p.y }
  }

  /**
   * A tap counts the topping nearest the finger, not whichever one's tap area is on
   * top: in a full group those areas overlap, and one could hide another's middle.
   */
  function tapNearest(event: MouseEvent, group: number) {
    const matrix = groupEls[group]?.getScreenCTM()
    if (!matrix || !onSprinkleTap) return
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    let nearest: LandedSprinkle | null = null
    let nearestDistance = Infinity
    for (const s of sprinkles) {
      if (s.group !== group) continue
      const at = slots[group][s.slot]
      const distance = Math.hypot(at.x - p.x, at.y - p.y)
      if (distance < nearestDistance) {
        nearest = s
        nearestDistance = distance
      }
    }
    if (nearest) onSprinkleTap(nearest.id)
  }

  /** Screen size of one donut unit, so flying sprinkles match landed ones. */
  export function unitScale(): number {
    // The viewBox is 440 units across (the donut plus a 20-unit margin each side).
    return svg ? svg.getBoundingClientRect().width / 440 : 1
  }

  export function centre(): Point {
    const box = svg.getBoundingClientRect()
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
  }

  // A feathered edge hides whatever the zoom pushes past the donut's box. It
  // follows the camera's live scale, so it fades in as the zoom pushes things
  // out of view and fades away as the zoom out brings them back.
  let cameraEl: SVGGElement
  let feather = $state(0)
  $effect(() => {
    const zooming = focus !== null && chopped
    let frame = 0
    const until = performance.now() + 900
    const tick = (now: number) => {
      const matrix = getComputedStyle(cameraEl).transform
      const scale = matrix === 'none' ? 1 : new DOMMatrix(matrix).a
      feather = Math.min(1, Math.max(0, (scale - 1) / 0.3))
      if (now < until || zooming) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  })
  // In viewBox units: solid inside the inner radius, gone by the outer one.
  const maskInner = $derived(214 - 47 * feather)
  const maskOuter = $derived(240 - 20 * feather)

  const camera = $derived.by(() => {
    if (focus === null || !chopped) return 'transform: none'
    const { centre, scale } = focusOn(focus, groups, item)
    return `transform: translate(200px, 200px) scale(${scale}) translate(${-centre.x}px, ${-centre.y}px)`
  })

  function groupStyle(i: number) {
    if (fallen.has(i)) {
      const t = tumbles[i]
      return `transform: translate(${t.x}px, 700px) rotate(${t.spin}deg); opacity: 0;`
    }
    const offset = spread ? chopOffset(i, groups, !snapped) : { x: 0, y: 0, tilt: 0 }
    const pivot = groupCentre(i, groups, item)
    return `transform: translate(${offset.x}px, ${offset.y}px) rotate(${offset.tilt}deg); transform-origin: ${pivot.x}px ${pivot.y}px;`
  }
</script>

{#snippet art(frosting: string, shine: boolean)}
  {#if item === 'pizza'}
    {@render pizzaArt(shine)}
  {:else if item !== 'donut'}
    {@const Art = ITEM_ART[item]}
    <g class="art"><Art {shine} /></g>
  {:else}
  <g class="art">
  <path d={`${RING(186)} ${RING(56)}`} fill="#e3a35c" fill-rule="evenodd" />
  <path
    d={`${RING(186)} M12 190a180 180 0 1 1 360 0a180 180 0 1 1 -360 0Z`}
    fill-rule="evenodd"
    fill="#2b2b3a"
    opacity="0.16"
    clip-path="url(#donut-dough)"
    class="rim"
  />
  <path d={`${RING(70)} ${RING(56)}`} fill="#2b2b3a" opacity="0.18" fill-rule="evenodd" />
  <path d={FROSTING_PATH} fill="#2b2b3a" opacity="0.16" fill-rule="evenodd" transform="translate(3 6)" />
  <path d={FROSTING_PATH} fill={frosting} fill-rule="evenodd" class="frosting" />
  <g fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 16 : 12} opacity={shine ? 0.55 : 0.35}>
    <path d="M96 168C112 124 150 96 196 90" />
    <path d="M90 204C90 196 91 189 93 183" />
  </g>
  </g>
  {/if}
{/snippet}

<!-- The same flat style as the donut: base colours, one shadow ink, white highlights. -->
{#snippet pizzaArt(shine: boolean)}
  <g class="art">
    <path d={RING(186)} fill="#e8a955" />
    <path
      d={`${RING(186)} M12 190a180 180 0 1 1 360 0a180 180 0 1 1 -360 0Z`}
      fill-rule="evenodd"
      fill="#2b2b3a"
      opacity="0.16"
      clip-path="url(#donut-dough)"
      class="rim"
    />
    <path d={SAUCE_PATH} fill="#ec5a32" />
    <path d={CHEESE_PATH} fill="#2b2b3a" opacity="0.16" transform="translate(3 6)" />
    <path d={CHEESE_PATH} fill={CHEESE} class="frosting" />
    <g fill="#fff" opacity="0.4">
      {#each CHEESE_BLOBS as blob, i (i)}<path d={blob} />{/each}
    </g>
    <g fill="none" stroke="#fff" stroke-linecap="round" stroke-width={shine ? 13 : 10} opacity={shine ? 0.55 : 0.4}>
      <path d="M30 154.5A176 176 0 0 1 125.5 40.5" />
      <path d="M30 245.5A176 176 0 0 1 24.5 215.5" />
    </g>
  </g>
{/snippet}

{#snippet sprinkle(s: LandedSprinkle, at: Point, tap?: () => void)}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <g
    class="sprinkle"
    class:tappable={!!tap}
    style={`transform: translate(${at.x}px, ${at.y}px)`}
    role={tap ? 'button' : undefined}
    tabindex={tap ? 0 : undefined}
    aria-label={tap ? `Count this ${words.topping}` : undefined}
    onclick={(event) => {
      if (!tap) return
      // detail is 0 for clicks that don't come from a pointer (assistive tech).
      if (event.detail === 0) tap()
      else tapNearest(event, s.group)
    }}
    onkeydown={(event) => {
      if (tap && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        event.stopPropagation()
        tap()
      }
    }}
  >
    {#if tap}<circle r="21" fill="transparent" />{/if}
    {#if item === 'pizza'}
      <!-- A pepperoni: a darker rim round a red middle, flecked with fat. -->
      <g class="land">
        <circle cx="1" cy="2.5" r={PEPPERONI_RADIUS} fill="#2b2b3a" opacity="0.2" />
        <g transform={`rotate(${s.rotation})`}>
          <circle r={PEPPERONI_RADIUS} fill="#a3261f" />
          <circle cx="-0.5" cy="-0.5" r={PEPPERONI_RADIUS - 2.5} fill="#c4372b" />
          <circle cx="-3.5" cy="-2.5" r="1.9" fill="#f3b892" />
          <circle cx="3.5" cy="1.5" r="1.6" fill="#f3b892" />
          <circle cx="-0.5" cy="4.5" r="1.7" fill="#f3b892" />
        </g>
      </g>
    {:else if item !== 'donut'}
      {@const Topping = ITEM_TOPPING[item]}
      <g class="land" class:grow={pops}>
        <Topping rotation={s.rotation} toward={(Math.atan2(CENTER - at.y, CENTER - at.x) * 180) / Math.PI} />
      </g>
    {:else}
    <g class="land">
      <rect x="-13" y="-4.5" width="26" height="9" rx="4.5" fill="#2b2b3a" opacity="0.18" transform={`translate(1 2.5) rotate(${s.rotation})`} />
      <rect x="-13" y="-4.5" width="26" height="9" rx="4.5" fill={s.color} transform={`rotate(${s.rotation})`} />
    </g>
    {/if}
  </g>
{/snippet}

<svg
  bind:this={svg}
  class="donut"
  class:wobble
  class:grey-art={greyArt}
  viewBox="-20 -20 440 440"
  role="img"
  aria-label={chopped ? `A ${words.name} cut into ${groups} equal groups` : `A ${words.name}`}
>
  <defs>
    <clipPath id="donut-dough"><path d={`${RING(186)} ${RING(56)}`} clip-rule="evenodd" /></clipPath>
    {#each Array.from({ length: groups }) as _, i (i)}
      <clipPath id={`donut-wedge-${groups}-${i}`}><path d={wedgePath(i, groups)} /></clipPath>
    {/each}
  </defs>

  {#if feather > 0}
    <radialGradient id="donut-feather" gradientUnits="userSpaceOnUse" cx="200" cy="200" r={maskOuter}>
      <stop offset={maskInner / maskOuter} stop-color="#fff" />
      <stop offset="1" stop-color="#000" />
    </radialGradient>
    <mask id="donut-edge" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4400" height="4400">
      <rect x="-2000" y="-2000" width="4400" height="4400" fill="url(#donut-feather)" />
    </mask>
  {/if}
  <g mask={feather > 0 ? 'url(#donut-edge)' : undefined}>
  <g class="camera" style={camera} bind:this={cameraEl}>
  {#if !chopped}
    {@render art(FROSTING, false)}
    {#if groups > 1}
      <g class="cuts" class:chopping>
        {#each Array.from({ length: groups }) as _, i (i)}
          <g class="cut" style={`transform: rotate(${(i * 360) / groups}deg); --delay: ${i * 70}ms`}>
            <line x1="200" y1={cutFrom} x2="200" y2="2" class="cut-band" />
            <line x1="200" y1={cutFrom} x2="200" y2="2" class="cut-line" />
            {#if chopping}<line x1="200" y1="2" x2="200" y2={cutFrom} class="slash" pathLength="100" />{/if}
          </g>
        {/each}
      </g>
    {/if}
  {:else}
    {#each Array.from({ length: groups }) as _, i (i)}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <g
        bind:this={groupEls[i]}
        class="group"
        class:dimmed={dimmed.has(i)}
        class:fallen={fallen.has(i)}
        class:launched={launched.has(i)}
        class:snapped
        class:appear={reappear}
        class:grey={greyed.has(i)}
        class:pulse={pulseGroups.has(i)}
        class:tappable={!!onGroupTap}
        style={groupStyle(i)}
        role={onGroupTap ? 'button' : undefined}
        tabindex={onGroupTap ? 0 : undefined}
        aria-label={onGroupTap ? `Group ${i + 1}${glazed.has(i) ? ', kept' : ''}` : undefined}
        aria-pressed={onGroupTap ? glazed.has(i) : undefined}
        onclick={() => onGroupTap?.(i)}
        onkeydown={(event) => {
          if (onGroupTap && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            event.stopPropagation()
            onGroupTap(i)
          }
        }}
      >
        <!-- Everything but the badges, so a flying group can fade down to just its number. -->
        <g class="body">
          <g clip-path={`url(#donut-wedge-${groups}-${i})`}>
            {@render art(glazed.has(i) ? GLAZE : FROSTING, glazed.has(i))}
          </g>
          {#each sprinkles.filter((s) => s.group === i) as s (s.id)}
            {@render sprinkle(
              s,
              slots[i][s.slot],
              onSprinkleTap && focus === i ? () => onSprinkleTap(s.id) : undefined,
            )}
          {/each}
        </g>
        {#each sprinkles.filter((s) => s.group === i && counts.has(s.id)) as s (s.id)}
          {@const at = slots[i][s.slot]}
          <!-- Sits just above its sprinkle (or pepperoni) so the piece still shows. -->
          <g class="badge" style={`transform: translate(${at.x}px, ${at.y - countLift}px)`}>
            <g class="pop">
              <circle r="9" fill="#fff" stroke="#2b2b3a" stroke-width="2" />
              <text text-anchor="middle" dominant-baseline="central" y="1">{counts.get(s.id)}</text>
            </g>
          </g>
        {/each}
        {#if groupBadges.has(i)}
          {@const at = groupCentre(i, groups, item)}
          <g class="badge big" style={`transform: translate(${at.x}px, ${at.y}px)`}>
            <g class="pop">
              <circle r={badgeRadius} fill="#fff" stroke="#2b2b3a" stroke-width={badgeRadius / 8} />
              <text
                text-anchor="middle"
                dominant-baseline="central"
                y={badgeRadius / 18}
                style={`font-size: ${badgeRadius * 1.15}px`}>{groupBadges.get(i)}</text
              >
            </g>
          </g>
        {/if}
      </g>
    {/each}
  {/if}
  </g>
  </g>
</svg>

<style>
  .donut {
    width: 100%;
    height: 100%;
    overflow: visible;
    display: block;
  }

  .camera {
    transition: transform 0.7s cubic-bezier(0.3, 0.1, 0.2, 1);
  }

  .wobble {
    animation: wobble 0.5s ease-in-out;
  }

  @keyframes wobble {
    20% { transform: rotate(-5deg); }
    40% { transform: rotate(4deg); }
    60% { transform: rotate(-3deg); }
    80% { transform: rotate(2deg); }
  }

  .cut {
    transform-origin: 200px 200px;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    animation: cut-in 0.3s ease-out;
  }

  @keyframes cut-in {
    from { opacity: 0; }
  }

  .cut-band {
    stroke: #7cc4ff;
    stroke-width: 22;
    stroke-linecap: round;
    opacity: 0.35;
  }

  .cut-line {
    stroke: #1f7ae0;
    stroke-width: 5;
    stroke-linecap: round;
    stroke-dasharray: 10 10;
    animation: march 0.8s linear infinite;
  }

  @keyframes march {
    to { stroke-dashoffset: -20; }
  }

  .chopping .cut-line,
  .chopping .cut-band {
    opacity: 0;
    transition: opacity 0.2s;
  }

  /* The knife: a white streak drawn down each cut line in turn. */
  .slash {
    stroke: #fff;
    stroke-width: 9;
    stroke-linecap: round;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: slash 0.22s ease-in forwards;
    animation-delay: var(--delay);
  }

  @keyframes slash {
    to { stroke-dashoffset: 0; }
  }

  .art {
    transition: filter 0.4s;
  }

  .sprinkle {
    transition: filter 0.4s;
  }

  .grey .art,
  .grey .sprinkle,
  .grey-art .art {
    filter: grayscale(1) brightness(1.05);
  }

  /* Hover tints, so it's clear what a tap will hit. */
  .tappable:hover .body {
    filter: brightness(1.12) saturate(1.1);
  }

  .sprinkle.tappable .land {
    transition: transform 0.15s;
  }

  .sprinkle.tappable:hover .land {
    transform: scale(1.3);
  }

  .launched {
    visibility: hidden;
  }

  .group.appear {
    transition: none;
    animation: appear 0.7s ease-out;
  }

  @keyframes appear {
    from { opacity: 0; }
  }

  .sprinkle.tappable {
    cursor: pointer;
  }

  .body {
    transition: filter 0.2s;
  }

  .group {
    transition:
      transform 0.55s cubic-bezier(0.2, 0.8, 0.3, 1),
      opacity 0.35s;
    transform-box: view-box;
  }

  /* The snap back into the ring: quick, with a small spring. */
  .group.snapped:not(.fallen):not(.appear) {
    transition:
      transform 0.35s cubic-bezier(0.34, 1.7, 0.64, 1),
      opacity 0.35s;
  }

  .group.fallen {
    transition:
      transform 0.9s cubic-bezier(0.55, 0, 0.9, 0.5),
      opacity 0.9s ease-in;
  }

  .dimmed {
    opacity: 0.45;
  }

  .tappable {
    cursor: pointer;
    outline: none;
  }

  .tappable:focus-visible :global(.frosting) {
    stroke: #1f7ae0;
    stroke-width: 6;
  }

  .pulse {
    animation: group-pulse 0.9s ease-in-out infinite;
  }

  @keyframes group-pulse {
    50% { opacity: 0.6; }
  }

  .land {
    animation: land 0.25s ease-out;
  }

  @keyframes land {
    from { transform: scale(1.5); }
  }

  /* A seed or hole popping up out of the food: grow, overshoot, settle. */
  .land.grow {
    animation: grow 0.25s ease-out;
  }

  @keyframes grow {
    from { transform: scale(0); }
    60% { transform: scale(1.15); }
    to { transform: scale(1); }
  }

  .badge text {
    font-family: var(--font);
    font-weight: 700;
    font-size: 12px;
    fill: #2b2b3a;
  }

  .badge.big text {
    font-size: 32px;
  }

  .pop {
    animation: pop 0.3s cubic-bezier(0.34, 1.8, 0.64, 1);
  }

  @keyframes pop {
    from { transform: scale(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    .wobble,
    .pulse,
    .cut-line {
      animation: none;
    }
  }
</style>
