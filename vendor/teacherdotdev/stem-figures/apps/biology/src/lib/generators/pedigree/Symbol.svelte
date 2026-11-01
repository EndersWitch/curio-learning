<script lang="ts">
  // One person's pedigree symbol, centered on (x, y): a square for a male, a
  // circle for a female, a diamond for sex unknown. Filled when affected; a
  // carrier half filled or with a dot in the middle; a slash from lower left
  // to upper right when deceased; an arrow from the lower left for the proband.
  import type { Person } from './family'
  import type { CarrierStyle } from './settings'

  interface Props {
    person: Person
    x: number
    y: number
    size: number
    carriers: CarrierStyle
  }
  let { person, x, y, size, carriers }: Props = $props()

  const INK = '#111'
  const STROKE = $derived(size > 30 ? 2 : 1.6)
  const r = $derived(size / 2)
  /** A square drawn a little smaller than a circle looks the same size. */
  const sq = $derived(size * 0.47)
  /** A diamond's half diagonal. */
  const dm = $derived(size * 0.6)
  const outline = $derived(
    person.sex === 'm'
      ? `M ${x - sq} ${y - sq} H ${x + sq} V ${y + sq} H ${x - sq} Z`
      : person.sex === 'u'
        ? `M ${x} ${y - dm} L ${x + dm} ${y} L ${x} ${y + dm} L ${x - dm} ${y} Z`
        : `M ${x} ${y - r} A ${r} ${r} 0 0 1 ${x} ${y + r} A ${r} ${r} 0 0 1 ${x} ${y - r} Z`,
  )
  /** The left half, for a half-filled carrier. */
  const leftHalf = $derived(
    person.sex === 'm'
      ? `M ${x} ${y - sq} H ${x - sq} V ${y + sq} H ${x} Z`
      : person.sex === 'u'
        ? `M ${x} ${y - dm} L ${x - dm} ${y} L ${x} ${y + dm} Z`
        : `M ${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Z`,
  )
  const carrier = $derived(person.carrier && !person.affected && carriers !== 'none')
  const slash = $derived(size * 0.72)
  // The proband's arrow comes in from the lower left, shallower than the
  // deceased slash so the two never lie along each other.
  const ANGLE = (20 * Math.PI) / 180
  const [cos, sin] = [Math.cos(ANGLE), Math.sin(ANGLE)]
  /** Where the arrow's point touches: the symbol's edge, 20° below its left side. */
  const tip = $derived.by(() => {
    if (person.sex === 'm') return [x - sq - 2, y + sq * 0.42]
    if (person.sex === 'u') return [x - dm * 0.74 - 2, y + dm * 0.26]
    return [x - r * cos - 2, y + r * sin + 1]
  })
  const length = $derived(size * 0.55)
  const head = $derived(size * 0.26)
  /** The arrowhead: its point at the tip, its base back down the shaft. */
  const arrowHead = $derived.by(() => {
    const [tx, ty] = tip
    const [bx, by] = [tx - head * cos, ty + head * sin]
    const [px, py] = [head * 0.4 * sin, head * 0.4 * cos]
    return `M ${tx} ${ty} L ${bx + px} ${by + py} L ${bx - px} ${by - py} Z`
  })
</script>

<g>
  <path d={outline} fill={person.affected ? INK : '#fff'} stroke={INK} stroke-width={STROKE} stroke-linejoin="miter" />
  {#if carrier && carriers === 'half'}
    <path d={leftHalf} fill={INK} />
    <line x1={x} y1={y - (person.sex === 'm' ? sq : person.sex === 'u' ? dm : r)} x2={x} y2={y + (person.sex === 'm' ? sq : person.sex === 'u' ? dm : r)} stroke={INK} stroke-width={STROKE} />
  {:else if carrier}
    <circle cx={x} cy={y} r={size * 0.12} fill={INK} />
  {/if}
  {#if person.deceased}
    <line x1={x - slash} y1={y + slash} x2={x + slash} y2={y - slash} stroke={INK} stroke-width={STROKE} stroke-linecap="round" />
  {/if}
  {#if person.proband}
    <line x1={tip[0] - length * cos} y1={tip[1] + length * sin} x2={tip[0] - head * 0.6 * cos} y2={tip[1] + head * 0.6 * sin} stroke={INK} stroke-width={STROKE} />
    <path d={arrowHead} fill={INK} />
  {/if}
</g>
