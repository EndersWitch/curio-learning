<script lang="ts">
  // What's set up around a gas syringe to collect gas, in the syringe's units
  // (see setupGeometry): the conical flask the gas comes from, its bung and
  // delivery tube, the rubber sleeve joining the tube to the nozzle, and the
  // stand clamping the barrel. Drawn over the syringe, at `zoom` like it.
  import { sizeAt } from '$lib/shared/magnify'
  import type { SyringeGeometry, setupGeometry } from './syringe'

  interface Props {
    g: SyringeGeometry
    at: ReturnType<typeof setupGeometry>
    zoom?: number
  }
  let { g, at, zoom = 1 }: Props = $props()
  const clipId = $props.id()

  const k = $derived(sizeAt(zoom))
  const f = $derived(at.flask)
  const flask = $derived(
    `M ${f.cx - f.neckHalf - 3} ${f.neckTop} H ${f.cx - f.neckHalf} V ${f.shoulder} L ${f.cx - f.bottomHalf + 4} ${at.bench - 6} ` +
      `Q ${f.cx - f.bottomHalf} ${at.bench} ${f.cx - f.bottomHalf + 8} ${at.bench} H ${f.cx + f.bottomHalf - 8} ` +
      `Q ${f.cx + f.bottomHalf} ${at.bench} ${f.cx + f.bottomHalf - 4} ${at.bench - 6} L ${f.cx + f.neckHalf} ${f.shoulder} ` +
      `V ${f.neckTop} H ${f.cx + f.neckHalf + 3}`,
  )
  const surface = $derived(at.bench - 42)
  const b = $derived(at.bung)
  const bung = $derived(
    `M ${f.cx - b.half} ${b.top} H ${f.cx + b.half} L ${f.cx + f.neckHalf - 2} ${b.bottom} H ${f.cx - f.neckHalf + 2} Z`,
  )
  // The delivery tube's middle, from inside the flask up through the bung
  // and round to the sleeve.
  const bend = 14
  const tube = $derived(`M ${f.cx} ${at.tubeBottom} V ${bend} Q ${f.cx} 0 ${f.cx + bend} 0 H ${at.sleeve.left + 8}`)
  const s = $derived(at.sleeve)
  const c = $derived(at.clamp)
</script>

<g stroke-linecap="round" stroke-linejoin="round">
  <clipPath id={clipId}><path d="{flask} Z" /></clipPath>
  <rect x={f.cx - f.bottomHalf} y={surface} width={2 * f.bottomHalf} height={at.bench - surface} fill="#dcdcdc" clip-path="url(#{clipId})" />
  <line x1={f.cx - f.bottomHalf} x2={f.cx + f.bottomHalf} y1={surface} y2={surface} stroke="#444" stroke-width={1.4 * k} clip-path="url(#{clipId})" />
  <path d={flask} fill="none" stroke="#111" stroke-width={2 * k} />

  <path d={bung} fill="#bdbdbd" stroke="#111" stroke-width={2 * k} />
  <!-- glass tube: a dark line with a white one inside, so it's hollow -->
  <path d={tube} fill="none" stroke="#111" stroke-width={2 * at.tubeHalf + 3 * k} stroke-linecap="butt" />
  <path d={tube} fill="none" stroke="#fff" stroke-width={2 * at.tubeHalf} stroke-linecap="butt" />
  <rect x={s.left} y={-s.half} width={s.right - s.left} height={2 * s.half} rx={3} fill="#bdbdbd" stroke="#111" stroke-width={2 * k} />

  <!-- the stand: a clamp round the barrel, its rod and its base -->
  <rect x={c.x - 4} y={g.half + c.reach} width={8} height={at.bench - at.base.h - g.half - c.reach} fill="#fff" stroke="#111" stroke-width={2 * k} />
  <rect x={c.x - c.half} y={-g.half - c.reach} width={2 * c.half} height={2 * (g.half + c.reach)} rx={2} fill="#fff" stroke="#111" stroke-width={2 * k} />
  <rect x={at.base.x - at.base.half} y={at.bench - at.base.h} width={2 * at.base.half} height={at.base.h} rx={2} fill="#fff" stroke="#111" stroke-width={2 * k} />
</g>
