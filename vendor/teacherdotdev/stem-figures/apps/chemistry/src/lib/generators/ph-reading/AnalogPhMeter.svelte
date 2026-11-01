<script lang="ts">
  // An analog pH meter, its needle swung over the dial to the reading, wired
  // to a pH electrode in a beaker. Drawn at `zoom` (1 for the whole meter;
  // more inside a magnifier, where lines and numbers stay a comfortable size).
  import { legibleMarks, marks } from '$lib/shared/marks'
  import { sizeAt } from '$lib/shared/magnify'
  import Electrode from './Electrode.svelte'
  import { ANALOG_METER as M, dialPoint, perPh } from './analog'
  import { ANALOG_SCALE, PH_MAX, PH_MIN } from './readings'

  let { reading, zoom = 1 }: { reading: number; zoom?: number } = $props()

  const k = $derived(sizeAt(zoom))
  const shown = $derived(
    legibleMarks(marks({ max: PH_MAX, from: PH_MIN, labelEvery: ANALOG_SCALE.labelEvery, minorEvery: ANALOG_SCALE.minorEvery }), ANALOG_SCALE.minorEvery * perPh * zoom, 14),
  )
  const w = M.window
  const [start, end] = [dialPoint(PH_MIN), dialPoint(PH_MAX)]
  const arc = `M ${start.x} ${start.y} A ${M.radius} ${M.radius} 0 0 1 ${end.x} ${end.y}`
  const tip = $derived(dialPoint(reading, M.needleOut))
</script>

<Electrode x={M.electrode} top={52} bottom={M.height - 8} from={{ x: 262, y: 24 }} />

<g stroke-linejoin="round" stroke-linecap="round">
  <rect x="250" y="22" width="24" height="12" rx="3" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="10" y="30" width="280" height={M.height - 38} rx="18" fill="#fff" stroke="#111" stroke-width="2" />

  <!-- the dial's face, its arc, marks and numbers -->
  <rect x={w.left} y={w.top} width={w.right - w.left} height={w.bottom - w.top} rx="6" fill="#fbfaf4" stroke="#111" stroke-width={2 * k} />
  <path d={arc} fill="none" stroke="#111" stroke-width={1.5 * k} />
  {#each shown as m (m.value)}
    {@const a = dialPoint(m.value)}
    {@const b = dialPoint(m.value, M.tick[m.kind])}
    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#111" stroke-width={(m.kind === 'major' ? 1.5 : 1) * k} />
    {#if m.label}
      {@const at = dialPoint(m.value, M.labelOut)}
      <text x={at.x} y={at.y} dy="0.35em" text-anchor="middle" font-size={11 * k} fill="#111">{m.label}</text>
    {/if}
  {/each}
  <text x={M.pivot.x} y={M.pivot.y - 62} text-anchor="middle" font-size="20" font-weight="700" fill="#111">pH</text>

  <!-- the needle on its hub -->
  <line x1={M.pivot.x} y1={M.pivot.y} x2={tip.x} y2={tip.y} stroke="#111" stroke-width={1.8 * k} />
  <circle cx={M.pivot.x} cy={M.pivot.y} r="8" fill="#555" stroke="#111" stroke-width="1.5" />

  <!-- controls -->
  {#each [['CAL', 90], ['TEMP', 210]] as const as [name, x]}
    <circle cx={x} cy="274" r="15" fill="#fff" stroke="#111" stroke-width="2" />
    <line x1={x} y1="274" x2={x} y2="262" stroke="#111" stroke-width="2" />
    <text {x} y="306" text-anchor="middle" font-size="10" font-weight="700" fill="#111">{name}</text>
  {/each}
</g>
