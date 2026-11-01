<script lang="ts">
  // The Titles settings group: the chart title, and a title for each axis
  // the graphs show (time, population size, growth rate, per capita growth
  // rate), each written text, a blank line for students, or nothing.
  import { Heading } from '@lucide/svelte'
  import LabelField from '$shared/LabelField.svelte'
  import Section from '$shared/Section.svelte'
  import { againstOf, titlesFor, viewsOf, type PopulationSettings } from './settings'

  let { s }: { s: PopulationSettings } = $props()

  type Key = 'title' | 'timeTitle' | 'nTitle' | 'rateTitle' | 'pcTitle'
  const NAMES: Record<Key, string> = {
    title: 'Chart title',
    timeTitle: 'Time axis',
    nTitle: 'Population size axis',
    rateTitle: 'Growth rate axis',
    pcTitle: 'Per capita growth rate axis',
  }
  const shown = $derived.by(() => {
    const views: readonly string[] = viewsOf(s)
    const keys: Key[] = ['title']
    if (againstOf(s) === 'time') keys.push('timeTitle')
    if (againstOf(s) === 'size' || views.includes('size')) keys.push('nTitle')
    if (views.includes('rate')) keys.push('rateTitle')
    if (views.includes('percapita')) keys.push('pcTitle')
    return keys
  })
  const placeholders = $derived({ title: 'Growth of a deer population', ...titlesFor(s.organism, s.unit) })
  const summary = $derived(
    shown
      .map((k) => (s[`${k}Mode`] === 'blank' ? `${NAMES[k]}: blank line` : s[`${k}Mode`] === 'text' && s[k].trim() ? `“${s[k].trim()}”` : ''))
      .filter(Boolean)
      .join(' · ') || 'None',
  )
</script>

<Section title="Titles" icon={Heading} {summary}>
  {#each shown as key (key)}
    <div class="field">
      <span>{NAMES[key]}</span>
      <LabelField name={NAMES[key]} placeholder={placeholders[key]} bind:mode={s[`${key}Mode`]} bind:text={s[key]} />
    </div>
  {/each}
</Section>

<style>
  .field { display: flex; flex-direction: column; gap: 0.35rem; font-weight: 600; font-size: 0.88rem; margin-bottom: 0.75rem; }
  .field:last-child { margin-bottom: 0; }
</style>
