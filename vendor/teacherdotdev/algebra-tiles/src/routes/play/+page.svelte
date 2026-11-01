<script lang="ts">
	// An activity link: one problem, read straight from the address, e.g.
	// /play?type=factor&p=x^2-x-6&start=all, or /play?type=solve&p=2x+3=7.
	// Solve's links carry live=0 when the teacher turned the live balance off.
	// Nothing is stored anywhere.
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import ActivityBoard from '$lib/Activity.svelte';
	import { prettyText, readProblem, type Activity } from '$lib/algebra';
	import { readStart } from '$lib/settings';

	const params = $derived(page.url.searchParams);
	const NAMES: Record<Activity, string> = {
		multiply: 'Multiply',
		factor: 'Factor',
		solve: 'Solve'
	};
	const type = $derived<Activity>(
		(Object.keys(NAMES) as Activity[]).find((t) => t === params.get('type')) ?? 'multiply'
	);
	const problem = $derived(readProblem(type, params.get('p') ?? ''));
	const start = $derived(readStart(params.get('start')));
	/** Anything but live=0 keeps the live balance on, as links made before it did. */
	const live = $derived(params.get('live') !== '0');
	const title = $derived(`${NAMES[type]} ${problem.ok ? prettyText(problem.given) : ''}`);
</script>

<svelte:head>
	<title>{title} · Algebra Tiles</title>
</svelte:head>

{#if problem.ok}
	{#key page.url.search}
		<ActivityBoard {problem} {start} {live} />
	{/key}
{:else}
	<main class="broken">
		<h1>This link doesn’t have a problem we can build</h1>
		<p>{problem.reason}</p>
		<p>Ask your teacher for the link again.</p>
		<a class="btn-ghost" href={resolve('/')}>Make a problem</a>
	</main>
{/if}

<style>
	.broken {
		max-width: 34rem;
		margin: 4rem auto;
		padding: 1.5rem;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper);
	}
	h1 {
		font-size: 1.4rem;
		font-weight: 700;
	}
	p {
		margin-top: 0.6rem;
		color: var(--muted);
	}
	a {
		margin-top: 1rem;
	}
</style>
