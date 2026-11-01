<script lang="ts">
  // The Inclined Plane Generator: the objects, the ramp and its marks on the
  // left, the figure on the right. Settings live in the page address.
  import { Box, MoveUpRight, Plus, Ruler, Trash2, Triangle } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import FigureOptions from '$lib/shared/FigureOptions.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import Incline from './Incline.svelte'
  import { inclineSettings, MAX_OBJECTS, type InclineObject } from './settings'

  const gen = createGenerator(inclineSettings, 'inclined-plane')
  const s = $derived(gen.snapshot())

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const row = $derived(s.objects.length > 1)
  const objectSummary = $derived(
    row
      ? `${s.objects.map((o) => `${o.kind} ${shown(o.label)}`).join(', ')} · ${s.joined === 'touching' ? 'touching' : 'tied'}`
      : s.objects.map((o) => `${o.kind} · ${shown(o.label)} · ${Math.round(o.size * 100)}% size`).join(''),
  )
  const rampSummary = $derived(`${s.angle}° · ${shown(s.angleLabel)} · ${s.surface}`)
  // Every vector: its name, the settings that turn it on (and point it), its label, and
  // for tension and the contact force, which rows have them.
  const VECTORS = [
    { key: 'gravity', name: 'Gravity', label: 'gravityLabel' },
    { key: 'normal', name: 'Normal force', label: 'normalLabel' },
    { key: 'friction', name: 'Friction', label: 'frictionLabel', along: true },
    { key: 'applied', name: 'Applied force', label: 'appliedLabel', along: true },
    { key: 'tension', name: 'Tension in the strings', label: 'tensionLabel', joined: 'string' },
    { key: 'contact', name: 'Contact force, where they touch', label: 'contactLabel', joined: 'touching' },
    { key: 'velocity', name: 'Velocity', label: 'velocityLabel', along: true },
    { key: 'acceleration', name: 'Acceleration', label: 'accelerationLabel', along: true },
  ] as const
  const shownVectors = $derived(VECTORS.filter((v) => !('joined' in v) || (row && s.joined === v.joined)))
  const isOn = (key: (typeof VECTORS)[number]['key']) => {
    const v = s[key]
    return v !== false && v !== 'none'
  }
  const vectorsSummary = $derived(
    shownVectors
      .filter((v) => isOn(v.key))
      .map((v) => v.name.toLowerCase())
      .join(', ') || 'none',
  )

  // Objects still labeled m (one) or m_1, m_2… (a row, from the foot up) are relabeled
  // when one is added or removed, so they still read in order; labels the teacher typed are kept.
  const inOrder = (rows: InclineObject[]) => rows.every((o, i) => o.label.text === (rows.length === 1 ? 'm' : `m_${i + 1}`))
  function renumber(rows: InclineObject[]) {
    rows.forEach((o, i) => (o.label.text = rows.length === 1 ? 'm' : `m_${i + 1}`))
  }
  // A new object goes at the top of the row, a block like the one below it.
  function add() {
    const rows = gen.s.objects
    if (rows.length >= MAX_OBJECTS) return
    const relabel = inOrder(rows)
    rows.push({ label: { mode: 'text', text: `m_${rows.length + 1}` }, kind: rows.at(-1)!.kind, size: 1 })
    if (relabel) renumber(rows)
  }
  function remove(i: number) {
    const relabel = inOrder(gen.s.objects)
    gen.s.objects.splice(i, 1)
    if (relabel) renumber(gen.s.objects)
  }
  const ORDINAL = ['Lowest', 'Middle', 'Highest']
  const nameOf = (i: number) => (s.objects.length === 2 ? ['Lower', 'Upper'][i] : ORDINAL[i])
  const marksSummary = $derived(
    [s.lengthMark ? `length ${shown(s.lengthLabel)}` : '', s.heightMark ? `height ${shown(s.heightLabel)}` : ''].filter(Boolean).join(' · ') ||
      'none',
  )
</script>

<GeneratorPage name="Inclined Plane Generator" filename="inclined-plane" {gen}>
  {#snippet settings()}
    <Section title={row ? 'Objects' : 'Object'} icon={Box} summary={objectSummary}>
      {#each gen.s.objects as o, i (o)}
        {@const name = row ? `${nameOf(i)} object` : 'Object'}
        <div class:object={row}>
          {#if row}
            <div class="object-head">
              <span>{name}</span>
              <button type="button" class="icon-btn" aria-label="Remove the {name.toLowerCase()}" data-tip="Remove" onclick={() => remove(i)}>
                <Trash2 size={17} />
              </button>
            </div>
          {/if}
          <div class="field">
            <Choice {name} options={[['block', 'Block'], ['ball', 'Ball'], ['cart', 'Cart']]} bind:value={o.kind} />
          </div>
          <div class="field">Label <LabelField name="{name} label" bind:label={o.label} /></div>
          <label class="field">
            Size
            <span class="slider">
              <input type="range" min="0.5" max="2" step="0.05" bind:value={o.size} />
              <output>{Math.round((s.objects[i]?.size ?? 1) * 100)}%</output>
            </span>
          </label>
        </div>
      {/each}
      {#if row}
        <div class="field">
          Joined
          <Choice name="Joined" options={[['string', 'By strings'], ['touching', 'Touching']]} bind:value={gen.s.joined} />
        </div>
        {#if s.joined === 'string'}
          <label class="field">
            Space between
            <span class="slider">
              <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.s.spacing} />
              <output>{Math.round(s.spacing * 100)}%</output>
            </span>
          </label>
        {/if}
      {/if}
      {#if s.objects.length < MAX_OBJECTS}
        <button type="button" class="btn-ghost add" onclick={add}><Plus size={15} aria-hidden="true" /> Add an object above</button>
      {/if}
      <label class="field">
        Where on the ramp
        <span class="slider">
          <input type="range" min="0.2" max="0.85" step="0.01" bind:value={gen.s.position} />
          <output>{s.position < 0.4 ? 'low' : s.position > 0.65 ? 'high' : 'middle'}</output>
        </span>
      </label>
    </Section>

    <Section title="Ramp" icon={Triangle} summary={rampSummary}>
      <label class="field">
        Angle
        <span class="slider">
          <input type="range" min="5" max="60" bind:value={gen.s.angle} />
          <output>{s.angle}°</output>
        </span>
      </label>
      <div class="field">Angle label <LabelField name="Angle label" bind:label={gen.s.angleLabel} /></div>
      <div class="field">
        Surface
        <Choice name="Surface" options={[['smooth', 'Smooth'], ['rough', 'Rough']]} bind:value={gen.s.surface} />
      </div>
    </Section>

    <Section title="Forces and motion" icon={MoveUpRight} summary={vectorsSummary}>
      {#if row}
        <p class="note">
          Gravity, the normal force and friction are numbered for each object, from the foot up. The applied force {s.joined === 'touching'
            ? 'pushes the object at the back'
            : 'pulls the object in front'}.
        </p>
      {/if}
      {#each shownVectors as v (v.key)}
        <div class="vector">
          {#if 'along' in v}
            <div class="field">
              {v.name}
              <Choice
                name={v.name}
                options={[['none', 'None'], ['up', 'Up the ramp'], ['down', 'Down the ramp']]}
                bind:value={gen.s[v.key]}
              />
            </div>
          {:else}
            <label class="check"><input type="checkbox" bind:checked={gen.s[v.key]} /> {v.name}</label>
          {/if}
          {#if isOn(v.key)}
            <div class="field"><LabelField name="{v.name} label" bind:label={gen.s[v.label]} /></div>
          {/if}
        </div>
      {/each}
    </Section>

    <Section title="Marks" icon={Ruler} summary={marksSummary}>
      <label class="check"><input type="checkbox" bind:checked={gen.s.lengthMark} /> Length of the ramp</label>
      {#if s.lengthMark}<div class="field"><LabelField name="Length label" bind:label={gen.s.lengthLabel} /></div>{/if}
      <label class="check"><input type="checkbox" bind:checked={gen.s.heightMark} /> Height of the ramp</label>
      {#if s.heightMark}<div class="field"><LabelField name="Height label" bind:label={gen.s.heightLabel} /></div>{/if}
    </Section>
    <FigureOptions bind:mirror={gen.s.mirror} bind:color={gen.s.color} />
  {/snippet}

  {#snippet figure()}
    <Incline settings={s} id="f" />
  {/snippet}
</GeneratorPage>

<style>
  .vector + .vector { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.25rem; }
  .object { border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
  .object-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; margin-bottom: 0.25rem; }
  .add { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; font-size: 0.85rem; border-radius: 9px; margin-bottom: 0.75rem; }
</style>
