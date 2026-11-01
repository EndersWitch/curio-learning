<script lang="ts">
  // The Cell Diagram figure: the cell, its labels down both sides with
  // leader lines to what they name, and the word bank and answer key under
  // it. In the generator a click on a structure is passed to `onpick`.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import CellArt from './CellArt.svelte'
  import { cellFigure, describe } from './figure'
  import { lookFor } from './look'
  import type { CellSettings } from './settings'
  import type { PartId } from './structures'

  interface Props {
    settings: CellSettings
    svg?: SVGSVGElement
    selected?: PartId
    onpick?: (id: PartId, event: MouseEvent) => void
  }
  let { settings, svg = $bindable(), selected, onpick }: Props = $props()

  const f = $derived(cellFigure(settings))
  const look = $derived(lookFor(settings.style))
  const label = $derived(describe(settings, f))

  function pick(event: MouseEvent) {
    const part = (event.target as Element).closest('[data-part]')
    if (part && onpick) onpick(part.getAttribute('data-part') as PartId, event)
  }
</script>

<FigureFrame bind:svg width={f.width} height={f.height} {label} title={settings.titleMode === 'text' ? settings.title : ''}>
  <g transform="translate(0 {f.artY})">
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions (the structures checklist does the same from the keyboard) -->
    <g transform="translate({f.artX} 0)" onclick={pick}>
      <CellArt plan={f.plan} drawn={f.drawn} {look} {selected} interactive={!!onpick} />
    </g>
    <!-- Clicks go through the labels to the structure under them. -->
    <g stroke={look.leader} stroke-width="1.4" fill="none" pointer-events="none">
      {#each f.labels as l (l.id)}
        <line x1={l.from[0]} y1={l.from[1]} x2={l.to[0]} y2={l.to[1]} />
      {/each}
    </g>
    <g pointer-events="none">
    {#each f.labels as l (l.id)}
      {@const left = l.side === 'left'}
      <circle cx={l.to[0]} cy={l.to[1]} r="2.6" fill={look.leader} stroke="#fff" stroke-width="0.8" />
      {#if settings.labels === 'names'}
        {#each l.lines as line, i (i)}
          <text
            x={l.x}
            y={l.y + (i - (l.lines.length - 1) / 2) * f.lineH}
            text-anchor={left ? 'end' : 'start'}
            dominant-baseline="central"
            font-size={f.fs}
            fill={look.ink}>{line}</text
          >
        {/each}
      {:else if settings.labels === 'numbers'}
        {@const cx = left ? l.x - f.radius : l.x + f.radius}
        <circle {cx} cy={l.y} r={f.radius} fill="#fff" stroke={look.ink} stroke-width="1.6" />
        <text x={cx} y={l.y} text-anchor="middle" dominant-baseline="central" font-size={f.fs * 0.9} font-weight="700" fill={look.ink}>{l.marker}</text>
      {:else if settings.labels === 'blanks'}
        {@const [x1, x2] = left ? [l.x - f.blank, l.x] : [l.x, l.x + f.blank]}
        <line {x1} y1={l.y} {x2} y2={l.y} stroke={look.ink} stroke-width="1.4" />
        {#if settings.answerKey}
          <text x={(x1 + x2) / 2} y={l.y - f.fs * 0.55} text-anchor="middle" font-size={f.fs} font-style="italic" fill={look.ink}>{l.name}</text>
        {/if}
      {/if}
    {/each}
    </g>
  </g>
  {#each f.boxes as box (box.heading)}
    <rect x={box.x} y={box.y} width={box.width} height={box.height} rx="8" fill="none" stroke={look.ink} stroke-width="1.5" />
    <text x={box.x + box.width / 2} y={box.y + 14 + f.fs * 0.85} text-anchor="middle" font-size={f.fs} font-weight="700" fill={look.ink}>{box.heading}</text>
    {#each box.items as item (item.text)}
      <text x={item.x} y={item.y} dominant-baseline="central" font-size={f.fs} fill={look.ink}>{item.text}</text>
    {/each}
  {/each}
</FigureFrame>
