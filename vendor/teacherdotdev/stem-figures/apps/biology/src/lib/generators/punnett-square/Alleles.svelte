<script lang="ts">
  // Figure text in the settings, set as the figure sets it: alleles in
  // italic serif with their superscripts and subscripts, X and Y upright.
  import type { Run } from './text'

  let { runs }: { runs: Run[] } = $props()
</script>

<span class="alleles"
  >{#each runs as r, i (i)}{#if r.style === 'allele'}<i>{r.text}</i>{:else if r.style === 'sup'}<sup><i>{r.text}</i></sup
    >{:else if r.style === 'sub'}<sub><i>{r.text}</i></sub
    >{:else if r.style === 'chromosome'}<span class="serif">{r.text}</span>{:else if r.style === 'bold'}<b>{r.text}</b
    >{:else}{r.text}{/if}{/each}</span
>

<style>
  i, .serif { font-family: Georgia, 'Times New Roman', Times, serif; }
  i { font-size: 1.08em; }
  sup, sub { font-size: 0.68em; line-height: 0; }
</style>
