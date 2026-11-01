<script lang="ts">
  // A beaker holding liquid up to the reading, drawn at `zoom` (see
  // GraduatedCylinder).
  import { legibleMarks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import { beakerLayout } from './beaker'
  import ScaleTicks from './ScaleTicks.svelte'
  import { LIQUID_COLORS, flatMeniscusCurve, type LiquidTint } from './liquid'
  import { scaleMarks, type VolumeScale } from './scale'

  interface Props {
    scale: VolumeScale
    reading: number
    tint: LiquidTint
    unit: string
    zoom?: number
  }
  let { scale, reading, tint, unit, zoom = 1 }: Props = $props()

  const at = $derived(beakerLayout(scale))
  const k = $derived(sizeAt(zoom))
  const font = $derived(11 * k)
  const liquid = $derived(LIQUID_COLORS[tint])
  // A beaker isn't marked at 0.
  const shown = $derived(
    legibleMarks(scaleMarks(scale), scale.minorEvery * at.perMl * zoom, 16).filter((m) => m.value > 0),
  )

  const surface = $derived(flatMeniscusCurve(at.left, at.right, at.yOf(reading), at.meniscus, at.meniscusEdge))
  const r = 12 // inside corner radius at the bottom
  const glass = $derived(
    `M ${at.left} ${at.wallTop} V ${at.innerBottom - r} Q ${at.left} ${at.innerBottom} ${at.left + r} ${at.innerBottom} ` +
      `H ${at.right - r} Q ${at.right} ${at.innerBottom} ${at.right} ${at.innerBottom - r} V ${at.wallTop}`,
  )
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  {#if reading > 0}
    <path
      d="{surface} V {at.innerBottom - r} Q {at.right} {at.innerBottom} {at.right - r} {at.innerBottom} H {at.left + r} Q {at.left} {at.innerBottom} {at.left} {at.innerBottom - r} Z"
      fill={liquid.fill}
    />
  {/if}

  <ScaleTicks {shown} left={at.scaleLeft} tubeW={at.scaleW} yOf={at.yOf} {k} {font} />
  <text x={at.readX} y={at.yOf(scale.capacity) - 22} text-anchor="middle" font-size={font} fill="#111">{unit}</text>

  {#if reading > 0}
    <path d={surface} fill="none" stroke={liquid.surface} stroke-width={1.6 * k} />
  {/if}

  <path d={glass} fill="none" stroke="#111" stroke-width={2 * k} />
  <!-- the rim: a pouring spout on the left, a small lip on the right -->
  <path
    d="M {at.left} {at.wallTop} Q {at.left} {at.rimTop + 1} {at.left - 10} {at.rimTop} M {at.right} {at.wallTop} Q {at.right} {at.rimTop + 3} {at.right + 4} {at.rimTop + 2}"
    fill="none"
    stroke="#111"
    stroke-width={2 * k}
  />
</g>
