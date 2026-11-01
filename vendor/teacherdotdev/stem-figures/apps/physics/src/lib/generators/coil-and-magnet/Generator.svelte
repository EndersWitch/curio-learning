<script lang="ts">
  // The Coil and Magnet Generator: the coil, the magnet and its motion on the
  // left, the figure on the right. Settings live in the page address.
  import { Cable, Gauge, Magnet, MoveRight, Spline } from '@lucide/svelte'
  import Choice from '$lib/shared/Choice.svelte'
  import { createGenerator } from '$lib/shared/generator.svelte'
  import FigureOptions from '$lib/shared/FigureOptions.svelte'
  import GeneratorPage from '$shared/GeneratorPage.svelte'
  import LabelField from '$lib/shared/LabelField.svelte'
  import type { Label } from '$lib/shared/label'
  import Section from '$lib/shared/Section.svelte'
  import CoilMagnet from './CoilMagnet.svelte'
  import { coilSettings } from './settings'

  const gen = createGenerator(coilSettings, 'coil-and-magnet')
  const s = $derived(gen.snapshot())

  const shown = (l: Label) => (l.mode === 'text' ? `“${l.text}”` : l.mode === 'blank' ? 'blank' : 'no label')
  const DISTANCES = { outside: 'beside the coil', mouth: 'at the coil’s end', inside: 'inside the coil' }

  const coilSummary = $derived(`${s.turns} turn${s.turns === 1 ? '' : 's'}`)
  const magnetSummary = $derived(
    s.source === 'none'
      ? 'nothing'
      : s.source === 'battery'
        ? `battery, + on the ${s.batteryPlus}`
        : `bar magnet, ${s.facing} pole facing the coil · ${DISTANCES[s.distance]}`,
  )
  const FIELDS = { magnet: 'the magnet’s', coil: 'the coil’s', both: 'the magnet’s and the coil’s', none: '' }
  const fieldSummary = $derived(
    s.source === 'none' || s.fieldLines === 'none'
      ? 'none'
      : s.source === 'battery'
        ? `the coil’s · ${s.lineCount * 2} lines`
        : `${FIELDS[s.fieldLines]} · ${s.lineCount * 2} lines`,
  )
  const NEEDLE = { left: 'needle left', center: 'needle centered', right: 'needle right', blank: 'needle blank' }
  const meterSummary = $derived(
    [s.meter ? `meter, ${NEEDLE[s.needle]}` : 'no meter', s.current === 'none' ? '' : s.source === 'battery' ? 'current shown' : `current ${s.current} the front`]
      .filter(Boolean)
      .join(' · '),
  )
  const motionSummary = $derived(
    s.source === 'none' ? 'no magnet' : s.motion === 'none' ? 'not moving' : `${s.motion} the coil · ${shown(s.motionLabel)}`,
  )
</script>

<GeneratorPage name="Coil and Magnet Generator" filename="coil-and-magnet" {gen}>
  {#snippet settings()}
    <Section title="Coil" icon={Cable} summary={coilSummary}>
      <label class="field">
        Turns
        <span class="slider">
          <input type="range" min="1" max="20" bind:value={gen.s.turns} />
          <output>{s.turns}</output>
        </span>
      </label>
    </Section>

    <Section title="Beside the coil" icon={Magnet} summary={magnetSummary}>
      <div class="field">
        <Choice name="Beside the coil" options={[['magnet', 'Bar magnet'], ['battery', 'Battery'], ['none', 'Nothing']]} bind:value={gen.s.source} />
      </div>
      {#if s.source === 'battery'}
        <div class="field">
          Positive terminal
          <Choice name="Positive terminal" options={[['left', 'Left'], ['right', 'Right']]} bind:value={gen.s.batteryPlus} />
        </div>
      {/if}
      {#if s.source === 'magnet'}
        <div class="field">
          Pole facing the coil
          <Choice name="Pole facing the coil" options={[['N', 'North'], ['S', 'South']]} bind:value={gen.s.facing} />
        </div>
        <label class="field">
          Where it is
          <select bind:value={gen.s.distance}>
            <option value="outside">Beside the coil</option>
            <option value="mouth">At the coil’s end</option>
            <option value="inside">Inside the coil</option>
          </select>
        </label>
        <p class="subhead">Pole labels</p>
        <div class="field">North <LabelField name="North pole label" bind:label={gen.s.north} /></div>
        <div class="field">South <LabelField name="South pole label" bind:label={gen.s.south} /></div>
      {/if}
    </Section>

    {#if s.source !== 'none'}
      <Section title="Field lines" icon={Spline} summary={fieldSummary}>
        {#if s.source === 'magnet'}
          <div class="field">
            Show
            <Choice
              name="Field lines"
              options={[['magnet', 'Magnet’s'], ['coil', 'Coil’s'], ['both', 'Both'], ['none', 'None']]}
              bind:value={gen.s.fieldLines}
            />
          </div>
          {#if (s.fieldLines === 'coil' || s.fieldLines === 'both') && s.current === 'none' && s.motion === 'none'}
            <p class="note">The coil has no field until the magnet moves or you show its current.</p>
          {/if}
        {:else}
          <label class="check">
            <input
              type="checkbox"
              checked={s.fieldLines !== 'none'}
              onchange={(e) => (gen.s.fieldLines = e.currentTarget.checked ? 'coil' : 'none')}
            />
            Show the coil’s field lines
          </label>
        {/if}
        {#if s.fieldLines !== 'none'}
          <label class="field">
            Lines on each side
            <span class="slider">
              <input type="range" min="1" max="8" bind:value={gen.s.lineCount} />
              <output>{s.lineCount}</output>
            </span>
          </label>
        {/if}
      </Section>
    {/if}

    {#if s.source === 'magnet'}
      <Section title="Motion" icon={MoveRight} summary={motionSummary}>
        <div class="field">
          The magnet moves
          <Choice name="Magnet motion" options={[['toward', 'Toward'], ['away', 'Away'], ['none', 'Not moving']]} bind:value={gen.s.motion} />
        </div>
        {#if s.motion !== 'none'}
          <div class="field">Label <LabelField name="Motion label" bind:label={gen.s.motionLabel} /></div>
        {/if}
      </Section>
    {/if}

    <Section title="Meter and current" icon={Gauge} summary={meterSummary}>
      <label class="check"><input type="checkbox" bind:checked={gen.s.meter} /> Wire a meter to the coil</label>
      {#if s.meter}
        <div class="field">
          Needle
          <Choice name="Needle" options={[['left', 'Left'], ['center', 'Center'], ['right', 'Right'], ['blank', 'Blank']]} bind:value={gen.s.needle} />
        </div>
      {/if}
      {#if s.source === 'battery'}
        <label class="check">
          <input
            type="checkbox"
            checked={s.current !== 'none'}
            onchange={(e) => (gen.s.current = e.currentTarget.checked ? 'down' : 'none')}
          />
          Show which way the current flows
        </label>
      {:else}
        <div class="field">
          Current arrows on the coil
          <Choice name="Current arrows" options={[['none', 'None'], ['up', 'Up the front'], ['down', 'Down the front']]} bind:value={gen.s.current} />
        </div>
      {/if}
    </Section>
    <FigureOptions bind:mirror={gen.s.mirror} bind:color={gen.s.color} />
  {/snippet}

  {#snippet figure()}
    <CoilMagnet settings={s} id="f" />
  {/snippet}
</GeneratorPage>
