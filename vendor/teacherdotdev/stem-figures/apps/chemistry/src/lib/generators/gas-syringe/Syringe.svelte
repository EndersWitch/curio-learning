<script lang="ts">
  // A gas syringe holding the reading's volume of gas, drawn at `zoom` (1 for
  // the whole syringe; more inside a magnifier, where lines and numbers stay
  // a comfortable size), in the units of syringeGeometry. The scale is
  // printed on the barrel, so its marks show over the plunger, which is read
  // at its flat face, the end nearest the nozzle.
  import { legibleMarks, marks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import type { Scale } from '../volume-reading/scale'
  import { UNIT_SYMBOLS, type SyringeGeometry, type VolumeUnit } from './syringe'

  interface Props {
    g: SyringeGeometry
    scale: Scale
    unit: VolumeUnit
    reading: number
    zoom?: number
  }
  let { g, scale, unit, reading, zoom = 1 }: Props = $props()

  const k = $derived(sizeAt(zoom))
  const font = $derived(11 * k)
  const shown = $derived(legibleMarks(marks({ ...scale, max: scale.capacity }), scale.minorEvery * g.perUnit * zoom, 26))
  const tick = $derived({ major: g.barrelH * 0.42, medium: g.barrelH * 0.3, minor: g.barrelH * 0.19 })

  const face = $derived(g.xOf(reading))
  // The piston fills the bore, sealing the gas in: its outline sits just
  // inside the barrel's walls, touching them without overlapping.
  const pistonLine = $derived(1.5 * k)
  const pistonHalf = $derived(g.half - k - pistonLine / 2)
  // The thick line of the piston's face ends in round caps that reach just
  // as far as its outline, rounding off its corners.
  const faceLine = $derived(2.4 * k)
  const faceHalf = $derived(pistonHalf + (pistonLine - faceLine) / 2)
  const stemHalf = $derived(g.half * 0.28)
  const knobHalf = $derived(g.half * 0.8)
  const pistonEnd = $derived(face + g.piston)

  const barrel = $derived(
    `M 0 ${-g.nozzleHalf} H ${g.nozzleEnd} L ${g.xZero} ${-g.half} H ${g.barrelEnd} ` +
      `V ${g.half} H ${g.xZero} L ${g.nozzleEnd} ${g.nozzleHalf} H 0`,
  )
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  <path d="{barrel} Z" fill="#fff" />

  <!-- the plunger: its glass piston, the stem, and the knob -->
  <rect x={pistonEnd} y={-stemHalf} width={g.stem + 2} height={2 * stemHalf} fill="#e6e6e6" stroke="#111" stroke-width={1.5 * k} />
  <rect x={pistonEnd + g.stem} y={-knobHalf} width={g.knob} height={2 * knobHalf} rx={3} fill="#e6e6e6" stroke="#111" stroke-width={2 * k} />
  <rect x={face} y={-pistonHalf} width={g.piston} height={2 * pistonHalf} fill="#e6e6e6" stroke="#111" stroke-width={pistonLine} />
  <line x1={face} x2={face} y1={-faceHalf} y2={faceHalf} stroke="#111" stroke-width={faceLine} />

  {#each shown as m (m.value)}
    {@const x = g.xOf(m.value)}
    <line x1={x} x2={x} y1={-g.half} y2={-g.half + tick[m.kind]} stroke="#111" stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
    {#if m.label}
      <text {x} y={-g.half + tick.major + 2 * k + font * 0.85} text-anchor="middle" font-size={font} fill="#111">{m.label}</text>
    {/if}
  {/each}
  <text x={g.xOf(scale.capacity)} y={-g.half - 7} text-anchor="middle" font-size={font} fill="#111">{UNIT_SYMBOLS[unit]}</text>

  <path d={barrel} fill="none" stroke="#111" stroke-width={2 * k} />
  <!-- the lip around the barrel's open end -->
  <rect x={g.barrelEnd} y={-g.half - g.lip} width={g.lip} height={2 * (g.half + g.lip)} rx={2} fill="#fff" stroke="#111" stroke-width={2 * k} />
</g>
