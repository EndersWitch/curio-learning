<script lang="ts">
  // A spring scale, its pointer pulled down the slot to `pointer` newtons,
  // with whatever hangs from its hook, drawn at `zoom` (1 for the whole
  // scale; more inside a magnifier, where finer marks appear and lines and
  // numbers stay a comfortable size). With `marksAbove`, unnumbered marks run
  // on above zero, for a pointer resting up there.
  import { legibleMarks, marks, type Mark } from '$shared/marks'
  import { sizeAt } from '$shared/magnify'
  import { inGrams, loadLayout, springLayout, type Hanging, type ScaleUnits, type SpringScale } from './scale'

  interface Props {
    scale: SpringScale
    units: ScaleUnits
    pointer: number
    color: boolean
    hanging?: Hanging
    masses?: number
    blockLabel?: string
    marksAbove?: boolean
    zoom?: number
  }
  let { scale, units, pointer, color, hanging = 'none', masses = 1, blockLabel = '', marksAbove = false, zoom = 1 }: Props = $props()

  const at = $derived(springLayout(scale))
  const load = $derived(loadLayout(at, hanging, masses))
  const k = $derived(sizeAt(zoom))
  const font = $derived(11 * k)
  const tick = { major: 18, medium: 12, minor: 7 }
  const INK = '#111'

  const body = $derived(color ? scale.color : '#fff')
  const cap = $derived(color ? scale.color : '#d9d9d9')
  const capInk = $derived(color ? scale.ink : INK)
  const pointerColor = $derived(color ? '#d42a2a' : INK)

  /** The marks worth drawing along one side: the printed scale, and the unnumbered marks above zero. */
  function side(s: { capacity: number; labelEvery: number; minorEvery: number }): Mark[] {
    const printed = marks({ max: s.capacity, labelEvery: s.labelEvery, minorEvery: s.minorEvery })
    const above =
      marksAbove
        ? marks({ max: s.capacity / 10, labelEvery: s.labelEvery, minorEvery: s.minorEvery })
            .slice(1)
            .map((m) => ({ value: -m.value, kind: m.kind }))
        : []
    return legibleMarks([...above.reverse(), ...printed], scale.minorEvery * at.perNewton * zoom, 16)
  }
  const grams = $derived(inGrams(scale))
  const newtonMarks = $derived(units === 'grams' ? [] : side(scale))
  const gramMarks = $derived(units === 'newtons' ? [] : side(grams))
  /** a mark's height on the scale: gram values are 100 times the newtons they sit level with */
  const yOfGrams = (g: number) => at.yOf(g / (grams.capacity / scale.capacity))

  // Newtons always on the left of the slot, grams always on the right,
  // whichever are printed.
  const leftNumbersX = $derived(at.tickLeft - tick.major - 4)
  const rightNumbersX = $derived(at.tickRight + tick.major + 4)

  const y = $derived(at.yOf(pointer))
  const tabH = 10
  /** The spring, zigzagging from the slot's top down to the pointer's tab: the same coils, stretched further as it pulls. */
  const spring = $derived.by(() => {
    const top = at.slot.top + 3
    const coils = 16
    const step = (y - top) / (coils * 2)
    const w = at.slot.half - 2
    let d = `M ${at.cx} ${top}`
    for (let i = 0; i < coils * 2; i++) d += ` L ${at.cx + (i % 2 ? w : -w)} ${top + (i + 0.5) * step}`
    return `${d} L ${at.cx} ${y}`
  })
  const capText = $derived(
    units === 'newtons' ? `${scale.capacity} N` : units === 'grams' ? `${grams.capacity} g` : `${scale.capacity} N / ${grams.capacity} g`,
  )
  const labelOf = (label: string) => label.replace('-', '−')
  const r = 10 // the body's rounded corners

  const hook = $derived(
    `M ${at.cx} ${at.rodBottom} L ${at.cx + 9} ${at.rodBottom + 9} V ${at.hookBottom - 9} ` +
      `A 9 9 0 0 1 ${at.cx - 9} ${at.hookBottom - 9} V ${at.hookBottom - 17}`,
  )
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  <!-- the ring to hold it by, on the cap -->
  <circle cx={at.cx} cy={at.ring.cy} r={at.ring.r} fill="none" stroke={INK} stroke-width={2.4 * k} />
  <line x1={at.cx} x2={at.cx} y1={at.ring.cy + at.ring.r} y2={at.capTop} stroke={INK} stroke-width={3 * k} />

  <!-- the rod down to the hook, drawn first so the body covers its top -->
  <line x1={at.cx} x2={at.cx} y1={at.bodyBottom - 4} y2={at.rodBottom} stroke={INK} stroke-width={3.2 * k} />
  <path d={hook} fill="none" stroke={INK} stroke-width={2.6 * k} />

  <!-- the body: a tint of its color, so the marks stay black on it -->
  <rect x={at.left} y={at.bodyTop - r} width={at.right - at.left} height={at.bodyBottom - at.bodyTop + r} rx={r} fill="#fff" stroke={INK} stroke-width={2 * k} />
  <rect x={at.left} y={at.bodyTop - r} width={at.right - at.left} height={at.bodyBottom - at.bodyTop + r} rx={r} fill={body} fill-opacity={color ? 0.16 : 0} />
  <rect x={at.left} y={at.capTop} width={at.right - at.left} height={at.bodyTop - at.capTop} rx={6} fill={cap} stroke={INK} stroke-width={2 * k} />
  <text x={at.cx} y={(at.capTop + at.bodyTop) / 2} dy="0.35em" text-anchor="middle" font-size={10 * k} font-weight="700" fill={capInk}>{capText}</text>

  <!-- the slot, with the spring pulling the pointer's tab down it -->
  <rect x={at.cx - at.slot.half} y={at.slot.top} width={2 * at.slot.half} height={at.slot.bottom - at.slot.top} rx={2} fill="#fff" stroke="#8a8a8a" stroke-width={k} />
  <path d={spring} fill="none" stroke="#8a8a8a" stroke-width={1.2 * k} />
  <line x1={at.cx} x2={at.cx} y1={y + tabH} y2={at.slot.bottom} stroke="#8a8a8a" stroke-width={2 * k} />
  <rect x={at.cx - at.slot.half + 1} y={y} width={2 * at.slot.half - 2} height={tabH} fill={color ? scale.color : '#8a8a8a'} stroke={INK} stroke-width={0.8 * k} />

  <!-- marks and numbers -->
  {#each newtonMarks as m (m.value)}
    {@const my = at.yOf(m.value)}
    <line x1={at.tickLeft - tick[m.kind]} x2={at.tickLeft} y1={my} y2={my} stroke={INK} stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
    {#if m.label}<text x={leftNumbersX} y={my} dy="0.35em" text-anchor="end" font-size={font} fill={INK}>{labelOf(m.label)}</text>{/if}
  {/each}
  {#each gramMarks as m (m.value)}
    {@const my = yOfGrams(m.value)}
    <line x1={at.tickRight} x2={at.tickRight + tick[m.kind]} y1={my} y2={my} stroke={INK} stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
    {#if m.label}<text x={rightNumbersX} y={my} dy="0.35em" font-size={font} fill={INK}>{labelOf(m.label)}</text>{/if}
  {/each}
  {#if units !== 'grams'}
    <text x={leftNumbersX} y={at.headerY} dy="0.35em" text-anchor="end" font-size={font * 1.1} font-weight="700" fill={INK}>N</text>
  {/if}
  {#if units !== 'newtons'}
    <text x={rightNumbersX} y={at.headerY} dy="0.35em" font-size={font * 1.1} font-weight="700" fill={INK}>g</text>
  {/if}

  <!-- the pointer: its line runs the same way out on both sides of the slot, whichever units are printed -->
  <line x1={at.tickLeft - tick.major} x2={at.tickRight + tick.major} y1={y} y2={y} stroke={pointerColor} stroke-width={1.6 * k} />

  <!-- the load -->
  {#if load.kind === 'block'}
    <line x1={at.cx} x2={at.cx} y1={at.hookBottom - 1} y2={load.stringTo} stroke={INK} stroke-width={1.5 * k} />
    <rect {...load.box} rx={3} fill="#e5e7eb" stroke={INK} stroke-width={2 * k} />
    {#if blockLabel}
      <text x={at.cx} y={load.box.y + load.box.height / 2} dy="0.35em" text-anchor="middle" font-size={16 * k} font-weight="700" fill={INK}>{blockLabel}</text>
    {/if}
  {:else if load.kind === 'masses'}
    <line x1={at.cx} x2={at.cx} y1={at.hookBottom - 1} y2={load.base.y} stroke={INK} stroke-width={2 * k} />
    {#each load.discs as d, i (i)}
      <rect {...d} rx={2} fill="#c9ced6" stroke={INK} stroke-width={1.4 * k} />
    {/each}
    <rect {...load.base} rx={1.5} fill="#555" stroke={INK} stroke-width={1.4 * k} />
  {/if}
</g>
