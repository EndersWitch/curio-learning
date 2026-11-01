<script lang="ts">
  // The Free Body Diagram Generator's picture on the directory. Its default
  // figure (two forces, up and down) is a thin sliver on a card, so the card
  // shows a box pushed along a rough floor instead, drawn by the same code.
  import FreeBody from './FreeBody.svelte'
  import { fbdSettings, STARTERS, starterForce } from './settings'

  const sample = { ...fbdSettings.defaults, body: 'block' as const, forces: [STARTERS[0], STARTERS[1], STARTERS[2], STARTERS[4]].map(starterForce) }
</script>

<FreeBody settings={sample} id="preview" />
