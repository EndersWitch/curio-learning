<script lang="ts">
  // The Gel Electrophoresis figure for a set of settings: the gel with its
  // wells and bands, the lane names over it, the ladder's sizes beside it,
  // the − and + electrodes at its ends, and a ruler down its side.
  import FigureFrame from '$shared/FigureFrame.svelte'
  import {
    BADGE_R,
    LANE_LABEL_SIZE,
    LANE_W,
    PX_PER_MM,
    RULER_W,
    RUN_MM,
    SIZE_LABEL_SIZE,
    TICK,
    WELL_H,
    WELL_TOP,
    WELL_W,
    answerLines,
    describe,
    layoutGel,
    textWidthOf,
  } from './figure'
  import { strengthOf } from './migration'
  import type { GelSettings, Look } from './settings'

  let { settings, svg = $bindable() }: { settings: GelSettings; svg?: SVGSVGElement } = $props()

  // Each look's gel, wells and bands. Print and blue stay light for a copier.
  const LOOKS: Record<Look, { gel: string; edge: string; well: string; wellEdge: string; band: string }> = {
    print: { gel: '#f7f7f7', edge: '#222', well: '#fff', wellEdge: '#333', band: '#111' },
    blue: { gel: '#e8f0f9', edge: '#3d5a80', well: '#fff', wellEdge: '#3d5a80', band: '#1e3a8a' },
    glow: { gel: '#16181d', edge: '#16181d', well: '#262a33', wellEdge: '#5b6170', band: '#ffffff' },
  }
  const INK = '#111'
  const RED = '#c62828'

  const uid = $props.id()
  const at = $derived(layoutGel(settings))
  const look = $derived(LOOKS[settings.look])
  const answers = $derived(answerLines(settings))
  // Wide enough for the title and answer key, with the drawing in the middle.
  const width = $derived(Math.max(at.width, textWidthOf(settings)))
  const dx = $derived((width - at.width) / 2)
  const mm = Array.from({ length: RUN_MM + 1 }, (_, i) => i)
</script>

<FigureFrame
  bind:svg
  {width}
  height={at.height}
  label={describe(settings)}
  title={settings.titleMode === 'text' ? settings.title : ''}
  answerKey={settings.answerKey ? answers.join('\n') : ''}
>
  {#if settings.look === 'glow'}
    <defs>
      <filter id="{uid}-glow" x="-30%" y="-200%" width="160%" height="500%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>
    </defs>
  {/if}
  <g transform="translate({dx} 0)">
    <!-- Lane names and numbers over the wells -->
    {#each at.lanes as lane, i (lane.lane.id)}
      {@const x = at.gel.x + lane.cx}
      {#if at.laneLabels.mode === 'text' && lane.lane.label.trim()}
        {#if at.laneLabels.turned}
          <text
            x={x - 4} y={at.laneLabels.y} transform="rotate(-45 {x - 4} {at.laneLabels.y})"
            font-size={LANE_LABEL_SIZE} font-weight="700" fill={INK}
          >{lane.lane.label.trim()}</text>
        {:else}
          <text {x} y={at.laneLabels.y} text-anchor="middle" font-size={LANE_LABEL_SIZE} font-weight="700" fill={INK}>{lane.lane.label.trim()}</text>
        {/if}
      {:else if at.laneLabels.mode === 'blank'}
        <line x1={x - LANE_W / 2 + 6} x2={x + LANE_W / 2 - 6} y1={at.laneLabels.y + 2} y2={at.laneLabels.y + 2} stroke={INK} stroke-width="1.2" />
      {/if}
      {#if at.numbersY !== null}
        <text {x} y={at.numbersY} text-anchor="middle" font-size="13" fill="#444">{i + 1}</text>
      {/if}
    {/each}

    <g transform="translate({at.gel.x} {at.gel.y})">
      <!-- The gel, its wells, and the bands in each lane -->
      <rect width={at.gel.w} height={at.gel.h} rx="6" fill={look.gel} stroke={look.edge} stroke-width="1.5" />
      {#each at.lanes as lane (lane.lane.id)}
        <rect
          x={lane.cx - WELL_W / 2} y={WELL_TOP} width={WELL_W} height={WELL_H} rx="1.5"
          fill={look.well} stroke={look.wellEdge} stroke-width="1.2"
        />
        {#each lane.bands as band, k (k)}
          {@const h = band.bottom - band.top}
          {#if settings.look === 'glow'}
            <rect
              x={lane.cx - WELL_W / 2 + 1} y={band.top} width={WELL_W - 2} height={h} rx={Math.min(2.5, h / 2)}
              fill="#ffd9a8" opacity={strengthOf(band.amount) * 0.9} filter="url(#{uid}-glow)"
            />
          {/if}
          <rect
            x={lane.cx - WELL_W / 2 + 1} y={band.top} width={WELL_W - 2} height={h} rx={Math.min(2.5, h / 2)}
            fill={look.band} opacity={strengthOf(band.amount)}
          />
        {/each}
      {/each}
    </g>

    <!-- The ladder's sizes, each on a tick out from its band -->
    {#each at.sizes as column (column.side)}
      {@const out = column.side === 'left' ? -1 : 1}
      {#each column.labels as label, k (k)}
        {@const y0 = at.gel.y + label.band}
        {@const y1 = at.gel.y + label.y}
        {@const x0 = column.x + out * 2}
        {@const x1 = column.x + out * TICK}
        <polyline
          points="{x0},{y0} {x1},{y0} {x1 + out * 5},{y1}" fill="none" stroke={INK} stroke-width="1"
          stroke-linejoin="round"
        />
        {#if settings.sizeLabels === 'blank'}
          <!-- A line to write the size on, carrying on from the tick -->
          <line x1={x1 + out * 5} x2={x1 + out * 50} y1={y1} y2={y1} stroke={INK} stroke-width="1" />
        {:else}
          <text
            x={x1 + out * 10} y={y1 + 4.5} text-anchor={out < 0 ? 'end' : 'start'} font-size={SIZE_LABEL_SIZE} fill={INK}
          >{label.text}</text>
        {/if}
      {/each}
    {/each}

    <!-- The − electrode at the wells' end, black, and the + at the far end, red -->
    {#if at.electrodes}
      {@const e = at.electrodes}
      {#each [{ y: e.top, sign: '−', color: INK, name: 'Cathode' }, { y: e.bottom, sign: '+', color: RED, name: 'Anode' }] as end (end.sign)}
        {@const y = at.gel.y + end.y}
        {#if settings.electrodes === 'blank'}
          <circle cx={e.x} cy={y} r={BADGE_R} fill="#fff" stroke={end.color} stroke-width="1.5" />
        {:else}
          <circle cx={e.x} cy={y} r={BADGE_R} fill={end.color} />
          {#if end.sign === '−'}
            <rect x={e.x - 5} y={y - 1.1} width="10" height="2.2" fill="#fff" />
          {:else}
            <rect x={e.x - 5} y={y - 1.1} width="10" height="2.2" fill="#fff" />
            <rect x={e.x - 1.1} y={y - 5} width="2.2" height="10" fill="#fff" />
          {/if}
          {#if settings.electrodes === 'labeled'}
            <text x={e.x - BADGE_R - 6} y={y + 4.5} text-anchor="end" font-size={SIZE_LABEL_SIZE} font-weight="700" fill={INK}>{end.name}</text>
          {/if}
        {/if}
      {/each}
    {/if}

    <!-- A ruler in cm, marked every mm, with 0 at the bottom of the wells -->
    {#if at.ruler}
      {@const r = at.ruler}
      {@const zero = at.gel.y + r.zero}
      <rect x={r.x} y={zero - 8} width={RULER_W} height={RUN_MM * PX_PER_MM + 16} fill="#fff" stroke={INK} stroke-width="1.2" />
      {#each mm as m (m)}
        {@const len = m % 10 === 0 ? 12 : m % 5 === 0 ? 8 : 5}
        <line x1={r.x} x2={r.x + len} y1={zero + m * PX_PER_MM} y2={zero + m * PX_PER_MM} stroke={INK} stroke-width={m % 10 === 0 ? 1.1 : 0.8} />
        {#if m % 10 === 0}
          <text x={r.x + 21} y={zero + m * PX_PER_MM + 4} text-anchor="middle" font-size="11" fill={INK}>{m / 10}</text>
        {/if}
      {/each}
      <text x={r.x + RULER_W / 2} y={zero + RUN_MM * PX_PER_MM + 22} text-anchor="middle" font-size="12" fill={INK}>cm</text>
    {/if}
  </g>
</FigureFrame>
