<script lang="ts">
	// A page of prose about the site, like About and Privacy: the wordmark back
	// to the home page, the page itself, and the footer.
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/Footer.svelte';

	let { title, lede, children }: { title: string; lede: string; children: Snippet } = $props();
</script>

<svelte:head>
	<title>{title} · Algebra Tiles</title>
</svelte:head>

<div class="page">
	<a class="brand" href={resolve('/')}>
		<img src={favicon} alt="" width="28" height="28" /> Algebra Tiles
	</a>
	<main>
		<h1>{title}</h1>
		<p class="lede">{lede}</p>
		{@render children()}
	</main>
	<Footer />
</div>

<style>
	/* The footer sits at the bottom of the window, or after the page when it's taller. */
	.page {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
		max-width: 46rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 1.5rem;
	}
	.page > :global(footer) {
		margin-top: auto;
	}
	.brand {
		display: inline-flex;
		align-self: flex-start;
		align-items: center;
		gap: 0.5rem;
		color: var(--accent);
		font-size: 1.05rem;
		font-weight: 700;
		text-decoration: none;
	}
	main {
		margin: 1.25rem 0 2rem;
	}
	h1 {
		font-size: 2rem;
		font-weight: 700;
	}
	.lede {
		margin: 0.3rem 0 1.25rem;
		color: var(--muted);
	}
	main :global(section) {
		margin-bottom: 1.25rem;
		padding: 1.25rem;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper);
	}
	main :global(h2) {
		margin-bottom: 0.6rem;
		font-size: 1.15rem;
		font-weight: 700;
	}
	main :global(section p) {
		margin-bottom: 0.85rem;
		line-height: 1.6;
	}
	main :global(section p:last-child) {
		margin-bottom: 0;
	}
	main :global(section a:not(.btn-primary)) {
		color: var(--accent);
		font-weight: 600;
		text-underline-offset: 4px;
	}
</style>
