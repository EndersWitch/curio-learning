<script lang="ts">
  // A page's title, description and canonical address for search engines.
  import { SITE_NAME, SITE_URL } from './config'

  /** `title` is left out on the directory, which is titled by the site name alone. */
  let { title = '', description, path }: { title?: string; description: string; path: string } = $props()
  const fullTitle = $derived(title ? `${title} | ${SITE_NAME}` : SITE_NAME)
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="{SITE_URL}{path}" />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="{SITE_URL}{path}" />
  <meta property="og:site_name" content={SITE_NAME} />
</svelte:head>
