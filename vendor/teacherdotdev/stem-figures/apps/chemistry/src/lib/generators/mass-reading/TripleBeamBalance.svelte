<script lang="ts" module>
  // Where things sit on the drawing, shared with the figure's layout so the
  // magnifier can find the front beam's rider.
  export const TRIPLE_BEAM = {
    width: 692,
    height: 292,
    beamStart: 236,
    beamLength: 360,
    /** the marks are inset from the beams' ends */
    markStart: 248,
    markLength: 336,
    /** top of each beam: rear (0–100 g), middle (0–500 g), front (0–10 g) */
    beamTops: [122, 170, 218],
    beamH: 24,
    /** drawing units per gram on the front beam */
    frontPerGram: 33.6,
    /** the pan's middle and its top surface, where an object rests */
    pan: { cx: 98, top: 142 },
  }
  export const frontRiderX = (front: number) => TRIPLE_BEAM.markStart + front * TRIPLE_BEAM.frontPerGram
  /** the front rider's point, where the magnifier centers */
  export const frontBeamY = TRIPLE_BEAM.beamTops[2] + 4
  /** the part drawn with `beamsOnly`: the beams, their riders and the block
   *  on their left, with a margin */
  export const TRIPLE_BEAM_BEAMS = (() => {
    const B = TRIPLE_BEAM
    const margin = 8
    const x = B.beamStart - 18 - margin
    const y = B.beamTops[0] - 5 - margin
    return { x, y, width: B.beamStart + B.beamLength + margin - x, height: B.beamTops[2] + B.beamH + 4 + margin - y }
  })()
</script>

<script lang="ts">
  // A triple beam balance with its riders placed for a mass, drawn at `zoom`
  // (1 for the whole balance; more inside a magnifier on the front beam).
  // `beamsOnly` leaves out the base, the pan and its arm (and any object on
  // the pan), and the pointer.
  import { legibleMarks, marks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import type { Placed } from '../volume-by-displacement/objects'
  import ObjectShape from '../volume-by-displacement/ObjectShape.svelte'
  import { splitRiders } from './tripleBeam'

  let {
    mass,
    zoom = 1,
    beamsOnly = false,
    object = null,
  }: { mass: number; zoom?: number; beamsOnly?: boolean; object?: Placed | null } = $props()

  const B = TRIPLE_BEAM
  const k = $derived(sizeAt(zoom))
  const riders = $derived(splitRiders(mass))
  const x0 = B.beamStart
  const x1 = B.beamStart + B.beamLength
  const [rearTop, middleTop, frontTop] = B.beamTops

  const notched = [
    { top: rearTop, max: 100, step: 10 },
    { top: middleTop, max: 500, step: 100 },
  ]
  const xOn = (value: number, max: number) => B.markStart + (value / max) * B.markLength
  const front = $derived(
    legibleMarks(marks({ max: 10, labelEvery: 1, minorEvery: 0.1 }), 0.1 * B.frontPerGram * zoom, 14),
  )
  /** the V notches in the rear and middle beams, which their riders' points drop into */
  const notch = { half: 4, depth: 5 }
  const notchValues = (beam: { max: number; step: number }) =>
    Array.from({ length: beam.max / beam.step + 1 }, (_, i) => i * beam.step)
  /** a notched beam's outline, its top edge dipping into each notch rather than running across it */
  const notchedOutline = (beam: { top: number; max: number; step: number }) => {
    const { top } = beam
    const dips = notchValues(beam)
      .map((v) => xOn(v, beam.max))
      .map((x) => `H ${x - notch.half} L ${x} ${top + notch.depth} L ${x + notch.half} ${top}`)
      .join(' ')
    return `M ${x0} ${top} ${dips} H ${x1} V ${top + B.beamH} H ${x0} Z`
  }
  const tick = { major: 10, medium: 7, minor: 4.5 }
  /** A rider's half-width, how far it hangs down the beam's face, and the point under it. */
  interface RiderShape { half: number; lip: number; point: { half: number; depth: number } }
  /** The notched beams' riders are wide blocks whose point marks the notch they sit in. */
  const notchedRider: RiderShape = { half: 12, lip: 6, point: { half: 3, depth: 4 } }
  /** The front rider is a thin clip, its point reaching onto the marks but
   *  narrow enough to leave the neighboring ones showing. */
  const frontRider: RiderShape = { half: 9, lip: 1, point: { half: 1.5, depth: 3.5 } }
  const pointerY = middleTop + B.beamH / 2
</script>

{#snippet rider(x: number, top: number, shape: RiderShape)}
  <!-- a short block hooked over the beam's top edge, hanging a little way
       down its face, with a point under its middle marking the reading -->
  {@const { half, lip, point } = shape}
  <path
    d="M {x - half} {top - 5} H {x + half} V {top + lip} H {x + point.half} L {x} {top + lip + point.depth} L {x - point.half} {top + lip} H {x - half} Z"
    fill="#d4d4d4"
    stroke="#111"
    stroke-width={1.5 * k}
  />
{/snippet}

<g stroke-linejoin="round" stroke-linecap="round">
  {#if !beamsOnly}
    <!-- base, and the column holding up the pan -->
    <rect x="8" y="254" width="676" height="34" rx="10" fill="#fff" stroke="#111" stroke-width={2 * k} />
    <rect x="88" y="158" width="20" height="96" fill="#fff" stroke="#111" stroke-width={2 * k} />
    <path d="M 18 142 H 178 L 168 154 Q 98 162 28 154 Z" fill="#fff" stroke="#111" stroke-width={2 * k} />
    {#if object}
      <ObjectShape placed={object} {k} />
    {/if}

    <!-- the arm from the pan to the block holding the beams, which rests on a knife-edge pivot -->
    <rect x="108" y="164" width={x0 - 126} height="9" fill="#fff" stroke="#111" stroke-width={2 * k} />
    <path d="M {x0 - 9} {frontTop + B.beamH + 4} L {x0 + 1} 254 H {x0 - 19} Z" fill="#fff" stroke="#111" stroke-width={2 * k} />
  {/if}
  <rect x={x0 - 18} y={rearTop - 4} width="18" height={frontTop + B.beamH - rearTop + 8} fill="#fff" stroke="#111" stroke-width={2 * k} />

  <!-- the two notched beams -->
  {#each notched as beam (beam.max)}
    <path d={notchedOutline(beam)} fill="#fff" stroke="#111" stroke-width={2 * k} />
    {#each notchValues(beam) as v (v)}
      {@const x = xOn(v, beam.max)}
      <text {x} y={beam.top + B.beamH - 5} text-anchor="middle" font-size={10 * k} fill="#111">{v}</text>
    {/each}
  {/each}

  <!-- the front beam, marked every 0.1 g -->
  <rect x={x0} y={frontTop} width={B.beamLength} height={B.beamH} fill="#fff" stroke="#111" stroke-width={2 * k} />
  {#each front as m (m.value)}
    {@const x = xOn(m.value, 10)}
    <line x1={x} x2={x} y1={frontTop} y2={frontTop + tick[m.kind] * Math.min(1, 1.6 * k)} stroke="#111" stroke-width={(m.kind === 'major' ? 1.4 : 1) * k} />
    {#if m.label}
      <text {x} y={frontTop + B.beamH - 3 * k} text-anchor="middle" font-size={9 * k} fill="#111">{m.label}</text>
    {/if}
  {/each}

  {#if !beamsOnly}
    <!-- pointer at zero on its scale, which stands on a post from the base -->
    <rect x={x1 + 51} y={pointerY + 30} width="10" height={254 - pointerY - 30} fill="#fff" stroke="#111" stroke-width={2 * k} />
    <path d="M {x1} {rearTop} H {x1 + 22} L {x1 + 44} {pointerY} L {x1 + 22} {frontTop + B.beamH} H {x1}" fill="none" stroke="#111" stroke-width={2 * k} />
    <rect x={x1 + 48} y={pointerY - 30} width="16" height="60" fill="#fff" stroke="#111" stroke-width={1.6 * k} />
    {#each [-20, -10, 0, 10, 20] as dy}
      <line x1={x1 + 48} x2={x1 + (dy === 0 ? 62 : 56)} y1={pointerY + dy} y2={pointerY + dy} stroke="#111" stroke-width={(dy === 0 ? 1.6 : 1) * k} />
    {/each}
    <line x1={x1 + 30} x2={x1 + 50} y1={pointerY} y2={pointerY} stroke="#111" stroke-width={2 * k} />
  {/if}

  <!-- riders -->
  {@render rider(xOn(riders.tens, 100), rearTop, notchedRider)}
  {@render rider(xOn(riders.hundreds, 500), middleTop, notchedRider)}
  {@render rider(xOn(riders.front, 10), frontTop, frontRider)}
</g>
