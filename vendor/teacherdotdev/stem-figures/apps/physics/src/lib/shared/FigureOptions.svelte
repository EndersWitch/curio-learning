<script lang="ts">
  // The Figure section every generator's settings end with: Mirror and Color.
  import { SlidersHorizontal } from '@lucide/svelte'
  import Section from './Section.svelte'

  let { mirror = $bindable(), color = $bindable() }: { mirror: boolean; color: boolean } = $props()

  const summary = $derived([mirror ? 'mirrored' : '', color ? 'color' : 'black and white'].filter(Boolean).join(' · '))
</script>

<Section title="Figure" icon={SlidersHorizontal} {summary}>
  <label class="check"><input type="checkbox" bind:checked={mirror} /> Mirror (flip left to right)</label>
  <label class="check"><input type="checkbox" bind:checked={color} /> Color (for slides)</label>
</Section>
