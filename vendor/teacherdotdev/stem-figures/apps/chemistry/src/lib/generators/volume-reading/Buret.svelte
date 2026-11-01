<script lang="ts">
  // A buret filled from its stopcock up to the reading, drawn at `zoom` (see
  // GraduatedCylinder). Its numbers grow downward from 0 near the top.
  import { legibleMarks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import ReadingGuide from './ReadingGuide.svelte'
  import ScaleTicks from './ScaleTicks.svelte'
  import { buretLayout } from './buret'
  import { LIQUID_COLORS, meniscusCurve, type LiquidTint } from './liquid'
  import { scaleMarks, type VolumeScale } from './scale'

  interface Props {
    scale: VolumeScale
    reading: number
    tint: LiquidTint
    unit: string
    guide?: boolean
    zoom?: number
  }
  let { scale, reading, tint, unit, guide = false, zoom = 1 }: Props = $props()
  const clipId = $props.id()

  const at = buretLayout()
  const k = $derived(sizeAt(zoom))
  const font = $derived(10 * k)
  const liquid = $derived(LIQUID_COLORS[tint])
  const shown = $derived(legibleMarks(scaleMarks(scale), scale.minorEvery * at.perMl * zoom, 15))

  const neckTop = at.taperTop + 22
  const cavity =
    `M ${at.left} ${at.tubeTop} V ${at.taperTop} L ${at.cx - at.neckW / 2} ${neckTop} V ${at.tipTop} ` +
    `L ${at.cx - 1.5} ${at.tipBottom} H ${at.cx + 1.5} L ${at.cx + at.neckW / 2} ${at.tipTop} V ${neckTop} L ${at.right} ${at.taperTop} V ${at.tubeTop}`
  const surface = $derived(meniscusCurve(at.left, at.right, at.yOf(reading), at.meniscus))
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  <clipPath id={clipId}><path d="{cavity} Z" /></clipPath>
  <path d="{surface} V {at.tipBottom} H {at.left} Z" fill={liquid.fill} clip-path="url(#{clipId})" />

  <ScaleTicks {shown} left={at.left} tubeW={at.tubeW} yOf={at.yOf} {k} {font} />
  <text x={at.cx} y={at.yOf(0) - 24} text-anchor="middle" font-size={font} fill="#111">{unit}</text>

  <path d={surface} fill="none" stroke={liquid.surface} stroke-width={1.6 * k} />
  {#if guide}<ReadingGuide x1={at.cx} x2={at.left} y={at.yOf(reading)} {k} />{/if}
  <path d={cavity} fill="none" stroke="#111" stroke-width={2 * k} />
  <!-- the open top's lip -->
  <path d="M {at.left - 3} {at.tubeTop} H {at.left} M {at.right} {at.tubeTop} H {at.right + 3}" stroke="#111" stroke-width={2 * k} />

  <!-- the stopcock: a barrel across the neck, turned by its handle -->
  <rect x={at.cx - 32} y={at.stopcockY - 4} width={64} height={8} rx={4} fill="#fff" stroke="#111" stroke-width={2 * k} />
  <circle cx={at.cx} cy={at.stopcockY} r={9} fill="#fff" stroke="#111" stroke-width={2 * k} />
  <line x1={at.cx - 4} x2={at.cx + 4} y1={at.stopcockY} y2={at.stopcockY} stroke="#111" stroke-width={2 * k} />
</g>
