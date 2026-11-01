<script lang="ts">
  // Population Growth's picture on the directory: exponential and logistic
  // growth on one graph, with the carrying capacity marked.
  import { fitAxes } from './fit'
  import PopulationFigure from './PopulationFigure.svelte'
  import { populationSettings } from './settings'

  const start = populationSettings.tidy({ ...populationSettings.defaults, model: 'both', n0: 10 })
  const settings = populationSettings.tidy({ ...start, ...fitAxes(start) })
</script>

<PopulationFigure {settings} id="preview-population-growth" />
