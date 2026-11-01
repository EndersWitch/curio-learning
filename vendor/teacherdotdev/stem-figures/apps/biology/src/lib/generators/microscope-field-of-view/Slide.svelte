<script lang="ts">
  // What's on the slide, drawn around (0, 0) at `k` pixels per µm. Only what
  // reaches into a field `R` pixels in radius is drawn; the field clips it.
  // In black and white, stains and chloroplasts are grays, so a photocopy
  // keeps every part apart.
  import { letterE, paramecium, roundCell } from './shapes'
  import type { Arranged, LooseItem, Specimen } from './specimens'

  interface Props {
    slide: Arranged
    specimen: Specimen
    k: number
    R: number
    color: boolean
    /** the letter e upside down and backwards, as seen through the eyepiece */
    inverted: boolean
  }
  let { slide, specimen, k, R, color, inverted }: Props = $props()

  const INK = '#222'
  const r2 = (n: number) => Math.round(n * 100) / 100
  const px = (um: number) => r2(um * k)
  /** a line's width for something `size` pixels across: thinner when tiny */
  const line = (size: number, most = 1.5) => r2(Math.min(most, Math.max(0.5, size * 0.05)))

  const look = $derived(
    color
      ? {
          onion: { fill: '#fbf3e1', wall: '#4a3b22', nucleus: '#c49a55', nucleusInk: '#6b4b1c' },
          elodea: { fill: '#f0f7e8', wall: '#2f4526', plastid: '#5b9a3a', plastidInk: '#2d5a1b' },
          cheek: { fill: '#f1f4fb', ink: '#3b4a6b', nucleus: '#6276b4' },
          blood: { fill: '#f1bcbc', ink: '#8e3636', pale: '#fbe4e4' },
          cell: { fill: '#fff', ink: INK, nucleus: '#93b2d9' },
          paramecium: { fill: '#efe6c6', ink: INK, nucleus: '#8c7a45' },
        }
      : {
          onion: { fill: '#fff', wall: '#333', nucleus: '#a5a5a5', nucleusInk: '#333' },
          elodea: { fill: '#fff', wall: '#333', plastid: '#8f8f8f', plastidInk: '#3a3a3a' },
          cheek: { fill: '#fff', ink: '#333', nucleus: '#7a7a7a' },
          blood: { fill: '#cdcdcd', ink: '#333', pale: '#fafafa' },
          cell: { fill: '#fff', ink: INK, nucleus: '#a8a8a8' },
          paramecium: { fill: '#e6e6e6', ink: INK, nucleus: '#7a7a7a' },
        },
  )

  /** within reach of the field, in µm from its middle */
  const inField = (x: number, y: number, reach: number) => (x * k) ** 2 + (y * k) ** 2 <= (R + reach * k) ** 2

  const cells = $derived(
    slide.kind === 'tissue'
      ? slide.cells.filter((c) => {
          const [x, y] = c.corners.reduce((sum, p) => [sum[0] + p[0] / 4, sum[1] + p[1] / 4], [0, 0])
          const reach = Math.max(...c.corners.map((p) => Math.hypot(p[0] - x, p[1] - y)))
          return inField(x, y, reach)
        })
      : [],
  )
  const items = $derived(slide.kind === 'loose' ? slide.items.filter((i) => inField(i.x, i.y, i.size * 0.6)) : [])
  const points = (c: (typeof cells)[number]) => c.corners.map(([x, y]) => `${px(x)},${px(y)}`).join(' ')
  const transform = (i: LooseItem) => `translate(${px(i.x)} ${px(i.y)})${i.angle ? ` rotate(${i.angle})` : ''}`
</script>

{#if slide.kind === 'tissue'}
  {@const wide = cells.length ? (cells[0].corners[3][1] - cells[0].corners[0][1]) * k : 0}
  {#if specimen === 'elodea'}
    {@const c = look.elodea}
    {#each cells as cell, i (i)}
      <polygon points={points(cell)} fill={c.fill} stroke={c.wall} stroke-width={line(wide, 1.6)} stroke-linejoin="round" />
      {#if wide * 0.11 >= 1.5}
        {#each cell.chloroplasts as [x, y, a], j (j)}
          <ellipse
            cx={px(x)} cy={px(y)} rx={r2(wide * 0.11)} ry={r2(wide * 0.07)}
            transform={a ? `rotate(${a} ${px(x)} ${px(y)})` : undefined}
            fill={c.plastid} stroke={c.plastidInk} stroke-width={line(wide * 0.1, 0.8)}
          />
        {/each}
      {/if}
    {/each}
  {:else}
    {@const c = look.onion}
    {#each cells as cell, i (i)}
      <polygon points={points(cell)} fill={c.fill} stroke={c.wall} stroke-width={line(wide, 1.6)} stroke-linejoin="round" />
      {#if cell.nucleus && cell.nucleus.r * k >= 1}
        {@const n = cell.nucleus}
        <ellipse cx={px(n.x)} cy={px(n.y)} rx={px(n.r * 1.15)} ry={px(n.r)} fill={c.nucleus} stroke={c.nucleusInk} stroke-width={line(n.r * k, 1)} />
        {#if n.r * k >= 6}
          <circle cx={px(n.x + n.r * 0.25)} cy={px(n.y - n.r * 0.2)} r={px(n.r * 0.28)} fill={c.nucleusInk} />
        {/if}
      {/if}
    {/each}
  {/if}
{:else if slide.kind === 'loose'}
  {#each items as it, i (i)}
    {@const r = (it.size * k) / 2}
    <g transform={transform(it)}>
      {#if specimen === 'blood'}
        {@const c = look.blood}
        <circle r={r2(r)} fill={c.fill} stroke={c.ink} stroke-width={line(r * 2, 1.2)} />
        {#if r >= 3}<circle r={r2(r * 0.45)} fill={c.pale} />{/if}
      {:else if specimen === 'paramecium'}
        {@const c = look.paramecium}
        {@const p = paramecium(it.size * k)}
        {#if p.cilia}<path d={p.cilia} stroke={c.ink} stroke-width="0.8" stroke-linecap="round" />{/if}
        <path d={p.outline} fill={c.fill} stroke={c.ink} stroke-width={p.edge} stroke-linejoin="round" />
        {#if p.groove}<path d={p.groove} fill="none" stroke={c.ink} stroke-width="1" stroke-linecap="round" />{/if}
        {#if p.mouth}<circle {...p.mouth} fill="#fff" stroke={c.ink} stroke-width="1" />{/if}
        {#if p.macronucleus}
          <ellipse {...p.macronucleus} fill={c.nucleus} stroke={c.ink} stroke-width={line(r * 0.3, 1)} stroke-opacity={r < 15 ? 0 : 1} />
        {/if}
        {#if p.micronucleus}<circle {...p.micronucleus} fill={c.ink} />{/if}
        {#each p.vacuoles as v, j (j)}
          <path d={v.canals} stroke={c.ink} stroke-width="1" stroke-linecap="round" />
          <circle cx={v.cx} cy={v.cy} r={v.r} fill="#fff" stroke={c.ink} stroke-width="1" />
        {/each}
        {#each p.food as f, j (j)}
          <circle {...f} fill="none" stroke={c.ink} stroke-width="0.8" />
        {/each}
      {:else if specimen === 'circles'}
        <circle r={r2(r)} fill="#fff" stroke={INK} stroke-width={line(r * 2)} />
      {:else}
        {@const c = specimen === 'cheek' ? look.cheek : look.cell}
        {@const nr = r * (specimen === 'cheek' ? 0.17 : 0.3)}
        <path d={roundCell(r, it.outline)} fill={c.fill} stroke={c.ink} stroke-width={line(r * 2)} stroke-linejoin="round" />
        {#if nr >= 1}
          <circle cx={r2(it.nucleus[0] * r)} cy={r2(it.nucleus[1] * r)} r={r2(nr)} fill={c.nucleus} stroke={c.ink} stroke-width={line(nr, 1)} />
        {/if}
      {/if}
    </g>
  {/each}
{:else if slide.kind === 'letter'}
  {@const e = letterE(slide.size * k)}
  <path d={e.d} fill="none" stroke="#111" stroke-width={e.width} transform={inverted ? 'rotate(180)' : undefined} />
{/if}
