<script lang="ts">
  // Gas Syringe's figure on its directory card: the syringe set up with its
  // flask and stand, whole with no magnifier so it stays big enough to
  // recognize.
  import SyringeFigure from './SyringeFigure.svelte'
  import { syringeSettings } from './settings'

  const whole = syringeSettings.tidy({ ...syringeSettings.defaults, view: 'whole' })
</script>

<SyringeFigure settings={whole} />
