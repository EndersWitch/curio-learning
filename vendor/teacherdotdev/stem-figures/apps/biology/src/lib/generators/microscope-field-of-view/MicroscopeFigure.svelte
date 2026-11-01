<script lang="ts">
  // The Microscope Field of View figure for a set of settings: the question,
  // then the circle seen down the eyepiece with the slide inside it, drawn to
  // scale (`k` pixels per µm, so the field's diameter is its width in µm),
  // and beside it, when asked, the middle of the same slide at a higher
  // power. Under each field its magnification and scale bar; over it, an
  // arrow giving its diameter; then the answer box.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import Slide from './Slide.svelte'
  import {
    ANSWER_LINE, ANSWER_PAD, ANSWER_SIZE, CAPTION_LINE, CAPTION_SIZE, FIELD_R, QUESTION_LINE, QUESTION_SIZE, figureLayout, pxPerUm,
  } from './layout'
  import { UM_PER_MM, lengthText, mmText, scaleBarLength, umText } from './microscope'
  import { answerText, questionText } from './questions'
  import { slideOf, viewsOf, type MicroscopeSettings, type View } from './settings'
  import { SPECIMEN_INFO } from './specimens'

  let { settings: s, svg = $bindable() }: { settings: MicroscopeSettings; svg?: SVGSVGElement } = $props()

  const id = $props.id()
  const INK = '#111'
  const R = FIELD_R
  /** the ring's width */
  const RING = 4
  /** the ruler strip's height: a fifth of the field */
  const RULER_H = 0.4 * R
  const r2 = (n: number) => Math.round(n * 100) / 100

  const views = $derived(viewsOf(s))
  const slide = $derived(slideOf(s))
  /** the widest field's radius, in µm: the ruler's first mark is at its left edge */
  const widest = $derived((views[0].field * UM_PER_MM) / 2)

  function caption(v: View) {
    const lenses = `Eyepiece ${s.eyepiece}×, objective ${v.objective}×`
    if (s.magCaption === 'total') return [`${v.magnification}×`]
    if (s.magCaption === 'lenses') return [lenses]
    if (s.magCaption === 'both') return [`${v.magnification}×`, lenses]
    return []
  }
  /** the arrow's label over a field, or '' for a blank to fill in */
  function arrowLabel(v: View, i: number) {
    if (s.arrow === 'blank' || (i > 0 && s.compare && s.arrowHighBlank)) return ''
    return s.arrow === 'mm' ? mmText(v.field) : umText(v.field * UM_PER_MM)
  }

  const captions = $derived(views.map(caption))
  const answer = $derived(s.answer === 'none' ? null : s.answer === 'blank' ? '' : answerText(s, slide))
  const layout = $derived(
    figureLayout({
      fields: views.length,
      question: questionText(s),
      arrows: s.arrow !== 'none',
      captionLines: Math.max(...captions.map((c) => c.length)),
      scaleBar: s.scaleBar,
      answer,
    }),
  )
  /** pixels per µm in a view */
  const kOf = (v: View) => pxPerUm(v.field)

  /** a ruler mark's width: about 0.08 mm, as printed, but always visible */
  const markWidth = (v: View) => r2(Math.min(6, Math.max(1.5, 80 * kOf(v))))
  /** The ruler's mm marks in a view, as x in pixels from its middle: the
   *  first lined up with the widest field's left edge, as when measuring it,
   *  just inside the ring so it shows. */
  function rulerMarks(v: View) {
    const k = kOf(v)
    // in µm on the slide, so a higher power shows the same marks
    const inside = (RING / 2 + markWidth(views[0]) / 2) / kOf(views[0])
    const start = (-widest + inside) * k
    const marks: { x: number; n: number }[] = []
    for (let n = 0; start + n * UM_PER_MM * k <= R; n++) {
      const x = start + n * UM_PER_MM * k
      if (x >= -R) marks.push({ x: r2(x), n })
    }
    return marks
  }

  const label = $derived(
    `The field of view of a microscope at ${views.map((v) => `${v.magnification}×, ${mmText(v.field)} across`).join(', and beside it at ')}, ` +
      (s.specimen === 'none' ? 'with nothing on the slide' : `showing ${SPECIMEN_INFO[s.specimen].name.toLowerCase()}`),
  )
</script>

<FigureFrame bind:svg width={layout.width} height={layout.height} {label} title={s.titleMode === 'text' ? s.title : ''}>
  {#each layout.question as line, i (i)}
    <text x="0" y={i * QUESTION_LINE + QUESTION_SIZE} font-size={QUESTION_SIZE} fill={INK}>{line}</text>
  {/each}

  {#each views as v, i (i)}
    {@const c = layout.centers[i]}
    {@const k = kOf(v)}
    <!-- the arrow across the top, its ends level with the field's sides -->
    {#if s.arrow !== 'none'}
      {@const text = arrowLabel(v, i)}
      {@const y = layout.arrowY + 34}
      <g stroke={INK} fill={INK}>
        <line x1={c.x - R} x2={c.x - R} y1={y - 8} y2={c.y} stroke="#777" stroke-width="1" stroke-dasharray="4 3" />
        <line x1={c.x + R} x2={c.x + R} y1={y - 8} y2={c.y} stroke="#777" stroke-width="1" stroke-dasharray="4 3" />
        <line x1={c.x - R + 10} x2={c.x + R - 10} y1={y} y2={y} stroke-width="1.6" />
        <path d="M {c.x - R} {y} l 11 -5 v 10 z M {c.x + R} {y} l -11 -5 v 10 z" stroke="none" />
      </g>
      {#if text}
        <text x={c.x} y={y - 9} text-anchor="middle" font-size="16" font-weight="700" fill={INK}>{text}</text>
      {:else}
        <line x1={c.x - 40} x2={c.x + 40} y1={y - 9} y2={y - 9} stroke={INK} stroke-width="1.2" />
      {/if}
    {/if}

    <clipPath id="{id}-field-{i}"><circle cx={c.x} cy={c.y} r={R} /></clipPath>
    <circle cx={c.x} cy={c.y} r={R} fill="#fff" />
    <g clip-path="url(#{id}-field-{i})">
      <g transform="translate({c.x} {c.y})">
        <Slide {slide} specimen={s.specimen} {k} {R} color={s.color} inverted={s.orientation === 'seen'} />
        {#if s.ruler}
          <!-- a strip of clear plastic ruler, its marked edge along the diameter -->
          <rect x={-R - 4} y="0" width={2 * R + 8} height={RULER_H} fill={s.color ? '#cfe0ee' : '#d6d6d6'} fill-opacity="0.4" stroke={INK} stroke-width="1.2" />
          {#each rulerMarks(v) as m (m.n)}
            <line
              x1={m.x} x2={m.x} y1="0" y2={(m.n % 10 === 0 ? 0.85 : m.n % 5 === 0 ? 0.7 : 0.5) * RULER_H}
              stroke={INK} stroke-width={markWidth(v)}
            />
          {/each}
        {/if}
      </g>
    </g>
    <circle cx={c.x} cy={c.y} r={R} fill="none" stroke={INK} stroke-width={RING} />

    {#each captions[i] as line, j (j)}
      <text
        x={c.x} y={layout.captionY + j * CAPTION_LINE + CAPTION_SIZE} text-anchor="middle"
        font-size={CAPTION_SIZE} font-weight={j === 0 && s.magCaption !== 'lenses' ? 700 : 400} fill={INK}
      >{line}</text>
    {/each}

    {#if s.scaleBar}
      {@const um = scaleBarLength(v.field)}
      {@const w = r2(um * k)}
      {@const y = layout.scaleBarY + 4}
      <g stroke={INK} stroke-width="1.5">
        <rect x={c.x - w / 2} y={y} width={w} height="5" fill={INK} stroke="none" />
        <line x1={c.x - w / 2} x2={c.x - w / 2} y1={y - 4} y2={y + 9} />
        <line x1={c.x + w / 2} x2={c.x + w / 2} y1={y - 4} y2={y + 9} />
      </g>
      <text x={c.x} y={y + 27} text-anchor="middle" font-size="15" fill={INK}>{lengthText(um)}</text>
    {/if}
  {/each}

  {#if layout.answer}
    {@const a = layout.answer}
    <rect x="1" y={a.y} width={layout.width - 2} height={a.height} rx="6" fill="#fff" stroke={INK} stroke-width="1.5" />
    <text x={ANSWER_PAD} y={a.y + 26} font-size={ANSWER_SIZE} fill={INK}>
      <tspan font-weight="700">{a.label}</tspan>{#if a.lines.length}<tspan dx="6">{a.lines[0]}</tspan>{/if}
    </text>
    {#each a.lines.slice(1) as line, i (i)}
      <text x={ANSWER_PAD} y={a.y + 26 + (i + 1) * ANSWER_LINE} font-size={ANSWER_SIZE} fill={INK}>{line}</text>
    {/each}
  {/if}
</FigureFrame>
