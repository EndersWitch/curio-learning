<script>
  // The stretch of number line between the start and end points, split into ten
  // equal spaces. Labels appear as the student finds them; with `labels` on,
  // every tick is numbered from the beginning.
  import { fmt, lineTickValue, sameNumber } from './rounding.js'

  let {
    n, start, end, mid,
    showStart = false, showEnd = false, showMid = false,
    labels = false,
    highlight = null, // the rounded answer, once it is known: draws the arrow
    showPoint = true,
    interactive = false,
    plotValue = null,
    onplot = null,
    muted = false,
  } = $props()

  const W = 1000
  const H = 200
  const PAD = 90
  const Y = 105
  const ticks = Array.from({ length: 11 }, (_, i) => i)

  const xOf = (v) => PAD + ((v - start) / (end - start)) * (W - 2 * PAD)
  const dotX = $derived(xOf(n))
  const tickValue = (i) => lineTickValue(start, end, i)
  const longestLabel = $derived.by(() => Math.max(fmt(n).length, ...ticks.map((i) => fmt(tickValue(i)).length)))
</script>

<svg viewBox="0 0 {W} {H}" class:muted class:compact={longestLabel >= 8} class:tight={longestLabel >= 10} role={interactive ? 'group' : 'img'}
  aria-label={showPoint ? `Number line from ${fmt(start)} to ${fmt(end)} showing ${fmt(n)}` : `Number line from ${fmt(start)} to ${fmt(end)}. Plot ${fmt(n)}.`}>
  <line x1={PAD - 40} y1={Y} x2={W - PAD + 40} y2={Y} class="rail" />
  <polygon points="{PAD - 54},{Y} {PAD - 36},{Y - 9} {PAD - 36},{Y + 9}" class="arrowhead" />
  <polygon points="{W - PAD + 54},{Y} {W - PAD + 36},{Y - 9} {W - PAD + 36},{Y + 9}" class="arrowhead" />

  {#each ticks as i}
    {@const x = PAD + (i / 10) * (W - 2 * PAD)}
    {@const major = i === 0 || i === 5 || i === 10}
    <line x1={x} y1={Y - (major ? 22 : 12)} x2={x} y2={Y + (major ? 22 : 12)}
      class="tick" class:major class:midtick={i === 5} />
    {#if labels && !major}
      <text x={x} y={Y + 46} text-anchor="middle" class="minor-label">{fmt(tickValue(i))}</text>
    {/if}
    {#if interactive}
      <circle cx={x} cy={Y} r="30" class="plot-target" role="button" tabindex="0"
        aria-label="Plot at {fmt(tickValue(i))}"
        onclick={() => onplot?.(tickValue(i))}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onplot?.(tickValue(i))
          }
        }} />
    {/if}
  {/each}

  <g class="label" class:found={showStart || labels} class:winner={sameNumber(highlight, start)}>
    <text x={PAD} y={Y + 58} text-anchor="middle">{showStart || labels ? fmt(start) : '?'}</text>
    <text class="tag" x={PAD} y={Y + 84} text-anchor="middle">start</text>
  </g>

  <g class="label" class:found={showEnd || labels} class:winner={sameNumber(highlight, end)}>
    <text x={W - PAD} y={Y + 58} text-anchor="middle">{showEnd || labels ? fmt(end) : '?'}</text>
    <text class="tag" x={W - PAD} y={Y + 84} text-anchor="middle">end</text>
  </g>

  <g class="label mid" class:found={showMid || labels}>
    <text x={W / 2} y={Y + 58} text-anchor="middle">{showMid || labels ? fmt(mid) : '?'}</text>
    <text class="tag" x={W / 2} y={Y + 84} text-anchor="middle">midpoint · halfway</text>
  </g>

  {#if plotValue !== null}
    {@const plotX = xOf(plotValue)}
    <g class="student-dot" aria-label="Your point at {fmt(plotValue)}">
      <line x1={plotX} y1={Y} x2={plotX} y2={Y + 8} class="student-drop" />
      <circle cx={plotX} cy={Y + 17} r="11" class="student-point" />
    </g>
  {/if}

  {#if showPoint}
    <g class="dot">
      <line x1={dotX} y1={Y - 34} x2={dotX} y2={Y} class="drop" />
      <circle cx={dotX} cy={Y} r="13" class="point" />
      <text x={dotX} y={Y - 46} text-anchor="middle" class="n">{fmt(n)}</text>
    </g>
  {/if}

  {#if highlight !== null}
    {@const tx = xOf(highlight)}
    {@const dir = tx > dotX ? 1 : -1}
    <line x1={dotX + dir * 18} y1={Y - 4} x2={tx - dir * 14} y2={Y - 4} class="jump" />
    <polygon points="{tx - dir * 4},{Y - 4} {tx - dir * 24},{Y - 17} {tx - dir * 24},{Y + 9}" class="jumphead" />
  {/if}
</svg>

<style>
  svg {
    width: 100%;
    height: auto;
    display: block;
    transition: opacity 0.2s;
  }
  svg.muted { opacity: 0.55; }
  .rail { stroke: var(--ink); stroke-width: 5; stroke-linecap: round; }
  .arrowhead { fill: var(--ink); }
  .tick { stroke: var(--ink); stroke-width: 3; stroke-linecap: round; }
  .tick.major { stroke-width: 5; }
  .tick.midtick { stroke: var(--purple); }
  .minor-label { font-size: 22px; font-weight: 600; fill: var(--muted); }
  svg.compact .minor-label { font-size: 18px; }
  svg.tight .minor-label { font-size: 15px; }
  .plot-target { fill: transparent; cursor: pointer; outline: none; }
  .plot-target:hover, .plot-target:focus-visible { fill: color-mix(in srgb, var(--blue) 16%, transparent); stroke: var(--blue); stroke-width: 3; }
  .label text { font-size: 42px; font-weight: 800; fill: #b6bcc8; }
  svg.compact .label text { font-size: 34px; }
  svg.tight .label text { font-size: 30px; }
  .label .tag {
    font-size: 19px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    fill: #9aa3b2;
  }
  .label.found text { fill: var(--ink); }
  .label.found .tag { fill: var(--muted); }
  .label.mid.found text { fill: var(--purple); }
  .label.winner text { fill: var(--green); }
  .drop { stroke: var(--red); stroke-width: 3; stroke-dasharray: 6 5; }
  .point { fill: var(--red); stroke: #fff; stroke-width: 4; }
  .n { font-size: 36px; font-weight: 800; fill: var(--red); }
  svg.compact .n { font-size: 30px; }
  svg.tight .n { font-size: 26px; }
  .student-drop { stroke: var(--blue); stroke-width: 4; }
  .student-point { fill: var(--blue); stroke: #fff; stroke-width: 4; }
  .jump { stroke: var(--green); stroke-width: 7; stroke-linecap: round; opacity: 0.9; }
  .jumphead { fill: var(--green); }
</style>
