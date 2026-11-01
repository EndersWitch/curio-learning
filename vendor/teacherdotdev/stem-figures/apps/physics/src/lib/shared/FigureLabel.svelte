<script lang="ts">
  // A label drawn on a figure's SVG: its text with subscripts and superscripts,
  // a blank line for students to write on, or nothing. (x, y) is the middle of
  // the text's baseline for anchor "middle", its left end for "start" and its
  // right end for "end". Everything is inline so the SVG exports cleanly.
  //
  // With `italic` on, quantities are set in italics the way physics sets them
  // (m, v, F, θ, mg), while words and units (kg) stay upright.
  //
  // A vector (\vec{F}) gets an arrow drawn over its letters, as a line and a
  // small head, so no font needs the symbol. Where its letters are is guessed
  // from their count for the server's first draw, then measured on the page.
  // A bold vector (\mathbf{F}) is bold and upright, as LaTeX sets it.
  import { italicPieces, labelRuns, type Label } from './label'

  interface Props {
    label: Label
    x: number
    y: number
    anchor?: 'start' | 'middle' | 'end'
    size?: number
    color?: string
    /** How long a blank line is. */
    blank?: number
    italic?: boolean
    /** A white outline, so the label reads over lines behind it. */
    halo?: boolean
    /** The id of a LabelBackdrop filter: a white box behind the whole label instead of the outline. */
    backdrop?: string
  }
  let { label, x, y, anchor = 'middle', size = 18, color = '#111827', blank = size * 2.4, italic = true, halo = true, backdrop }: Props = $props()
  const outlined = $derived(halo && !backdrop)

  const pieces = (text: string, upright: boolean) => italicPieces(text).map((p) => ({ t: p.text, italic: italic && !upright && p.italic }))

  const SERIF = "'Times New Roman', Times, serif"
  const SMALL = 0.7
  // How far a subscript drops and a superscript rises, at the small size.
  const DROP = { sub: 0.3, super: -0.45 } as const
  /** How high a capital letter is, a short lowercase one (a, g, v, ω), and how far above them an arrow goes, in ems. */
  const CAP = 0.66
  const X_HEIGHT = 0.46
  const SHORT = /^[acegmnopqrsuvwxyzαγεηικμνπρστυχω]+$/u
  const ABOVE = 0.16
  /** How wide a letter is, roughly, for the first guess at where an arrow goes. */
  const LETTER = 0.5

  const runs = $derived(labelRuns(label.text))
  // Each run moves off the baseline and back again, so the dy values chain.
  const spans = $derived.by(() => {
    let offset = 0
    return runs.map((run) => {
      const target = run.shift ? DROP[run.shift] * size : 0
      const dy = target - offset
      offset = target
      return { ...run, dy, target, size: run.shift ? size * SMALL : size }
    })
  })
  const blankStart = $derived(anchor === 'start' ? x : anchor === 'end' ? x - blank : x - blank / 2)

  let text: SVGTextElement | undefined = $state()
  /** Where each arrow's letters start and end along the text, once measured. */
  let measured = $state<Map<number, { from: number; to: number }> | null>(null)

  // Each vector with an arrow: its letters' ends (measured, or guessed from
  // their count), and a height clear of its tallest letter.
  const arrows = $derived.by(() => {
    const groups = [...new Set(spans.filter((s) => s.vector === 'arrow').map((s) => s.group!))]
    if (!groups.length) return []
    const total = spans.reduce((w, s) => w + [...s.text].length * s.size * LETTER, 0)
    let at = anchor === 'start' ? x : anchor === 'end' ? x - total : x - total / 2
    const guessed = new Map<number, { from: number; to: number }>()
    for (const s of spans) {
      const w = [...s.text].length * s.size * LETTER
      if (s.group !== undefined) guessed.set(s.group, { from: guessed.get(s.group)?.from ?? at, to: at + w })
      at += w
    }
    return groups.map((g) => {
      const own = spans.filter((s) => s.group === g)
      const { from, to } = measured?.get(g) ?? guessed.get(g)!
      const em = Math.max(...own.map((s) => s.size))
      // An italic letter leans right, so its arrow sits a little right too.
      const lean = italic && own.some((s) => italicPieces(s.text).some((p) => p.italic)) ? em * 0.1 : 0
      const middle = (from + to) / 2 + lean
      const half = Math.max(to - from, em * 0.55) / 2
      const top = Math.min(...own.map((s) => s.target - s.size * (SHORT.test(s.text) ? X_HEIGHT : CAP)))
      return { x1: middle - half, x2: middle + half, y: y + top - em * ABOVE, head: em * 0.16, width: Math.max(1.2, em * 0.06) }
    })
  })
  const arrowPath = (a: (typeof arrows)[number]) =>
    `M${a.x1},${a.y}H${a.x2}M${a.x2 - a.head},${a.y - a.head * 0.6}L${a.x2},${a.y}L${a.x2 - a.head},${a.y + a.head * 0.6}`

  $effect(() => {
    // Measured again whenever the label or where it goes changes.
    void [spans, x, y, anchor, size]
    const el = text
    if (!el || !spans.some((s) => s.vector === 'arrow')) return
    try {
      const ends = new Map<number, { from: number; to: number }>()
      for (const tspan of el.querySelectorAll<SVGTSpanElement>('tspan[data-group]')) {
        const n = tspan.getNumberOfChars()
        if (!n) continue
        const g = Number(tspan.dataset.group)
        const from = tspan.getStartPositionOfChar(0).x
        const to = tspan.getEndPositionOfChar(n - 1).x
        const was = ends.get(g)
        ends.set(g, { from: Math.min(from, was?.from ?? from), to: Math.max(to, was?.to ?? to) })
      }
      measured = ends
    } catch {
      measured = null
    }
  })
</script>

{#if label.mode === 'text' && label.text.trim()}
  {#if outlined}
    {#each arrows as a}<path d={arrowPath(a)} fill="none" stroke="#fff" stroke-width={a.width + 4} stroke-linecap="round" stroke-linejoin="round" />{/each}
  {/if}
  <text
    bind:this={text}
    {x}
    {y}
    text-anchor={anchor}
    font-family={SERIF}
    font-size={size}
    fill={color}
    stroke={outlined ? '#fff' : undefined}
    stroke-width={outlined ? 4 : undefined}
    filter={backdrop ? `url(#${backdrop})` : undefined}
    stroke-linejoin="round"
    paint-order="stroke"
  >
    {#each spans as s}<tspan
        dy={s.dy || undefined}
        font-size={s.shift ? size * SMALL : undefined}
        font-weight={s.vector === 'bold' ? 'bold' : undefined}
        data-group={s.vector === 'arrow' ? s.group : undefined}
        >{#each pieces(s.text, s.vector === 'bold') as piece}<tspan font-style={piece.italic ? 'italic' : undefined}>{piece.t}</tspan>{/each}</tspan
      >{/each}
  </text>
  {#each arrows as a}<path d={arrowPath(a)} fill="none" stroke={color} stroke-width={a.width} stroke-linecap="round" stroke-linejoin="round" />{/each}
{:else if label.mode === 'blank'}
  <line x1={blankStart} y1={y} x2={blankStart + blank} y2={y} stroke={color} stroke-width="1.5" />
{/if}
