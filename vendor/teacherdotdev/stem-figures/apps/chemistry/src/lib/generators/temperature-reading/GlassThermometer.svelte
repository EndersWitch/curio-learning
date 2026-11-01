<script lang="ts">
  // A liquid-in-glass thermometer, its liquid risen from the bulb up the bore
  // to the reading, drawn at `zoom` (1 for the whole thermometer; more inside
  // a magnifier, where finer marks appear and lines and numbers stay a
  // comfortable size).
  import { legibleMarks, marks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import { TINT_COLORS, glassLayout, type GlassScale, type Tint } from './glass'
  import { UNIT_SYMBOLS, type TemperatureUnit } from './units'

  interface Props {
    scale: GlassScale
    unit: TemperatureUnit
    reading: number
    tint: Tint
    zoom?: number
  }
  let { scale, unit, reading, tint, zoom = 1 }: Props = $props()

  const at = $derived(glassLayout(scale))
  const k = $derived(sizeAt(zoom))
  const font = $derived(11 * k)
  const color = $derived(TINT_COLORS[tint])
  const shown = $derived(
    legibleMarks(marks({ max: scale.max, from: scale.min, labelEvery: scale.labelEvery, minorEvery: scale.minorEvery }), scale.minorEvery * at.perDegree * zoom, 16),
  )
  const tick = { major: 18, medium: 12, minor: 7 }

  const cx = $derived(at.bore.x)
  const r = 14 // the stem's rounded top

  /** The bore below the pinch swelling into the bulb, from the right side
   *  round the bottom to the left, grown by `off` on every side. The liquid
   *  fills it at 0; the glass is its outline at the wall's thickness, so the
   *  glass hugs the bulb. */
  const bulbOutline = (off: number) => {
    const n = at.bore.w / 2 + off
    const b = at.bulbHalf + off
    const [y0, y1] = [at.neckY + 4, at.neckY + 22]
    const bottom = at.bulbBottom - at.wall + off
    return (
      `L ${cx + n} ${y0} C ${cx + n} ${y0 + 9} ${cx + b} ${y1 - 9} ${cx + b} ${y1} V ${bottom - b} ` +
      `A ${b} ${b} 0 0 1 ${cx - b} ${bottom - b} V ${y1} C ${cx - b} ${y1 - 9} ${cx - n} ${y0 + 9} ${cx - n} ${y0}`
    )
  }
  // The stem, tapering evenly on both sides down to the pinch, then the glass round the bulb.
  const glass = $derived.by(() => {
    const sb = at.stemBottom
    const n = at.bore.w / 2 + at.wall
    return (
      `M ${at.left} ${at.top + r} Q ${at.left} ${at.top} ${at.left + r} ${at.top} H ${at.right - r} Q ${at.right} ${at.top} ${at.right} ${at.top + r} ` +
      `V ${sb} C ${at.right} ${sb + 24} ${cx + n} ${at.neckY - 24} ${cx + n} ${at.neckY} ` +
      bulbOutline(at.wall) +
      ` L ${cx - n} ${at.neckY} C ${cx - n} ${at.neckY - 24} ${at.left} ${sb + 24} ${at.left} ${sb} Z`
    )
  })
  const boreTop = $derived(at.yMax - 26)
  const column = $derived(at.yOf(reading))
  // The liquid, one shape from the top of the column down into the bulb.
  const liquid = $derived(`M ${cx - at.bore.w / 2} ${column} H ${cx + at.bore.w / 2} ${bulbOutline(0)} Z`)
  const labelOf = (label: string) => label.replace('-', '−')
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  <path d={glass} fill="#f5f8fa" stroke="#111" stroke-width={2 * k} />

  <!-- the bore, empty above the liquid -->
  <rect x={cx - at.bore.w / 2} y={boreTop} width={at.bore.w} height={at.neckY - boreTop} rx={at.bore.w / 2} fill="#fff" stroke="#8a8a8a" stroke-width={k} />
  <path d={liquid} fill={color} />

  <!-- marks on the left of the bore, numbers on the right -->
  {#each shown as m (m.value)}
    {@const y = at.yOf(m.value)}
    <line x1={at.tickX - tick[m.kind]} x2={at.tickX} y1={y} y2={y} stroke="#111" stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
    {#if m.label}
      <text x={at.labelX} {y} dy="0.35em" font-size={font} fill="#111">{labelOf(m.label)}</text>
    {/if}
  {/each}
  <text x={at.labelX} y={boreTop + 2} dy="0.35em" font-size={font * 1.1} font-weight="700" fill="#111">{UNIT_SYMBOLS[unit]}</text>
</g>
