<script lang="ts">
  // Heating and Cooling Curve's picture on the directory: water heated from
  // ice to steam, its corners lettered and its segments labeled.
  import CurveFigure from './CurveFigure.svelte'
  import { curveSettings } from './settings'

  const settings = curveSettings.tidy({ ...curveSettings.defaults, letters: true })
</script>

<CurveFigure {settings} id="preview-heating-cooling-curve" />
