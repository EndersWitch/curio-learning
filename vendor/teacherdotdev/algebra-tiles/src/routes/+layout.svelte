<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	// Cloudflare Web Analytics counts page views without cookies or personal
	// data. The token is set in Vercel's production environment only, so local
	// and preview runs load no analytics at all.
	const beacon = import.meta.env.VITE_CF_BEACON_TOKEN;
</script>

<svelte:head>
	<title>Algebra Tiles</title>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	{#if beacon}
		<script
			defer
			src="https://static.cloudflareinsights.com/beacon.min.js"
			data-cf-beacon={JSON.stringify({ token: beacon })}
		></script>
	{/if}
</svelte:head>

{@render children()}
