<script lang="ts">
  // Particle Diagram's figures on its directory card: particles scattered in
  // a box, and an ionic lattice.
  import SplitPreview from '$lib/shared/SplitPreview.svelte'
  import ParticleFigure from './ParticleFigure.svelte'
  import { boxContents, particleSettings } from './settings'

  const scattered = particleSettings.defaults
  const lattice = particleSettings.tidy({ ...scattered, layout: 'lattice' })
</script>

{#snippet scatteredFigure()}<ParticleFigure settings={scattered} box={boxContents(scattered)} />{/snippet}
{#snippet latticeFigure()}<ParticleFigure settings={lattice} box={boxContents(lattice)} />{/snippet}

<SplitPreview figures={[scatteredFigure, latticeFigure]} />
