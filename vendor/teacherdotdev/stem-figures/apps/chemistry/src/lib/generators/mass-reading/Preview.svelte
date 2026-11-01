<script lang="ts">
  // Mass Reading's figures on its directory card: the triple beam balance,
  // whole with no magnifier, and the digital balance.
  import SplitPreview from '$lib/shared/SplitPreview.svelte'
  import MassFigure from './MassFigure.svelte'
  import { massSettings } from './settings'

  const tripleBeam = massSettings.tidy({ ...massSettings.defaults, view: 'whole' })
  const digital = massSettings.tidy({ ...massSettings.defaults, instrument: 'digital' })
</script>

{#snippet tripleBeamFigure()}<MassFigure settings={tripleBeam} />{/snippet}
{#snippet digitalFigure()}<MassFigure settings={digital} />{/snippet}

<SplitPreview figures={[tripleBeamFigure, digitalFigure]} />
