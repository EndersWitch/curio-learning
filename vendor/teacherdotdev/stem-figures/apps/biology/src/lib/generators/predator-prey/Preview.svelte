<script lang="ts">
  // Predator–Prey Cycles' picture on the directory: snowshoe hares and Canada
  // lynx over 30 years, the lynx peaking just after the hares, in large labels
  // to read at the card's size.
  import PredatorPreyFigure from './PredatorPreyFigure.svelte'
  import { predatorPreySettings } from './settings'

  const settings = predatorPreySettings.tidy({ ...predatorPreySettings.defaults, span: 30, labelSize: 'large' })
</script>

<PredatorPreyFigure {settings} id="preview-predator-prey" />
