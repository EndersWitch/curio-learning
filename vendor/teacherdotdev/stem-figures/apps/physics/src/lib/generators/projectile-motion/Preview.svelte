<script lang="ts">
  // The Projectile Motion Generator's picture on the directory: its default
  // figure, drawn by the same code the generator uses.
  import Projectile from './Projectile.svelte'
  import { projectileSettings } from './settings'
</script>

<Projectile settings={projectileSettings.defaults} id="preview" />
