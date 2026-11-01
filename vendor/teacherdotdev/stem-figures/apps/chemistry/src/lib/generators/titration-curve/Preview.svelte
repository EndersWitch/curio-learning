<script lang="ts">
  // Titration Curve's picture on the directory: a weak acid titrated with a
  // strong base, both of its points marked.
  import TitrationFigure from './TitrationFigure.svelte'
  import { titrationSettings } from './settings'

  const settings = titrationSettings.tidy({ ...titrationSettings.defaults, halfMark: 'guides' })
</script>

<TitrationFigure {settings} id="preview-titration-curve" />
