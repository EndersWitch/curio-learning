<script lang="ts">
  // The Photoelectron Spectrum figure: gridlines, the energy axis (high on the
  // left) and the electrons axis, a peak for each sublevel with its label, a
  // second element's peaks dashed behind, and the key.
  import FigureFrame from '$lib/shared/FigureFrame.svelte'
  import { buildSpectrum, H, W } from './figure'
  import { answerLines, figureLabel, type PesSettings } from './settings'

  let { settings: s, svg = $bindable() }: { settings: PesSettings; svg?: SVGSVGElement } = $props()

  const g = $derived(buildSpectrum(s))
  const answer = $derived(s.answerKey ? answerLines(s) : [])

  const INK = '#111'
  const OTHER = '#6b7280'
  const GRID = '#d1d5db'
  const DASH = '5 4'
</script>

<FigureFrame
  bind:svg
  width={g.width}
  height={g.height}
  label={figureLabel(s)}
  title={s.titleMode === 'text' ? s.title : ''}
  answerKey={answer.join('\n')}
>
  <g transform="translate({g.origin.x} {g.origin.y})" font-size={g.fs} fill={INK}>
    <g stroke={GRID} stroke-width="1" shape-rendering="crispEdges">
      {#each g.gridlines as y (y)}<line x1="0" x2={W} y1={y} y2={y} />{/each}
    </g>

    {#each g.compared as p, i (i)}
      {#if s.peaks === 'bars'}
        <rect x={p.bar.x} y={p.bar.y} width={p.bar.w} height={p.bar.h} fill="none" stroke={OTHER} stroke-width="1.8" stroke-dasharray={DASH} />
      {:else}
        <path d={p.path} fill="none" stroke={OTHER} stroke-width="2" stroke-dasharray={DASH} stroke-linejoin="round" />
      {/if}
    {/each}
    {#each g.peaks as p, i (i)}
      {#if s.peaks === 'bars'}
        <rect x={p.bar.x} y={p.bar.y} width={p.bar.w} height={p.bar.h} fill={INK} />
      {:else}
        <path d={p.path} fill="none" stroke={INK} stroke-width="2.2" stroke-linejoin="round" />
      {/if}
    {/each}

    <g stroke={INK} stroke-width="2" stroke-linecap="square">
      <line x1="0" x2="0" y1="0" y2={H} />
      {#each g.xAxis as a, i (i)}<line x1={a.x1} x2={a.x2} y1={H} y2={H} />{/each}
    </g>
    <g stroke={INK} stroke-width="1.5">
      {#each g.xTicks as t, i (i)}<line x1={t.x} x2={t.x} y1={H} y2={H + (t.major ? 6 : 3.5)} />{/each}
      {#each g.yTicks as y (y)}<line x1="-5" x2="0" y1={y} y2={y} />{/each}
      {#each g.breaks as b, i (i)}<line x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />{/each}
    </g>

    {#each g.xNumbers as n, i (i)}<text x={n.x} y={n.y} text-anchor="middle">{n.text}</text>{/each}
    {#each g.yNumbers as n (n.text)}<text x={n.x} y={n.y} text-anchor="end">{n.text}</text>{/each}

    {#each g.labels as l, i (i)}
      {#each l.lines as line, k (k)}
        {@const y = l.y - k * g.lineH}
        {#if 'text' in line}
          <text x={l.x} y={y - g.fs * 0.2} text-anchor="middle" font-weight={k === 0 ? 700 : 400}>{line.text}</text>
        {:else}
          <line x1={l.x - line.blank / 2} x2={l.x + line.blank / 2} y1={y} y2={y} stroke={INK} stroke-width="1.2" />
        {/if}
      {/each}
    {/each}

    {#each g.key as k (k.name)}
      {#if k.sample}
        <line
          x1={k.x} x2={k.x + g.keySample} y1={k.y - g.fs * 0.35} y2={k.y - g.fs * 0.35}
          stroke={k.dashed ? OTHER : INK} stroke-width={k.dashed ? 2 : 2.2} stroke-dasharray={k.dashed ? DASH : undefined}
        />
        <text x={k.x + g.keySample + 8} y={k.y} font-weight="700">{k.name}</text>
      {:else}
        <text x={k.x} y={k.y} font-weight="700">{k.name}</text>
      {/if}
    {/each}

    <text x={g.xTitle.x} y={g.xTitle.y} text-anchor="middle" font-weight="700" font-size={g.fs * 1.1}>{g.xTitle.text}</text>
    <text
      x={g.yTitle.x} y={g.yTitle.y} text-anchor="middle" dominant-baseline="central" font-weight="700" font-size={g.fs * 1.1}
      transform="rotate(-90 {g.yTitle.x} {g.yTitle.y})"
    >{g.yTitle.text}</text>
  </g>
</FigureFrame>
