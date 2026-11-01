<script lang="ts">
  // A digital probe thermometer: a handheld meter showing the temperature on
  // its display, wired to a steel probe standing in a beaker of liquid.
  import { segmentTextWidth, sevenSegment } from '$lib/shared/sevenSegment'
  import { UNIT_SYMBOLS, type TemperatureUnit } from './units'

  let { reading, decimals, unit }: { reading: number; decimals: number; unit: TemperatureUnit } = $props()

  // The temperature right-aligned against the unit, as on a real display.
  const DIGIT_H = 36
  const DISPLAY_RIGHT = 160
  const text = $derived(reading.toFixed(decimals))
  const digits = $derived(sevenSegment(text, DISPLAY_RIGHT - segmentTextWidth(text, DIGIT_H), 102, DIGIT_H))
  const probe = 300
  const beaker = { left: 248, right: 352, top: 150, bottom: 292, liquid: 194 }
</script>

<g stroke-linejoin="round" stroke-linecap="round">
  <!-- the cable, from the top of the meter over to the probe's handle -->
  <path d="M 172 66 C 172 10 {probe} -6 {probe} 26" fill="none" stroke="#111" stroke-width="5" />
  <path d="M 172 66 C 172 10 {probe} -6 {probe} 26" fill="none" stroke="#fff" stroke-width="2" />

  <!-- meter -->
  <rect x="160" y="56" width="24" height="12" rx="3" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="10" y="64" width="200" height="228" rx="18" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="26" y="88" width="168" height="64" rx="5" fill="#eef0ec" stroke="#111" stroke-width="2" />
  {#each digits as points}
    <polygon {points} fill="#111" />
  {/each}
  <text x="165" y="137" font-size="18" font-weight="700" fill="#111">{UNIT_SYMBOLS[unit]}</text>
  {#each [['ON/OFF', 36], ['HOLD', 124]] as const as [name, x]}
    <rect {x} y="196" width="60" height="28" rx="6" fill="#fff" stroke="#111" stroke-width="1.5" />
    <text x={x + 30} y="214" text-anchor="middle" font-size="10" font-weight="700" fill="#111">{name}</text>
  {/each}
  <path d="M 70 256 H 150 M 70 266 H 150" stroke="#bbb" stroke-width="2" />

  <!-- beaker of liquid behind the probe -->
  <rect x={beaker.left} y={beaker.top} width={beaker.right - beaker.left} height={beaker.bottom - beaker.top} fill="#fff" />
  <path
    d="M {beaker.left} {beaker.liquid} H {beaker.right} V {beaker.bottom - 4} Q {beaker.right} {beaker.bottom} {beaker.right - 4} {beaker.bottom} H {beaker.left + 4} Q {beaker.left} {beaker.bottom} {beaker.left} {beaker.bottom - 4} Z"
    fill="#dcdcdc"
  />
  <line x1={beaker.left} y1={beaker.liquid} x2={beaker.right} y2={beaker.liquid} stroke="#444" stroke-width="1.5" />
  {#each [176, 204, 232, 260] as y}
    <line x1={beaker.right - 22} x2={beaker.right - 6} y1={y} y2={y} stroke="#111" stroke-width="1.2" />
  {/each}

  <!-- probe: handle and steel rod -->
  <path d="M {probe - 4} 22 H {probe + 4} L {probe + 9} 34 H {probe - 9} Z" fill="#fff" stroke="#111" stroke-width="1.5" />
  <rect x={probe - 11} y="34" width="22" height="62" rx="5" fill="#d4d4d4" stroke="#111" stroke-width="2" />
  <path d="M {probe - 3} 96 V 268 Q {probe - 3} 272 {probe} 272 Q {probe + 3} 272 {probe + 3} 268 V 96" fill="#f2f2f2" stroke="#111" stroke-width="1.5" />

  <!-- beaker glass in front -->
  <path
    d="M {beaker.left - 8} {beaker.top - 4} Q {beaker.left - 2} {beaker.top - 2} {beaker.left} {beaker.top + 4} V {beaker.bottom - 4} Q {beaker.left} {beaker.bottom} {beaker.left + 4} {beaker.bottom} H {beaker.right - 4} Q {beaker.right} {beaker.bottom} {beaker.right} {beaker.bottom - 4} V {beaker.top - 2}"
    fill="none"
    stroke="#111"
    stroke-width="2"
  />
</g>
