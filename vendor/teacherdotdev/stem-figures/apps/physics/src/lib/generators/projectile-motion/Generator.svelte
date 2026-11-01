<script lang="ts">
  // The Projectile Motion Generator: the launch, the object, its path, vectors
  // and marks on the left, the figure on the right. Settings live in the page
  // address.
  import { Circle, Mountain, MoveUpRight, Ruler, Spline } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import FigureOptions from '$lib/shared/FigureOptions.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import Projectile from './Projectile.svelte'
  import { launchAngle, MIN_GROUND_ANGLE, projectileSettings } from './settings'

  const gen = createGenerator(projectileSettings, 'projectile-motion')
  const s = $derived(gen.snapshot())
  const angle = $derived(launchAngle(s))

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const height = (h: number) => (h < 0.45 ? 'low' : h > 0.9 ? 'high' : 'medium')
  const launchSummary = $derived(
    [`${angle}°`, s.start === 'cliff' ? `${height(s.cliffHeight)} cliff` : 'from the ground', s.angleMark && angle > 0 ? shown(s.angleLabel) : '']
      .filter(Boolean)
      .join(' · '),
  )
  const objectSummary = $derived(s.object === 'dot' ? 'dot' : `ball · ${Math.round(s.objectSize * 100)}% size`)
  const pathSummary = $derived(
    [s.path ? 'dashed' : 'hidden', s.positions ? `${s.positions} time step${s.positions === 1 ? '' : 's'}` : '', s.letters && s.positions ? 'lettered' : '']
      .filter(Boolean)
      .join(' · '),
  )
  const vectorsSummary = $derived(
    [s.velocity ? `velocity ${shown(s.velocityLabel)}` : '', s.velocity && s.components && angle > 0 ? 'components' : '', s.gravity ? `g ${shown(s.gravityLabel)}` : '']
      .filter(Boolean)
      .join(' · ') || 'none',
  )
  const marksSummary = $derived(
    [
      s.heightMark && angle > 0 ? `max height ${shown(s.heightLabel)}` : '',
      s.rangeMark ? `range ${shown(s.rangeLabel)}` : '',
      s.cliffMark && s.start === 'cliff' ? `cliff ${shown(s.cliffLabel)}` : '',
    ]
      .filter(Boolean)
      .join(' · ') || 'none',
  )
</script>

<GeneratorPage name="Projectile Motion Generator" filename="projectile-motion" {gen}>
  {#snippet settings()}
    <Section title="Launch" icon={Mountain} summary={launchSummary}>
      <div class="field">
        From
        <Choice name="Launched from" options={[['ground', 'Level ground'], ['cliff', 'A cliff']]} bind:value={gen.s.start} />
      </div>
      {#if s.start === 'cliff'}
        <label class="field">
          Cliff height
          <span class="slider">
            <input type="range" min="0.2" max="1.5" step="0.05" bind:value={gen.s.cliffHeight} />
            <output>{height(s.cliffHeight)}</output>
          </span>
        </label>
      {/if}
      <label class="field">
        Angle
        <span class="slider">
          <input type="range" min={s.start === 'ground' ? MIN_GROUND_ANGLE : 0} max="85" bind:value={gen.s.angle} />
          <output>{angle}°</output>
        </span>
      </label>
      {#if angle > 0}
        <label class="check"><input type="checkbox" bind:checked={gen.s.angleMark} /> Mark the angle</label>
        {#if s.angleMark}<div class="field"><LabelField name="Angle label" bind:label={gen.s.angleLabel} /></div>{/if}
      {:else}
        <p class="note">Launched horizontally, straight off the edge.</p>
      {/if}
    </Section>

    <Section title="Object" icon={Circle} summary={objectSummary}>
      <div class="field">
        <Choice name="Object" options={[['ball', 'Ball'], ['dot', 'Dot']]} bind:value={gen.s.object} />
      </div>
      {#if s.object === 'ball'}
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.3" max="1.2" step="0.05" bind:value={gen.s.objectSize} />
            <output>{Math.round(s.objectSize * 100)}%</output>
          </span>
        </label>
      {/if}
    </Section>

    <Section title="Path" icon={Spline} summary={pathSummary}>
      <label class="check"><input type="checkbox" bind:checked={gen.s.path} /> Show the path</label>
      <label class="field">
        {s.object === 'dot' ? 'Dot' : 'Ball'} at equal time steps
        <span class="slider">
          <input type="range" min="0" max="8" bind:value={gen.s.positions} />
          <output>{s.positions || 'none'}</output>
        </span>
      </label>
      {#if s.positions > 0}
        <label class="check"><input type="checkbox" bind:checked={gen.s.letters} /> Letter them A, B, C…</label>
      {/if}
    </Section>

    <Section title="Velocity and gravity" icon={MoveUpRight} summary={vectorsSummary}>
      <div class="vector">
        <label class="check"><input type="checkbox" bind:checked={gen.s.velocity} /> Launch velocity</label>
        {#if s.velocity}
          <div class="field"><LabelField name="Velocity label" bind:label={gen.s.velocityLabel} /></div>
          {#if angle > 0}
            <label class="check"><input type="checkbox" bind:checked={gen.s.components} /> Its components</label>
            {#if s.components}
              <div class="field">Horizontal <LabelField name="Horizontal component label" bind:label={gen.s.xLabel} /></div>
              <div class="field">Vertical <LabelField name="Vertical component label" bind:label={gen.s.yLabel} /></div>
            {/if}
          {/if}
        {/if}
      </div>
      <div class="vector">
        <label class="check"><input type="checkbox" bind:checked={gen.s.gravity} /> Acceleration due to gravity</label>
        {#if s.gravity}<div class="field"><LabelField name="Gravity label" bind:label={gen.s.gravityLabel} /></div>{/if}
      </div>
    </Section>

    <Section title="Marks" icon={Ruler} summary={marksSummary}>
      {#if angle > 0}
        <label class="check"><input type="checkbox" bind:checked={gen.s.heightMark} /> Maximum height</label>
        {#if s.heightMark}<div class="field"><LabelField name="Maximum height label" bind:label={gen.s.heightLabel} /></div>{/if}
      {/if}
      <label class="check"><input type="checkbox" bind:checked={gen.s.rangeMark} /> Range</label>
      {#if s.rangeMark}<div class="field"><LabelField name="Range label" bind:label={gen.s.rangeLabel} /></div>{/if}
      {#if s.start === 'cliff'}
        <label class="check"><input type="checkbox" bind:checked={gen.s.cliffMark} /> Height of the cliff</label>
        {#if s.cliffMark}<div class="field"><LabelField name="Cliff height label" bind:label={gen.s.cliffLabel} /></div>{/if}
      {/if}
    </Section>
    <FigureOptions bind:mirror={gen.s.mirror} bind:color={gen.s.color} />
  {/snippet}

  {#snippet figure()}
    <Projectile settings={s} id="f" />
  {/snippet}
</GeneratorPage>

<style>
  .vector + .vector { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.25rem; }
  .note { margin: 0; font-size: 0.85rem; color: var(--muted); }
</style>
