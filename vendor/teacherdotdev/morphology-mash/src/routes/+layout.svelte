<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/Footer.svelte';
	import WhatsNew from '$lib/WhatsNew.svelte';

	let { children } = $props();

	// Cloudflare Web Analytics counts page views without cookies or personal
	// data. The token is set in Vercel's production environment only, so local
	// and preview runs load no analytics at all.
	const beacon = import.meta.env.VITE_CF_BEACON_TOKEN;
</script>

<svelte:head>
	<title>Morphology Mash</title>
	<link rel="icon" href={favicon} type="image/svg+xml" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	{#if beacon}
		<script
			defer
			src="https://static.cloudflareinsights.com/beacon.min.js"
			data-cf-beacon={JSON.stringify({ token: beacon })}
		></script>
	{/if}
</svelte:head>

<!-- The footer sits below every page, and is pushed to the bottom of the
     window on short pages so it never floats mid-screen. The activity editor
     fills the window with its own scrolling columns, so it carries its own;
     the student page has none, so a session fits the window without scrolling. -->
<div class="shell">
	<div class="content">{@render children()}</div>
	<WhatsNew />
	{#if !page.route.id?.startsWith('/activity') && page.route.id !== '/practice'}
		<div class="page-footer"><Footer /></div>
	{/if}
</div>

<style>
	.page-footer {
		width: 100%;
		max-width: 68rem;
		margin: 0 auto;
		padding: 1rem 1.25rem 1.25rem;
	}
	.shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	.content {
		flex: 1;
	}
</style>
