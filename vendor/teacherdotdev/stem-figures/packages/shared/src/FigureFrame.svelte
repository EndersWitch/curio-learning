<script lang="ts">
  // The outside of every figure: a white sheet sized to the drawing, with the
  // optional chart title across the top and the optional answer key under
  // it, one line per line of `answerKey`. The drawing is placed at (0, 0) and
  // is `width` × `height`.
  import type { Snippet } from 'svelte'
  import { getFigureAlign } from './figureAlign'

  interface Props {
    width: number
    height: number
    title?: string
    answerKey?: string
    label: string
    svg?: SVGSVGElement
    children: Snippet
  }
  let { width, height, title = '', answerKey = '', label, svg = $bindable(), children }: Props = $props()

  const PAD = 16
  const TITLE_H = 40
  const KEY_H = 36
  const KEY_LINE = 24
  const align = getFigureAlign()
  const top = $derived(PAD + (title ? TITLE_H : 0))
  const boxW = $derived(width + 2 * PAD)
  const keyLines = $derived(answerKey ? answerKey.split('\n') : [])
  const boxH = $derived(top + height + (keyLines.length ? KEY_H + (keyLines.length - 1) * KEY_LINE : 0) + PAD)
</script>

<svg
  bind:this={svg}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {boxW} {boxH}"
  preserveAspectRatio="{align} meet"
  width={boxW}
  height={boxH}
  role="img"
  aria-label={label}
  font-family="Arial, Helvetica, sans-serif"
>
  <rect width={boxW} height={boxH} fill="#fff" />
  {#if title}
    <text x={boxW / 2} y={PAD + 22} text-anchor="middle" font-size="22" font-weight="700" fill="#111">{title}</text>
  {/if}
  <g transform="translate({PAD} {top})">{@render children()}</g>
  {#each keyLines as line, i (i)}
    <text x={boxW / 2} y={top + height + 26 + i * KEY_LINE} text-anchor="middle" font-size="18" fill="#111">{line}</text>
  {/each}
</svg>
