<script lang="ts">
  // pH Reading's figures on its directory card: the digital meter, the
  // analog meter whole with no magnifier, and pH paper.
  import SplitPreview from '$lib/shared/SplitPreview.svelte'
  import PhFigure from './PhFigure.svelte'
  import { phSettings } from './settings'

  const digital = phSettings.defaults
  const analog = phSettings.tidy({ ...phSettings.defaults, instrument: 'analog', view: 'whole' })
  const paper = phSettings.tidy({ ...phSettings.defaults, instrument: 'paper' })
</script>

{#snippet digitalFigure()}<PhFigure settings={digital} />{/snippet}
{#snippet analogFigure()}<PhFigure settings={analog} />{/snippet}
{#snippet paperFigure()}<PhFigure settings={paper} />{/snippet}

<SplitPreview split="vertical" figures={[digitalFigure, analogFigure, paperFigure]} />
