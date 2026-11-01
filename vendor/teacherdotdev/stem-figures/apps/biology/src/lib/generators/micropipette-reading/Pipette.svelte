<script lang="ts">
  // A micropipette set to `volume`, its digit wheels showing it in the
  // window on the handle. In color its red wheels are red; with `decimalLine`,
  // a line across the window marks where they start too, which keeps them
  // clear on a black and white copy.
  import { DIGIT_SIZE, WHEEL_H, type PipetteLayout } from './layout'
  import { decimalAfter, digitsFor, type Pipette } from './pipette'

  interface Props {
    p: Pipette
    at: PipetteLayout
    volume: number
    color: boolean
    decimalLine: boolean
    showModel: boolean
  }
  let { p, at, volume, color, decimalLine, showModel }: Props = $props()

  const INK = '#111'
  const RED = '#c8102e'
  const TIPS = { clear: '#ffffff', yellow: '#f6cf3f', blue: '#4f8fe6' }

  const digits = $derived(digitsFor(p, volume))
  const line = $derived(decimalLine ? decimalAfter(p) : null)
  const body = $derived(color ? '#e8ebef' : '#fff')
  const accent = $derived(color && p.tip !== 'clear' ? TIPS[p.tip] : color ? '#cfd4db' : '#fff')
  const cx = $derived(at.cx)

  // The handle and its finger rest in one outline: the hook rises from the
  // handle's top behind the plunger, sweeps back and curls down to a rounded
  // end, then its underside, where the finger sits, runs back into the handle.
  const handle = $derived.by(() => {
    const h = at.handle
    const { bottom: hb, out } = at.hook
    const [l, r, t] = [cx - h.half, cx + h.half, h.top]
    return (
      `M ${l} ${h.bottom - 46} V ${t + 12} Q ${l} ${t} ${l + 12} ${t} H ${cx + 10} ` +
      `C ${cx + 22} ${t - 2} ${out - 18} ${t - 14} ${out - 4} ${t - 4} ` +
      `C ${out + 4} ${t + 6} ${out + 3} ${hb - 34} ${out - 4} ${hb - 8} ` +
      `C ${out - 6} ${hb} ${out - 15} ${hb + 1} ${out - 16} ${hb - 7} ` +
      `C ${out - 17} ${hb - 26} ${out - 18} ${t + 30} ${out - 24} ${t + 28} ` +
      `C ${out - 28} ${t + 27} ${r} ${t + 32} ${r} ${t + 46} V ${h.bottom - 46} ` +
      `C ${r} ${h.bottom - 20} ${cx + h.bottomHalf} ${h.bottom - 14} ${cx + h.bottomHalf} ${h.bottom} ` +
      `H ${cx - h.bottomHalf} C ${cx - h.bottomHalf} ${h.bottom - 14} ${l} ${h.bottom - 20} ${l} ${h.bottom - 46} Z`
    )
  })

  const shaft = $derived.by(() => {
    const s = at.shaft
    const t = s.halfAt(s.top)
    const b = s.halfAt(s.bottom)
    return `M ${cx - t} ${s.top} H ${cx + t} L ${cx + b} ${s.bottom - 3} Q ${cx + b} ${s.bottom} ${cx + b - 3} ${s.bottom} H ${cx - b + 3} Q ${cx - b} ${s.bottom} ${cx - b} ${s.bottom - 3} Z`
  })

  // The tip ejector: a sleeve around the shaft's top, narrowing smoothly from the nut.
  const ejector = $derived.by(() => {
    const { sleeve: { top, bottom }, topHalf: t, sleeveHalf: b } = at.ejector
    const bend = (bottom - top) * 0.5
    return (
      `M ${cx - t} ${top} H ${cx + t} C ${cx + t} ${top + bend} ${cx + b} ${bottom - bend} ${cx + b} ${bottom - 3} ` +
      `Q ${cx + b} ${bottom} ${cx + b - 3} ${bottom} H ${cx - b + 3} Q ${cx - b} ${bottom} ${cx - b} ${bottom - 3} ` +
      `C ${cx - b} ${bottom - bend} ${cx - t} ${top + bend} ${cx - t} ${top} Z`
    )
  })

  const tip = $derived.by(() => {
    const t = at.tip
    const rim = 7
    return {
      rim: { x: cx - t.topHalf - 1.5, y: t.top, width: 2 * t.topHalf + 3, height: rim },
      cone: `M ${cx - t.topHalf} ${t.top + rim} H ${cx + t.topHalf} L ${cx + t.bottomHalf} ${t.bottom} H ${cx - t.bottomHalf} Z`,
    }
  })
</script>

<g stroke-linejoin="round" stroke-linecap="round">
  <!-- the plunger: its colored cap on a wide neck, down into the handle -->
  <rect x={cx - at.rod.half} y={at.rod.top - 2} width={2 * at.rod.half} height={at.rod.bottom - at.rod.top + 6} fill={body} stroke={INK} stroke-width="2" />
  <path
    d="M {cx - at.button.half} {at.button.bottom} V {at.button.top + 5} Q {cx - at.button.half} {at.button.top} {cx - at.button.half + 5} {at.button.top} H {cx + at.button.half - 5} Q {cx + at.button.half} {at.button.top} {cx + at.button.half} {at.button.top + 5} V {at.button.bottom} Z"
    fill={accent}
    stroke={INK}
    stroke-width="2"
  />

  <!-- the handle with its finger rest, over the plunger's neck -->
  <path d={handle} fill={body} stroke={INK} stroke-width="2" />

  <!-- the shaft, with the tip ejector around it and the nut joining it to the handle -->
  <path d={shaft} fill={body} stroke={INK} stroke-width="2" />
  <path d={ejector} fill={body} stroke={INK} stroke-width="2" />
  <rect x={cx - at.nut.half} y={at.nut.top - 2} width={2 * at.nut.half} height={at.nut.bottom - at.nut.top + 2} rx={3} fill={body} stroke={INK} stroke-width="2" />

  {#if at.withTip}
    <path d={tip.cone} fill={TIPS[p.tip]} fill-opacity={color ? 0.75 : 0} stroke={INK} stroke-width="1.6" />
    <rect {...tip.rim} rx={1.5} fill={TIPS[p.tip]} fill-opacity={color ? 0.9 : 0} stroke={INK} stroke-width="1.6" />
  {/if}

  <!-- its size, printed above the window -->
  {#if showModel}
    <text x={cx} y={at.modelY} dy="0.35em" text-anchor="middle" font-size="12" font-weight="700" fill={INK}>{p.name}</text>
  {/if}

  <!-- the window and its digit wheels, read top to bottom -->
  <rect x={at.window.left} y={at.window.top} width={at.window.right - at.window.left} height={at.window.bottom - at.window.top} rx={5} fill="#fff" stroke={INK} stroke-width="2.2" />
  {#each digits as d, i (i)}
    {@const top = at.wheels.top + i * WHEEL_H}
    {#if i > 0}
      <line x1={at.wheels.left} x2={at.wheels.right} y1={top} y2={top} stroke={INK} stroke-opacity="0.35" stroke-width="0.8" />
    {/if}
    <text x={cx} y={at.wheelY(i)} dy="0.36em" text-anchor="middle" font-size={DIGIT_SIZE} font-weight="700" fill={color && p.red[i] ? RED : INK}>{d}</text>
  {/each}
  {#if line !== null}
    {@const y = at.wheels.top + line * WHEEL_H}
    <line x1={at.window.left} x2={at.window.right} y1={y} y2={y} stroke={INK} stroke-width="2.4" stroke-linecap="butt" />
  {/if}
</g>
