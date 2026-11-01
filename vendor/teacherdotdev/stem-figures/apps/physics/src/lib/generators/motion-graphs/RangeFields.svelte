<script lang="ts">
  // One axis's range as the teacher sets it: From, To and Count by, with
  // anything wrong with them below (like Biology's lower-axis settings).
  interface Props {
    /** The axis's name, like "Time" or "Velocity", and its unit. */
    name: string
    unit: string
    /** The settings' prefix: t, x, v or a. */
    id: string
    problems: Record<string, string | null>
    from: number
    to: number
    step: number
  }
  let { name, unit, id, problems, from = $bindable(), to = $bindable(), step = $bindable() }: Props = $props()
  const keys = $derived([`${id}From`, `${id}To`, `${id}Step`])
</script>

<div class="range">
  <span class="name">{name} <span class="unit">({unit})</span></span>
  <div class="range-fields">
    <label>From <input type="number" step="any" aria-invalid={!!problems[keys[0]]} bind:value={from} /></label>
    <label>To <input type="number" step="any" aria-invalid={!!problems[keys[1]]} bind:value={to} /></label>
    <label>Count by <input type="number" step="any" min="0" aria-invalid={!!problems[keys[2]]} bind:value={step} /></label>
  </div>
  {#each keys as key}
    {#if problems[key]}<p class="problem">{problems[key]}</p>{/if}
  {/each}
</div>

<style>
  .range { margin-bottom: 0.85rem; }
  .name { display: block; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.35rem; }
  .unit { font-weight: 400; color: var(--muted); }
  .range-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.6rem; }
  .range-fields label { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.82rem; font-weight: 600; color: var(--muted); min-width: 0; }
  .range-fields input { width: 100%; min-width: 0; }
  .problem { margin: 0.4rem 0 0; font-size: 0.84rem; font-weight: 600; color: var(--red); }
</style>
