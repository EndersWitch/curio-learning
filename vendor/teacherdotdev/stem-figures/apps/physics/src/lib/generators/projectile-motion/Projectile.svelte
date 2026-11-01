<script lang="ts">
  // The Projectile Motion figure, as a self-contained SVG that prints crisply
  // and exports cleanly. Shapes are drawn inside the mirror transform; labels
  // outside it, so they stay readable. Arrows have no white outline; each
  // label has a white box behind it instead, so it reads over the path.
  import DimensionLine from '$lib/shared/DimensionLine.svelte'
  import FigureLabel from '$lib/shared/FigureLabel.svelte'
  import LabelBackdrop from '$lib/shared/LabelBackdrop.svelte'
  import ObjectShape from '$lib/shared/ObjectShape.svelte'
  import VectorArrow from '$lib/shared/VectorArrow.svelte'
  import { mirrorTransform, mirrorX, palette } from '$lib/shared/figure'
  import type { Label } from '$lib/shared/label'
  import type { Point } from '$lib/shared/vector'
  import { buildProjectile, LABEL_SIZE } from './projectile'
  import { launchAngle, type ProjectileSettings } from './settings'

  let { settings, id = 'j' }: { settings: ProjectileSettings; id?: string } = $props()

  const fig = $derived(buildProjectile(settings))
  const p = $derived(palette(settings.color))
  const mx = (x: number) => mirrorX(settings.mirror, fig.width, x)
  const baseline = LABEL_SIZE * 0.35
  const balls = $derived([fig.launch, ...fig.positions])
  const angle = $derived(launchAngle(settings))

  const description = $derived(
    `A ${settings.object} launched at ${angle}° ${settings.start === 'cliff' ? 'from the top of a cliff' : 'from level ground'}${settings.path ? ', with its path dashed' : ''}`,
  )
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 {fig.width} {fig.height}"
  width={fig.width}
  height={fig.height}
  role="img"
  aria-label={description}
  id="{id}-projectile-motion"
>
  <defs><LabelBackdrop id="{id}-label-box" /></defs>
  <rect class="paper" width={fig.width} height={fig.height} fill="#fff" />
  <g transform={mirrorTransform(settings.mirror, fig.width)} stroke-linecap="round">
    <line x1={fig.ground.x1} y1={fig.ground.y1} x2={fig.ground.x2} y2={fig.ground.y2} stroke={p.ink} stroke-width="2" />
    {#if fig.cliff}
      <path d="M{fig.cliff.map((c) => `${c.x},${c.y}`).join(' L')}" fill={p.surface} stroke={p.ink} stroke-width="2.5" stroke-linejoin="round" />
    {/if}

    {#each fig.extensions as e}<line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={p.ink} stroke-width="1" />{/each}
    {#if fig.heightMark}<DimensionLine m={fig.heightMark} color={p.ink} />{/if}
    {#if fig.rangeMark}<DimensionLine m={fig.rangeMark} color={p.ink} />{/if}
    {#if fig.cliffMark}<DimensionLine m={fig.cliffMark} color={p.ink} />{/if}

    {#if settings.path}
      <path
        d="M{fig.drawnPath.from.x},{fig.drawnPath.from.y} Q{fig.drawnPath.control.x},{fig.drawnPath.control.y} {fig.drawnPath.to.x},{fig.drawnPath.to.y}"
        fill="none"
        stroke={p.ink}
        stroke-width="2"
        stroke-dasharray="7 6"
      />
    {/if}

    {#if fig.angle}
      {#if fig.angle.ref}
        <line x1={fig.angle.ref.x1} y1={fig.angle.ref.y1} x2={fig.angle.ref.x2} y2={fig.angle.ref.y2} stroke={p.ink} stroke-width="1.3" stroke-dasharray="6 4" />
      {/if}
      <!-- Counterclockwise on the page, where y points down: SVG's negative sweep. -->
      <path
        d="M{fig.angle.arc.from.x},{fig.angle.arc.from.y} A{fig.angle.arc.r},{fig.angle.arc.r} 0 0 0 {fig.angle.arc.to.x},{fig.angle.arc.to.y}"
        fill="none"
        stroke={p.ink}
        stroke-width="1.5"
      />
    {/if}

    {#each fig.guides as g}<line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke={p.hidden} stroke-width="1.3" stroke-dasharray="2 4" />{/each}
    {#each fig.components as c}<VectorArrow v={c.v} color={p.component} style="component" halo={false} />{/each}
    <!-- Velocity and g are motion, not forces, so both are dashed. -->
    {#each fig.vectors as v}<VectorArrow v={v.v} color={p.vector} style="motion" halo={false} />{/each}

    <!-- On top, so the velocity and its components come out of the ball's edge. -->
    {#each balls as b}
      {#if fig.object.kind === 'ball'}
        <g transform="translate({b.x} {b.y + fig.object.r})">
          <ObjectShape kind="ball" size={fig.object.size} fill={p.object} stroke={p.ink} />
        </g>
      {:else}
        <circle cx={b.x} cy={b.y} r={fig.object.r} fill={p.ink} />
      {/if}
    {/each}
  </g>

  {#snippet text(label: Label, at: Point | null, color: string, italic = true)}
    {#if at}<FigureLabel {label} x={mx(at.x)} y={at.y + baseline} size={LABEL_SIZE} {color} {italic} backdrop="{id}-label-box" />{/if}
  {/snippet}
  {@render text(settings.angleLabel, fig.angle?.labelAt ?? null, p.ink)}
  {#each fig.components as c}{@render text(c.label, c.labelAt, p.component)}{/each}
  {#each fig.vectors as v}{@render text(v.label, v.labelAt, p.vector)}{/each}
  {#each fig.letters as l}{@render text(l.label, l.at, p.ink, false)}{/each}
  {@render text(settings.heightLabel, fig.heightLabelAt, p.ink)}
  {@render text(settings.rangeLabel, fig.rangeLabelAt, p.ink)}
  {@render text(settings.cliffLabel, fig.cliffLabelAt, p.ink)}
</svg>
