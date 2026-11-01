<script lang="ts">
  // The Inclined Plane figure, as a self-contained SVG that prints crisply and
  // exports cleanly. Shapes are drawn inside the mirror transform; labels
  // outside it, so they stay readable.
  import DimensionLine from '$lib/shared/DimensionLine.svelte'
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import { baselineBelowMiddle } from '$lib/shared/label'
  import ObjectShape from '$lib/shared/ObjectShape.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { styleOf } from '$lib/shared/vector'
  import { mirrorAnchor, mirrorTransform, mirrorX, palette } from '$lib/shared/figure'
  import { buildIncline } from './incline'
  import type { InclineSettings } from './settings'

  let { settings, id = 'i' }: { settings: InclineSettings; id?: string } = $props()

  const fig = $derived(buildIncline(settings))
  const p = $derived(palette(settings.color))
  const mx = (x: number) => mirrorX(settings.mirror, fig.width, x)
  const SIZE = 22
  const { foot, corner, top } = $derived(fig.ramp)

  const COUNT = ['', 'A', 'Two', 'Three']
  const objects = $derived(
    settings.objects.length === 1
      ? `A ${settings.objects[0].kind}`
      : `${COUNT[settings.objects.length]} objects ${settings.joined === 'touching' ? 'touching' : 'tied together'}`,
  )
  const description = $derived(`${objects} on an inclined plane at ${settings.angle}°${settings.surface === 'rough' ? ' with a rough surface' : ''}`)
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-inclined-plane"
>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />
  <g transform={mirrorTransform(settings.mirror, fig.width)} stroke-linecap="round">
    <line x1={fig.ground.x1} y1={fig.ground.y1} x2={fig.ground.x2} y2={fig.ground.y2} stroke={p.ink} stroke-width="2.5" />
    {#each fig.groundHatches as h}<line x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={p.ink} stroke-width="1.3" />{/each}

    <path d="M{foot.x},{foot.y} L{corner.x},{corner.y} L{top.x},{top.y} Z" fill={p.surface} stroke={p.ink} stroke-width="2.5" stroke-linejoin="round" />
    {#each fig.hatches as h}<line x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} stroke={p.ink} stroke-width="1.3" />{/each}
    <path d={fig.arc} transform="translate({foot.x} {foot.y})" fill="none" stroke={p.ink} stroke-width="1.5" />

    {#each fig.strings as st}<line x1={st.x1} y1={st.y1} x2={st.x2} y2={st.y2} stroke={p.ink} stroke-width="2.2" />{/each}
    {#each fig.objects as o}
      <g transform="translate({o.at.x} {o.at.y}) rotate({o.tilt})">
        <ObjectShape kind={o.kind} size={o.size} fill={p.object} stroke={p.ink} />
      </g>
    {/each}

    {#each fig.extensions as e}<line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={p.ink} stroke-width="1" />{/each}
    {#if fig.lengthMark}<DimensionLine m={fig.lengthMark} color={p.ink} />{/if}
    {#if fig.heightMark}<DimensionLine m={fig.heightMark} color={p.ink} />{/if}

    {#each fig.vectors as v}<VectorArrow v={v.v} color={p.vector} style={styleOf(v.kind)} halo={false} />{/each}
  </g>

  <FigureLabel label={settings.angleLabel} x={mx(fig.angleLabelAt.x)} y={fig.angleLabelAt.y + SIZE * 0.35} size={SIZE} color={p.ink} />
  {#each fig.objects as o}
    <FigureLabel label={o.label} x={mx(o.labelAt.x)} y={o.labelAt.y + baselineBelowMiddle(o.label, SIZE)} size={SIZE} color={p.ink} halo={false} blank={30} />
  {/each}
  {#each fig.vectors as v}
    <FigureLabel label={v.label} x={mx(v.labelAt.x)} y={v.labelAt.y + SIZE * 0.35} size={SIZE} color={p.vector} />
  {/each}
  {#if fig.lengthLabelAt}
    <FigureLabel label={settings.lengthLabel} x={mx(fig.lengthLabelAt.x)} y={fig.lengthLabelAt.y + SIZE * 0.35} size={SIZE} color={p.ink} />
  {/if}
  {#if fig.heightLabelAt}
    <FigureLabel
      label={settings.heightLabel}
      x={mx(fig.heightLabelAt.x - 8)}
      y={fig.heightLabelAt.y + SIZE * 0.35}
      anchor={mirrorAnchor(settings.mirror, 'start')}
      size={SIZE}
      color={p.ink}
    />
  {/if}
</svg>
