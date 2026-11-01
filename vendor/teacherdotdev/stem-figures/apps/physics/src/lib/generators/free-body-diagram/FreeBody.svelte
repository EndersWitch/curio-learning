<script lang="ts">
  // The Free Body Diagram figure, as a self-contained SVG that prints crisply
  // and exports cleanly. Mirror is applied to the angles (see fbd.ts), so
  // nothing here is flipped and every label reads normally.
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import ObjectShape from '$lib/shared/ObjectShape.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { palette } from '$lib/shared/figure'
  import { LABEL_SIZE } from '$lib/shared/layout'
  import { buildFbd } from './fbd'
  import type { FbdSettings } from './settings'

  let { settings, id = 'b' }: { settings: FbdSettings; id?: string } = $props()

  const fig = $derived(buildFbd(settings))
  const p = $derived(palette(settings.color))
  const baseline = LABEL_SIZE * 0.35

  const description = $derived(
    `A free body diagram of a ${settings.body} with ${settings.forces.length} force${settings.forces.length === 1 ? '' : 's'} on it`,
  )
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-free-body-diagram"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />

  {#if fig.body.kind !== 'dot'}
    <g transform="translate({fig.body.at.x} {fig.body.at.y})">
      <ObjectShape kind={fig.body.kind} size={fig.body.size} fill={p.object} stroke={p.ink} />
    </g>
  {/if}

  {#each fig.components as c}
    {#each c.guides as g}<line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={p.hidden} stroke-width="1.3" stroke-dasharray="2 4" stroke-linecap="round" />{/each}
    <VectorArrow v={c.x} color={p.component} style="component" halo={false} />
    <VectorArrow v={c.y} color={p.component} style="component" halo={false} />
  {/each}

  {#each fig.marks as m}
    {#if m.ref.x1 !== m.ref.x2 || m.ref.y1 !== m.ref.y2}
      <line x1={m.ref.x1} y1={m.ref.y1} x2={m.ref.x2} y2={m.ref.y2} stroke={p.ink} stroke-width="1.3" stroke-dasharray="6 4" />
    {/if}
    <path
      d="M{m.arc.from.x},{m.arc.from.y} A{m.arc.r},{m.arc.r} 0 0 {m.arc.sweep} {m.arc.to.x},{m.arc.to.y}"
      fill="none"
      stroke={p.ink}
      stroke-width="1.5"
    />
  {/each}

  <!-- Forces start inside the body, so they need no white outline to stand clear of it. -->
  {#each fig.forces as f}<VectorArrow v={f.v} color={p.vector} halo={false} />{/each}

  {#each fig.motion as m}<VectorArrow v={m.v} color={p.vector} style="motion" />{/each}

  <!-- The dot, or on an object the point every force starts from. -->
  <circle cx={fig.body.middle.x} cy={fig.body.middle.y} r={fig.body.kind === 'dot' ? fig.body.width / 2 : 3.5} fill={p.ink} />

  {#each fig.marks as m}
    <FigureLabel label={m.label} x={m.labelAt.x} y={m.labelAt.y + baseline} size={LABEL_SIZE} color={p.ink} />
  {/each}
  {#each fig.components as c}
    <FigureLabel label={c.xLabel} x={c.xLabelAt.x} y={c.xLabelAt.y + baseline} size={LABEL_SIZE} color={p.component} />
    <FigureLabel label={c.yLabel} x={c.yLabelAt.x} y={c.yLabelAt.y + baseline} size={LABEL_SIZE} color={p.component} />
  {/each}
  {#each fig.motion as m}
    <FigureLabel label={m.label} x={m.labelAt.x} y={m.labelAt.y + baseline} size={LABEL_SIZE} color={p.vector} />
  {/each}
  {#each fig.forces as f}
    <FigureLabel label={f.label} x={f.labelAt.x} y={f.labelAt.y + baseline} size={LABEL_SIZE} color={p.vector} />
  {/each}
</svg>
