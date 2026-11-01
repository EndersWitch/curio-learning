<script lang="ts">
  // Every page: the top bar, the page, then the footer.
  import type { Snippet } from 'svelte'
  import '../app.css'
  import Footer from '$lib/site/Footer.svelte'
  import TopBar from '$lib/site/TopBar.svelte'

  let { children }: { children: Snippet } = $props()

  // Cloudflare Web Analytics beacon; the token is set in Vercel's production env only.
  const beacon = import.meta.env.CF_BEACON_TOKEN
</script>

<svelte:head>
  {#if beacon}
    <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token: beacon, spa: false })}></script>
  {/if}
</svelte:head>

<TopBar />
<main>{@render children()}</main>
<Footer />
