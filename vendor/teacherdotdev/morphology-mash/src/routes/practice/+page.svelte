<script lang="ts">
	import { page } from '$app/state';
	import Session from '$lib/Session.svelte';
	import { settingsFromParams, TYPE_LABELS } from '$lib/settings';

	// Read the activity straight from the link's query string.
	const settings = $derived(settingsFromParams(page.url.searchParams));
	const name = $derived(page.url.searchParams.get('name')?.trim() ?? '');
	const title = $derived(name || `${TYPE_LABELS[settings.type]} the Word`);
</script>

<svelte:head>
	<title>{title} · Morphology Mash</title>
</svelte:head>

<div class="practice">
	<header class="no-print">
		<p class="kind">Morphology Mash · {TYPE_LABELS[settings.type]}</p>
		<h1>{title}</h1>
	</header>

	{#key page.url.search}
		<Session {settings} title="{title} · Morphology Mash" />
	{/key}
</div>

<style>
	.practice {
		max-width: 52rem;
		margin: 0 auto;
		padding: 0.9rem 1.25rem 1rem;
	}
	header {
		margin-bottom: 0.5rem;
		text-align: center;
	}
	.kind {
		color: var(--accent);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	h1 {
		font-size: 1.5rem;
		font-weight: 700;
	}
</style>
