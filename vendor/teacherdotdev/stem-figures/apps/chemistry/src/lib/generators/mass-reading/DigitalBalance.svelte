<script lang="ts">
  // A top-loading digital balance showing a mass on its display, with a weigh
  // boat of powder, a beaker of liquid, an object or nothing on its pan. An
  // analytical balance (3–4 decimal places) stands inside a glass draft shield.
  import { objectBounds, type Placed } from '../volume-by-displacement/objects'
  import ObjectShape from '../volume-by-displacement/ObjectShape.svelte'
  import { DIGITAL_PAN, digitalBalanceSize, displayText, type DigitalBalance, type PanContents } from './digital'
  import { segmentTextWidth, sevenSegment } from '$lib/shared/sevenSegment'

  let { balance, mass, pan, object = null }: { balance: DigitalBalance; mass: number; pan: PanContents; object?: Placed | null } = $props()

  const size = $derived(digitalBalanceSize(balance.analytical, pan, object ? objectBounds(object).top : undefined))
  // The display always has room for the balance's largest reading, like a
  // real one, with the mass right-aligned against the "g".
  const DIGIT_H = 32
  const DISPLAY_RIGHT = 222
  const text = $derived(displayText(balance, mass))
  const digits = $derived(sevenSegment(text, DISPLAY_RIGHT - segmentTextWidth(text, DIGIT_H), 208, DIGIT_H))
  const cx = DIGITAL_PAN.cx
</script>

<g transform="translate(0 {-size.top})" stroke-linejoin="round" stroke-linecap="round">
  <!-- body, with a sloped top deck -->
  <path d="M 34 172 H 346 L 370 192 H 10 Z" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x="10" y="192" width="360" height="72" rx="8" fill="#fff" stroke="#111" stroke-width="2" />

  {#if balance.analytical}
    <!-- draft shield, back: the far pane and the two side panes, behind the pan -->
    <path d="M 44 20 H 336 V 174 H 44 Z" fill="#eef3f6" stroke="#111" stroke-width="1.5" />
    <path d="M 44 20 L 22 36 V 190 L 44 174 Z M 336 20 L 358 36 V 190 L 336 174 Z" fill="#e3eaef" stroke="#111" stroke-width="1.5" />
  {/if}

  <!-- pan on its post -->
  <rect x={cx - 10} y="160" width="20" height="13" fill="#fff" stroke="#111" stroke-width="2" />
  <rect x={cx - 110} y={DIGITAL_PAN.top} width="220" height="10" rx="3" fill="#fff" stroke="#111" stroke-width="2" />

  {#if object}
    <ObjectShape placed={object} />
  {:else if pan === 'boat'}
    <path d="M {cx - 36} 128 Q {cx} 108 {cx + 36} 128 Z" fill="#c4c4c4" stroke="#111" stroke-width="1.5" />
    <path d="M {cx - 58} 128 H {cx + 58} L {cx + 42} 151 H {cx - 42} Z" fill="#fff" stroke="#111" stroke-width="2" />
  {:else if pan === 'beaker'}
    <rect x={cx - 38} y="62" width="76" height="89" fill="#fff" />
    <path d="M {cx - 38} 104 H {cx + 38} V 147 Q {cx + 38} 151 {cx + 34} 151 H {cx - 34} Q {cx - 38} 151 {cx - 38} 147 Z" fill="#dcdcdc" />
    <line x1={cx - 38} y1="104" x2={cx + 38} y2="104" stroke="#444" stroke-width="1.5" />
    {#each [80, 96, 112, 128] as y}
      <line x1={cx + 16} x2={cx + 30} y1={y} y2={y} stroke="#111" stroke-width="1.2" />
    {/each}
    <path d="M {cx - 46} 58 Q {cx - 40} 60 {cx - 38} 66 V 147 Q {cx - 38} 151 {cx - 34} 151 H {cx + 34} Q {cx + 38} 151 {cx + 38} 147 V 60" fill="none" stroke="#111" stroke-width="2" />
  {/if}

  {#if balance.analytical}
    <!-- draft shield, front: a tinted glass pane over the pan, the lid with its handle, reflections -->
    <rect x="22" y="36" width="336" height="154" fill="#cfdde6" fill-opacity="0.28" stroke="#111" stroke-width="2" />
    <path d="M 44 20 H 336 L 358 36 H 22 Z" fill="#fff" stroke="#111" stroke-width="2" />
    <rect x={cx - 14} y="24" width="28" height="6" rx="3" fill="#fff" stroke="#111" stroke-width="1.5" />
    <path d="M 40 110 L 104 46 M 40 134 L 70 104 M 280 180 L 340 120 M 306 180 L 340 146" stroke="#fff" stroke-width="5" stroke-opacity="0.9" />
  {/if}

  <!-- display -->
  <rect x="28" y="200" width="222" height="48" rx="5" fill="#eef0ec" stroke="#111" stroke-width="2" />
  {#each digits as points}
    <polygon {points} fill="#111" />
  {/each}
  <text x="229" y="239" font-size="16" font-weight="700" fill="#111">g</text>

  <!-- buttons -->
  {#each [['ON/OFF', 268], ['TARE', 316]] as const as [name, x]}
    <rect {x} y="210" width="40" height="24" rx="5" fill="#fff" stroke="#111" stroke-width="1.5" />
    <text x={x + 20} y="226" text-anchor="middle" font-size="8.5" font-weight="700" fill="#111">{name}</text>
  {/each}
</g>
