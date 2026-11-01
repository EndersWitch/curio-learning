<script lang="ts">
  // A benchtop digital pH meter showing the pH on its display, wired to a
  // pH electrode standing in a beaker of liquid.
  import { segmentTextWidth, sevenSegment } from '$lib/shared/sevenSegment'
  import Electrode from './Electrode.svelte'

  let { reading, decimals }: { reading: number; decimals: number } = $props()

  // The pH right-aligned against the "pH", as on a real display.
  const DIGIT_H = 36
  const DISPLAY_RIGHT = 150
  const text = $derived(reading.toFixed(decimals))
  const digits = $derived(sevenSegment(text, DISPLAY_RIGHT - segmentTextWidth(text, DIGIT_H), 102, DIGIT_H))
</script>

<Electrode x={300} top={22} bottom={292} from={{ x: 172, y: 58 }} />

<g stroke-linejoin="round" stroke-linecap="round">
  <rect x="160" y="56" width="24" height="12" rx="3" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="10" y="64" width="200" height="228" rx="18" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="26" y="88" width="168" height="64" rx="5" fill="#eef0ec" stroke="#111" stroke-width="2" />
  {#each digits as points}
    <polygon {points} fill="#111" />
  {/each}
  <text x="156" y="137" font-size="18" font-weight="700" fill="#111">pH</text>
  {#each [['ON/OFF', 36], ['CAL', 124]] as const as [name, x]}
    <rect {x} y="196" width="60" height="28" rx="6" fill="#fff" stroke="#111" stroke-width="1.5" />
    <text x={x + 30} y="214" text-anchor="middle" font-size="10" font-weight="700" fill="#111">{name}</text>
  {/each}
  <path d="M 70 256 H 150 M 70 266 H 150" stroke="#bbb" stroke-width="2" />
</g>
