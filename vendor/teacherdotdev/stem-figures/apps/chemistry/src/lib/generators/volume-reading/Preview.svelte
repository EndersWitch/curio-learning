<script lang="ts">
  // Volume Reading's figures on its directory card: the graduated cylinder,
  // the buret and the beaker, each whole with no magnifier so they stay
  // big enough to recognize side by side.
  import SplitPreview from '$lib/shared/SplitPreview.svelte'
  import VolumeFigure from './VolumeFigure.svelte'
  import { volumeSettings } from './settings'

  const whole = { ...volumeSettings.defaults, view: 'whole' }
  const cylinder = volumeSettings.tidy(whole)
  const buret = volumeSettings.tidy({ ...whole, instrument: 'buret' })
  const beaker = volumeSettings.tidy({ ...whole, instrument: 'beaker' })
</script>

{#snippet cylinderFigure()}<VolumeFigure settings={cylinder} />{/snippet}
{#snippet buretFigure()}<VolumeFigure settings={buret} />{/snippet}
{#snippet beakerFigure()}<VolumeFigure settings={beaker} />{/snippet}

<SplitPreview split="vertical" figures={[cylinderFigure, buretFigure, beakerFigure]} />
