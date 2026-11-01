<script lang="ts">
  // The cell itself, back to front: its outer layers, the cytoplasm, the
  // organelles, then the membrane over their edges. Each structure is a
  // group named by its data-part, so a click on the figure can tell which
  // was clicked. Membranes are drawn as a dark line with a pale one down its
  // middle, so they read as the double layer textbooks show.
  import type { CellPlan } from './cells'
  import type { Look } from './look'
  import { TUBE } from './organelles'
  import { capsule, cristae, smooth, type Pt } from './shapes'
  import type { PartId } from './structures'

  interface Props {
    plan: CellPlan
    drawn: Set<PartId>
    look: Look
    selected?: PartId
    /** shows what can be clicked, in the generator but not its preview */
    interactive?: boolean
  }
  let { plan, drawn, look, selected, interactive = false }: Props = $props()

  const has = (id: PartId) => drawn.has(id)
  const pores = $derived(has('pores'))
  /** Where a chloroplast's grana sit along its length. */
  const grana = (length: number) => {
    const n = length >= 88 ? 5 : 4
    const step = (length - 26) / (n - 1)
    return Array.from({ length: n }, (_, i) => -((length - 26) / 2) + i * step)
  }
  const GRANUM_DISCS = [-6.3, -2.1, 2.1, 6.3]
  /** The lamellae: a zigzag through the grana, up and down in turn. */
  const lamellae = (length: number) =>
    [[-(length / 2 - 9), 0], ...grana(length).map((x, i) => [x, i % 2 ? 3 : -3]), [length / 2 - 9, 0]].map((p) => p.join(',')).join(' ')
  /** Lines across a circle at 45°, `gap` apart, for hatching it. */
  const hatch = (c: Pt, r: number, gap: number): [Pt, Pt][] => {
    const lines: [Pt, Pt][] = []
    const k = Math.SQRT1_2
    for (let d = -r + gap / 2; d < r; d += gap) {
      const h = Math.sqrt(r * r - d * d)
      lines.push([
        [c[0] + d * k - h * k, c[1] + d * k + h * k],
        [c[0] + d * k + h * k, c[1] + d * k - h * k],
      ])
    }
    return lines
  }
  /** A plasmid: a small loop crossed over itself once, turned a different way each time. */
  const plasmid = (r: number, turn: number) => {
    const a = (turn * 70 * Math.PI) / 180
    const pts: Pt[] = Array.from({ length: 16 }, (_, i) => {
      const t = (i / 16) * 2 * Math.PI
      const [x, y] = [r * Math.cos(t), 0.6 * r * Math.sin(2 * t)]
      return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]
    })
    return smooth(pts, true)
  }
  const LYSOSOME_GRAINS: Pt[] = [[-5, -4], [4, -5], [-1, 2], [6, 3], [-6, 5]]
</script>

{#snippet tube(d: string, paint: { fill: string; edge: string }, width = TUBE, cap: 'round' | 'butt' = 'round')}
  <path {d} fill="none" stroke={paint.edge} stroke-width={width + 3.2} stroke-linecap={cap} stroke-linejoin="round" />
  <path {d} fill="none" stroke={paint.fill} stroke-width={width} stroke-linecap={cap} stroke-linejoin="round" />
{/snippet}

<!-- Tubes that join, drawn as one: every outline first, then every inside. -->
{#snippet tubes(ds: string[], paint: { fill: string; edge: string }, width = TUBE)}
  {#each ds as d, i (i)}
    <path {d} fill="none" stroke={paint.edge} stroke-width={width + 3.2} stroke-linecap="round" stroke-linejoin="round" />
  {/each}
  {#each ds as d, i (i)}
    <path {d} fill="none" stroke={paint.fill} stroke-width={width} stroke-linecap="round" stroke-linejoin="round" />
  {/each}
{/snippet}

<g class="cell" class:interactive>
  {#if plan.capsule && has('capsule')}
    <g data-part="capsule" class:selected={selected === 'capsule'}>
      <path d={plan.capsule} fill={look.capsule.fill} stroke={look.capsule.edge} stroke-width="2" stroke-dasharray="7 4" />
    </g>
  {/if}
  {#if plan.wall && has('wall')}
    <g data-part="wall" class:selected={selected === 'wall'}>
      <path d={plan.wall} fill={look.wall.fill} stroke={look.wall.edge} stroke-width="2.2" />
    </g>
  {/if}
  <!-- Pili reach out from the wall, through the capsule. -->
  {#if plan.pili && has('pili')}
    <g data-part="pili" class:selected={selected === 'pili'}>
      {#each plan.pili as [a, b], i (i)}
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={look.appendage.edge} stroke-width="2.2" stroke-linecap="round" />
      {/each}
    </g>
  {/if}
  {#if plan.flagellum && has('flagellum')}
    <g data-part="flagellum" class:selected={selected === 'flagellum'}>
      <path d={plan.flagellum} fill="none" stroke={look.appendage.edge} stroke-width="4" stroke-linecap="round" />
    </g>
  {/if}

  <g data-part="cytoplasm" class:selected={selected === 'cytoplasm'}>
    <path d={plan.body} fill={look.cytoplasm.fill} />
  </g>

  {#if plan.cytoskeleton && has('cytoskeleton')}
    <g data-part="cytoskeleton" class:selected={selected === 'cytoskeleton'}>
      {#each plan.cytoskeleton as d, i (i)}
        <path {d} fill="none" stroke={look.cytoskeleton.edge} stroke-width="1.8" stroke-linecap="round" />
      {/each}
    </g>
  {/if}

  {#if plan.vacuole && has('vacuole')}
    <g data-part="vacuole" class:selected={selected === 'vacuole'}>
      <path d={plan.vacuole} fill={look.vacuole.fill} />
      <!-- Its membrane, the tonoplast, as a double line like the cell's. -->
      {@render tube(plan.vacuole, look.vacuole, 2.2)}
    </g>
  {/if}

  {#if plan.nucleoid && has('nucleoid')}
    <g data-part="nucleoid" class:selected={selected === 'nucleoid'}>
      <path d={plan.nucleoid.region} fill={look.nucleoid.fill} />
      <path d={plan.nucleoid.dna} fill="none" stroke={look.nucleoid.edge} stroke-width="2.2" stroke-linejoin="round" />
    </g>
  {/if}
  {#if plan.plasmids && has('plasmid')}
    <g data-part="plasmid" class:selected={selected === 'plasmid'}>
      {#each plan.plasmids as p, i (i)}
        <!-- A small loop of DNA, twisted on itself (supercoiled). -->
        <path d={plasmid(p.r, i)} transform="translate({p.at[0]} {p.at[1]})" fill="none" stroke={look.nucleoid.edge} stroke-width="2.2" stroke-linejoin="round" />
      {/each}
    </g>
  {/if}

  {#if plan.smooth && has('smooth-er')}
    <g data-part="smooth-er" class:selected={selected === 'smooth-er'}>
      {@render tubes(plan.smooth.map((t) => t.d), look.smooth, TUBE - 1.5)}
    </g>
  {/if}

  {#if plan.nucleus && has('nucleus')}
    {@const n = plan.nucleus}
    <g data-part="nucleus" class:selected={selected === 'nucleus'}>
      <circle cx={n.c[0]} cy={n.c[1]} r={n.r} fill={look.nucleoplasm.fill} />
    </g>
    {#if has('chromatin')}
      <g data-part="chromatin" class:selected={selected === 'chromatin'}>
        {#each n.chromatin as d, i (i)}
          <path {d} fill="none" stroke={look.chromatin.edge} stroke-width="2.2" stroke-linecap="round" />
        {/each}
      </g>
    {/if}
    {#if has('nucleolus')}
      <g data-part="nucleolus" class:selected={selected === 'nucleolus'}>
        <circle cx={n.nucleolus.c[0]} cy={n.nucleolus.c[1]} r={n.nucleolus.r} fill={look.nucleolus.fill} stroke={look.nucleolus.edge} stroke-width="2" />
        {#if look.nucleolus.fill === '#fff'}
          <!-- Hatched in line art, so it reads as dense, not as an empty bubble. -->
          {#each hatch(n.nucleolus.c, n.nucleolus.r - 1, 4.5) as [a, b], i (i)}
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={look.nucleolus.edge} stroke-width="1.3" />
          {/each}
        {/if}
      </g>
    {/if}
    <g data-part="envelope" class:selected={selected === 'envelope' || selected === 'pores'}>
      {#if pores}
        {#each n.arcs as d, i (i)}
          {@render tube(d, look.envelope, 6, 'round')}
        {/each}
      {:else}
        {@render tube(n.ring, look.envelope, 6)}
      {/if}
    </g>
  {/if}

  <!-- The rough ER after the nucleus, so the sheet runs on out of the envelope. -->
  {#if plan.rough && has('rough-er')}
    <g data-part="rough-er" class:selected={selected === 'rough-er'}>
      {@render tubes(has('nucleus') ? [plan.rough.stub, plan.rough.sheet.d] : [plan.rough.sheet.d], look.rough)}
      {#each plan.rough.sheet.dots as [x, y], i (i)}
        <circle cx={x} cy={y} r="2.1" fill={look.rough.detail} />
      {/each}
    </g>
  {/if}

  {#if plan.golgi && has('golgi')}
    <g data-part="golgi" class:selected={selected === 'golgi'}>
      {#each plan.golgi.cisternae as d, i (i)}
        {@render tube(d, look.golgi, TUBE - 1)}
      {/each}
    </g>
  {/if}
  {#if plan.vesicles && has('vesicles')}
    <g data-part="vesicles" class:selected={selected === 'vesicles'}>
      {#each plan.vesicles as v, i (i)}
        <circle cx={v.at[0]} cy={v.at[1]} r={v.r} fill={look.vesicle.fill} stroke={look.vesicle.edge} stroke-width="2" />
      {/each}
    </g>
  {/if}

  {#if plan.mitochondria && has('mitochondria')}
    <g data-part="mitochondria" class:selected={selected === 'mitochondria'}>
      {#each plan.mitochondria as m, i (i)}
        <g transform="translate({m.at[0]} {m.at[1]}) rotate({m.angle})">
          <path d={capsule(m.length, m.width)} fill={look.mitochondrion.fill} stroke={look.mitochondrion.edge} stroke-width="2.2" />
          <path d={cristae(m.length - 9, m.width - 9, Math.round(m.length / 12))} fill={look.matrix.fill} stroke={look.matrix.edge} stroke-width="1.8" stroke-linejoin="round" />
        </g>
      {/each}
    </g>
  {/if}

  {#if plan.chloroplasts && has('chloroplasts')}
    <g data-part="chloroplasts" class:selected={selected === 'chloroplasts'}>
      {#each plan.chloroplasts as c, i (i)}
        <g transform="translate({c.at[0]} {c.at[1]}) rotate({c.angle})">
          <path d={capsule(c.length, c.width)} fill={look.chloroplast.fill} stroke={look.chloroplast.edge} stroke-width="2.2" />
          <path d={capsule(c.length - 8, c.width - 8)} fill="none" stroke={look.chloroplast.edge} stroke-width="1.2" />
          <!-- Stroma lamellae linking the grana, each granum a stack of thylakoids. -->
          <polyline points={lamellae(c.length)} fill="none" stroke={look.chloroplast.detail} stroke-width="1.5" stroke-linejoin="round" />
          {#each grana(c.length) as gx, g (g)}
            {#each GRANUM_DISCS as dy, k (k)}
              <rect x={gx - 5.5} y={dy - 1.8} width="11" height="3.6" rx="1.8" fill={look.granum.fill} stroke={look.granum.edge} stroke-width="1" />
            {/each}
          {/each}
        </g>
      {/each}
    </g>
  {/if}

  {#if plan.lysosomes && has('lysosomes')}
    <g data-part="lysosomes" class:selected={selected === 'lysosomes'}>
      {#each plan.lysosomes as l, i (i)}
        <circle cx={l.at[0]} cy={l.at[1]} r={l.r} fill={look.lysosome.fill} stroke={look.lysosome.edge} stroke-width="2.2" />
        {#each LYSOSOME_GRAINS as [dx, dy], k (k)}
          <circle cx={l.at[0] + dx * (l.r / 15)} cy={l.at[1] + dy * (l.r / 15)} r="1.7" fill={look.lysosome.detail} />
        {/each}
      {/each}
    </g>
  {/if}
  {#if plan.peroxisomes && has('peroxisomes')}
    <g data-part="peroxisomes" class:selected={selected === 'peroxisomes'}>
      {#each plan.peroxisomes as p, i (i)}
        <circle cx={p.at[0]} cy={p.at[1]} r={p.r} fill={look.peroxisome.fill} stroke={look.peroxisome.edge} stroke-width="2" />
        <!-- The crystalline core many peroxisomes have. -->
        <rect x={p.at[0] - p.r * 0.45} y={p.at[1] - p.r * 0.45} width={p.r * 0.9} height={p.r * 0.9} rx="1" transform="rotate(45 {p.at[0]} {p.at[1]})" fill={look.peroxisome.detail} />
      {/each}
    </g>
  {/if}
  {#if plan.centrosome && has('centrosome')}
    {@const c = plan.centrosome}
    <!-- Two centrioles at right angles: one side on, a barrel of microtubules,
         and one end on, its ring of nine triplets. -->
    <g data-part="centrosome" class:selected={selected === 'centrosome'} transform="translate({c.at[0]} {c.at[1]}) rotate({c.angle})">
      <rect x="-30" y="-8" width="34" height="16" rx="3.5" fill={look.centriole.fill} stroke={look.centriole.edge} stroke-width="1.9" />
      {#each [-3.2, 0, 3.2] as y (y)}
        <line x1="-26" y1={y} x2="0" y2={y} stroke={look.centriole.edge} stroke-width="1.2" />
      {/each}
      <circle cx="17" cy="0" r="12" fill={look.centriole.fill} stroke={look.centriole.edge} stroke-width="1.9" />
      {#each Array.from({ length: 9 }, (_, k) => k * 40) as a (a)}
        <rect x="-3" y="-1.4" width="6" height="2.8" rx="1" transform="translate(17 0) rotate({a}) translate(0 -7.5)" fill={look.centriole.edge} />
      {/each}
    </g>
  {/if}

  {#if has('ribosomes')}
    <g data-part="ribosomes" class:selected={selected === 'ribosomes'}>
      {#each plan.ribosomes as [x, y], i (i)}
        <circle cx={x} cy={y} r="2.6" fill={look.ribosome.fill} />
      {/each}
    </g>
  {/if}

  <g data-part="membrane" class:selected={selected === 'membrane'}>
    {@render tube(plan.body, look.membrane, 4.4)}
    {#if plan.microvilli && has('microvilli')}
      <g data-part="microvilli" class:selected={selected === 'microvilli'}>
        {#each plan.microvilli as d, i (i)}
          <path d="{d} Z" fill={look.cytoplasm.fill} />
          {@render tube(d, look.membrane, 4.4, 'butt')}
        {/each}
      </g>
    {/if}
  </g>

  {#if plan.plasmodesmata && has('plasmodesmata')}
    <g data-part="plasmodesmata" class:selected={selected === 'plasmodesmata'}>
      {#each plan.plasmodesmata as [a, b], i (i)}
        {@render tube(`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]}`, { fill: look.cytoplasm.fill, edge: look.membrane.edge }, 4, 'butt')}
      {/each}
    </g>
  {/if}
</g>

<style>
  /* On screen only: what can be clicked, and what was. */
  .interactive [data-part] { cursor: pointer; }
  .interactive [data-part]:hover { filter: drop-shadow(0 0 2.5px rgba(37, 99, 235, 0.95)); }
  .interactive .selected { filter: drop-shadow(0 0 2px #2563eb) drop-shadow(0 0 4px #2563eb); }
</style>
