<script lang="ts">
  // The Pulley Generator: the objects on the left, the figure on the right.
  // Settings live in the page address.
  import { Box, Cog, MoveUpRight, Plus, Trash2, Triangle } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import FigureOptions from '$lib/shared/FigureOptions.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import { touching } from './pulley'
  import Pulley from './Pulley.svelte'
  import { MAX_OBJECTS, MIN_OBJECTS, numberedObject, pulleySettings, type PulleyObject } from './settings'

  const gen = createGenerator(pulleySettings, 'pulley')
  const s = $derived(gen.snapshot())

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const SETUPS = { atwood: 'Atwood machine', table: 'table and hanging mass', ramp: 'ramp and hanging mass', tackle: 'block and tackle' }
  const onSurface = $derived(s.setup === 'table' || s.setup === 'ramp')
  const three = $derived(s.objects.length > 2)
  // What each object is called in each setup, with two objects or three.
  const names = $derived.by((): string[] => {
    if (s.setup === 'atwood') return ['Left object', 'Right object', `Below the ${s.below === 'a' ? 'left' : 'right'} one`]
    if (s.setup === 'tackle') return []
    const on = s.setup === 'table' ? 'on the table' : 'on the ramp'
    const row = three ? (s.setup === 'table' ? ['Back', 'Front'] : ['Lower', 'Upper']).map((where) => `${where}, ${on}`) : [`On ${on.slice(3)}`]
    return [...row, 'Hanging']
  })
  // And whose weight each gravity label is.
  const whose = $derived.by((): string[] => {
    if (s.setup === 'atwood') return ['left object', 'right object', 'object below']
    const row = three ? (s.setup === 'table' ? ['back object', 'front object'] : ['lower object', 'upper object']) : [`object on the ${s.setup}`]
    return [...row, 'hanging object']
  })
  /** Is this object on the table or ramp (so a block or a cart)? */
  const resting = (i: number) => onSurface && i < s.objects.length - 1
  const objectsSummary = $derived(
    s.setup === 'tackle'
      ? `${shown(s.loadLabel)} held by ${s.strands} strand${s.strands === 1 ? '' : 's'}`
      : `${s.objects.map((o) => shown(o.label)).join(three ? ', ' : ' and ')}${s.setup === 'atwood' && s.lower !== 'neither' ? ` · ${s.lower === 'a' ? 'left' : 'right'} lower` : ''}${onSurface && three ? ` · ${s.joined === 'touching' ? 'touching' : 'tied'}` : ''}`,
  )
  const inTouch = $derived(touching(s))
  const vectorsSummary = $derived(
    [
      s.tension ? 'tension' : '',
      s.gravity ? 'gravity' : '',
      onSurface && s.normal ? 'normal force' : '',
      onSurface && s.friction !== 'none' ? 'friction' : '',
      inTouch && s.contact ? 'contact force' : '',
      s.acceleration !== 'none' ? 'acceleration' : '',
    ]
      .filter(Boolean)
      .join(', ') || 'none',
  )
  const FORWARD = { atwood: 'Right falls', table: 'Hanging falls', ramp: 'Hanging falls', tackle: 'Load rises' }
  const BACKWARD = { atwood: 'Left falls', table: 'Hanging rises', ramp: 'Hanging rises', tackle: 'Load falls' }
  const surfaceSummary = $derived(s.setup === 'ramp' ? `${s.angle}° · ${shown(s.angleLabel)} · ${s.surface}` : s.surface)

  // Objects still labeled m_1, m_2… in order are relabeled when one is added or
  // removed, so they still read in order; labels the teacher typed are kept.
  const inOrder = (rows: PulleyObject[]) => rows.every((o, i) => o.label.text === `m_${i + 1}` && o.gravityLabel.text === `m_${i + 1} g`)
  function renumber(rows: PulleyObject[]) {
    rows.forEach((o, i) => {
      o.label.text = `m_${i + 1}`
      o.gravityLabel.text = `m_${i + 1} g`
    })
  }
  // A third object hangs below in an Atwood machine; on a table or ramp it goes at the back of the row.
  function add() {
    const rows = gen.s.objects
    if (rows.length >= MAX_OBJECTS) return
    const relabel = inOrder(rows)
    const o = numberedObject(rows.length + 1)
    if (s.setup === 'atwood') rows.push(o)
    else rows.unshift(o)
    if (relabel) renumber(rows)
  }
  function remove(i: number) {
    const relabel = inOrder(gen.s.objects)
    gen.s.objects.splice(i, 1)
    if (relabel) renumber(gen.s.objects)
  }
</script>

<GeneratorPage name="Pulley Generator" filename="pulley" {gen}>
  {#snippet settings()}
    <Section title="Setup" icon={Cog} summary={SETUPS[s.setup]}>
      <div class="field">
        <Choice
          name="Setup"
          options={[['atwood', 'Atwood'], ['table', 'Table'], ['ramp', 'Ramp'], ['tackle', 'Block & tackle']]}
          bind:value={gen.s.setup}
        />
      </div>
    </Section>

    <Section title={s.setup === 'tackle' ? 'Load' : 'Objects'} icon={Box} summary={objectsSummary}>
      {#if s.setup === 'tackle'}
        <label class="field">
          Strands holding up the load
          <span class="slider">
            <input type="range" min="1" max="4" bind:value={gen.s.strands} />
            <output>{s.strands}</output>
          </span>
        </label>
        <div class="field">Label <LabelField name="Load label" bind:label={gen.s.loadLabel} /></div>
        <label class="field">
          Size
          <span class="slider">
            <input type="range" min="0.5" max="2" step="0.05" bind:value={gen.s.loadSize} />
            <output>{Math.round(s.loadSize * 100)}%</output>
          </span>
        </label>
      {:else}
        {#each gen.s.objects as o, i (o)}
          <div class="object">
            <div class="object-head">
              <span>{names[i]}</span>
              {#if s.objects.length > MIN_OBJECTS}
                <button type="button" class="icon-btn" aria-label="Remove {names[i].toLowerCase()}" data-tip="Remove" onclick={() => remove(i)}>
                  <Trash2 size={17} />
                </button>
              {/if}
            </div>
            {#if resting(i)}
              <div class="field">
                <Choice name="{names[i]} object" options={[['block', 'Block'], ['cart', 'Cart']]} bind:value={o.kind} />
              </div>
            {/if}
            <div class="field">Label <LabelField name="{names[i]} label" bind:label={o.label} /></div>
            <label class="field">
              Size
              <span class="slider">
                <input type="range" min="0.5" max="2" step="0.05" bind:value={o.size} />
                <output>{Math.round((s.objects[i]?.size ?? 1) * 100)}%</output>
              </span>
            </label>
          </div>
        {/each}
        {#if three && s.setup === 'atwood'}
          <div class="field">
            The third hangs below
            <Choice name="The third hangs below" options={[['a', 'Left'], ['b', 'Right']]} bind:value={gen.s.below} />
          </div>
        {/if}
        {#if three && onSurface}
          <div class="field">
            On the {s.setup}, joined
            <Choice name="Joined" options={[['string', 'By a string'], ['touching', 'Touching']]} bind:value={gen.s.joined} />
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
        {#if s.setup === 'atwood'}
          <div class="field">
            Hangs lower
            <Choice name="Hangs lower" options={[['neither', 'Neither'], ['a', 'Left'], ['b', 'Right']]} bind:value={gen.s.lower} />
          </div>
        {/if}
        {#if !three}
          <button type="button" class="btn-ghost add" onclick={add}>
            <Plus size={15} aria-hidden="true" />
            {s.setup === 'atwood' ? 'Hang a third object below' : `Add an object on the ${s.setup}`}
          </button>
        {/if}
      {/if}
    </Section>

    {#if s.setup === 'table' || s.setup === 'ramp'}
      <Section title={s.setup === 'ramp' ? 'Ramp' : 'Table'} icon={Triangle} summary={surfaceSummary}>
        {#if s.setup === 'ramp'}
          <label class="field">
            Angle
            <span class="slider">
              <input type="range" min="10" max="60" bind:value={gen.s.angle} />
              <output>{s.angle}°</output>
            </span>
          </label>
          <div class="field">Angle label <LabelField name="Angle label" bind:label={gen.s.angleLabel} /></div>
        {/if}
        <div class="field">
          Surface
          <Choice name="Surface" options={[['smooth', 'Smooth'], ['rough', 'Rough']]} bind:value={gen.s.surface} />
        </div>
      </Section>
    {/if}

    <Section title="Forces and motion" icon={MoveUpRight} summary={vectorsSummary}>
      <div class="vector">
        <label class="check"><input type="checkbox" bind:checked={gen.s.tension} /> Tension</label>
        {#if s.tension}
          <div class="field"><LabelField name="Tension label" bind:label={gen.s.tensionLabel} /></div>
          {#if three && s.setup !== 'tackle' && !inTouch}<p class="note">Two strings, so each one’s tension is numbered: T₁, T₂.</p>{/if}
        {/if}
      </div>
      <div class="vector">
        <label class="check"><input type="checkbox" bind:checked={gen.s.gravity} /> Gravity</label>
        {#if s.gravity}
          {#if s.setup === 'tackle'}
            <div class="field">On the load <LabelField name="Gravity label on the load" bind:label={gen.s.loadGravityLabel} /></div>
          {:else}
            {#each gen.s.objects as o, i (o)}
              <div class="field">On the {whose[i]} <LabelField name="Gravity label on the {whose[i]}" bind:label={o.gravityLabel} /></div>
            {/each}
          {/if}
        {/if}
      </div>
      {#if onSurface}
        <div class="vector">
          <label class="check"><input type="checkbox" bind:checked={gen.s.normal} /> Normal force</label>
          {#if s.normal}<div class="field"><LabelField name="Normal force label" bind:label={gen.s.normalLabel} /></div>{/if}
        </div>
        <div class="vector">
          <div class="field">
            Friction
            <Choice
              name="Friction"
              options={[['none', 'None'], ['toward', 'Toward the pulley'], ['away', 'Away from it']]}
              bind:value={gen.s.friction}
            />
          </div>
          {#if s.friction !== 'none'}<div class="field"><LabelField name="Friction label" bind:label={gen.s.frictionLabel} /></div>{/if}
          {#if three && (s.normal || s.friction !== 'none')}<p class="note">Numbered for each object on the {s.setup}.</p>{/if}
        </div>
      {/if}
      {#if inTouch}
        <div class="vector">
          <label class="check"><input type="checkbox" bind:checked={gen.s.contact} /> Contact force, where they touch</label>
          {#if s.contact}<div class="field"><LabelField name="Contact force label" bind:label={gen.s.contactLabel} /></div>{/if}
        </div>
      {/if}
      <div class="vector">
        <div class="field">
          Acceleration
          <Choice
            name="Acceleration"
            options={[['none', 'None'], ['forward', FORWARD[s.setup]], ['backward', BACKWARD[s.setup]]]}
            bind:value={gen.s.acceleration}
          />
        </div>
        {#if s.acceleration !== 'none'}<div class="field"><LabelField name="Acceleration label" bind:label={gen.s.accelerationLabel} /></div>{/if}
      </div>
    </Section>
    <FigureOptions bind:mirror={gen.s.mirror} bind:color={gen.s.color} />
  {/snippet}

  {#snippet figure()}
    <Pulley settings={s} id="f" />
  {/snippet}
</GeneratorPage>

<style>
  .vector + .vector { border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.25rem; }
  .object { border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; margin-bottom: 0.75rem; }
  .object-head { display: flex; align-items: center; justify-content: space-between; font-weight: 800; margin-bottom: 0.25rem; }
  .add { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; font-size: 0.85rem; border-radius: 9px; }
</style>
