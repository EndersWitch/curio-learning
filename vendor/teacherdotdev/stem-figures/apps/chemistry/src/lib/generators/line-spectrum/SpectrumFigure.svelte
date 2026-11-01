<script lang="ts">
  // The Line Spectrum figure: each strip's label, its background (black, a
  // rainbow, or white) and its lines, and the wavelength axis under the
  // last strip or every one. `id` keeps the rainbow's gradient apart from
  // another figure's on the same page.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import { AXIS, AXIS_TITLE_SIZE, LABEL_GAP, LABEL_SIZE, NUMBER_SIZE, PLOT_W, STRIP_H, answerLines, buildSpectrum, describeSpectrum } from './figure'
  import type { SpectrumSettings } from './settings'

  let { settings, svg = $bindable(), id = 'spectrum' }: { settings: SpectrumSettings; svg?: SVGSVGElement; id?: string } = $props()

  const f = $derived(buildSpectrum(settings))
  const answer = $derived(settings.answerKey ? answerLines(settings).join('\n') : '')
  const background = $derived(settings.style === 'emission' ? '#000' : settings.style === 'print' ? '#fff' : `url(#${id}-rainbow)`)
</script>

<FigureFrame
  bind:svg
  width={f.width}
  height={f.height}
  label={describeSpectrum(settings, f)}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={answer}
>
  {#if settings.style === 'absorption'}
    <defs>
      <linearGradient id="{id}-rainbow" x1="0" x2="1" y1="0" y2="0">
        {#each f.rainbow as stop, i (i)}
          <stop offset={stop.offset} stop-color={stop.color} />
        {/each}
      </linearGradient>
    </defs>
  {/if}
  {#each f.strips as strip, i (i)}
    <g transform="translate(0 {strip.y})">
      {#if strip.label && 'text' in strip.label}
        <text x={f.x0 - LABEL_GAP} y={STRIP_H / 2} text-anchor="end" dominant-baseline="central" font-size={LABEL_SIZE} font-weight="700" fill="#111">
          {strip.label.text}
        </text>
      {:else if strip.label}
        <line x1="0" y1={STRIP_H / 2 + 8} x2={f.x0 - LABEL_GAP} y2={STRIP_H / 2 + 8} stroke="#111" stroke-width="1.5" />
      {/if}
      <rect x={f.x0} y="0" width={PLOT_W} height={STRIP_H} fill={background} />
      {#each strip.lines as line (line.nm)}
        <line
          x1={line.x}
          y1="0"
          x2={line.x}
          y2={STRIP_H}
          stroke={line.color}
          stroke-width={f.lineWidth}
          stroke-opacity={line.opacity === 1 ? undefined : line.opacity}
        />
      {/each}
      <rect x={f.x0} y="0" width={PLOT_W} height={STRIP_H} fill="none" stroke="#222" stroke-width="1.5" />
      {#if strip.axis}
        <g transform="translate(0 {STRIP_H})">
          <g stroke="#222" stroke-width="1.5">
            {#each f.ticks as tick, t (t)}
              <line x1={tick.x} y1="0" x2={tick.x} y2={tick.major ? AXIS.MAJOR_TICK : AXIS.MINOR_TICK} />
            {/each}
          </g>
          {#each f.ticks as tick, t (t)}
            {#if tick.number}
              <text x={tick.x} y={AXIS.MAJOR_TICK + NUMBER_SIZE + 2} text-anchor="middle" font-size={NUMBER_SIZE} fill="#111">{tick.number}</text>
            {/if}
          {/each}
          {#if f.axisTitle}
            <text x={f.x0 + PLOT_W / 2} y={AXIS.AXIS_H + AXIS_TITLE_SIZE + 4} text-anchor="middle" font-size={AXIS_TITLE_SIZE} font-weight="700" fill="#111">
              {f.axisTitle}
            </text>
          {/if}
        </g>
      {/if}
    </g>
  {/each}
</FigureFrame>
