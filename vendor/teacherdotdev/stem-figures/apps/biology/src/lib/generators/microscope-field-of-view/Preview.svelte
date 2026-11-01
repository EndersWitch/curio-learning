<script lang="ts">
  // Microscope Field of View's picture on the directory: onion skin at low
  // and high power side by side, with no question or answer box, so the
  // fields stay big enough to recognize.
  import MicroscopeFigure from './MicroscopeFigure.svelte'
  import { microscopeSettings } from './settings'

  const preview = microscopeSettings.tidy({ ...microscopeSettings.defaults, compare: true, questionMode: 'none', answer: 'none' })
</script>

<MicroscopeFigure settings={preview} />
