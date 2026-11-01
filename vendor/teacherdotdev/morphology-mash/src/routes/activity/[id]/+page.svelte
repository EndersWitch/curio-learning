<script lang="ts">
	// The activity editor: the sidebar on the left, and on the right whichever of
	// its two pages is open. Edits change the activity in the list directly and
	// are saved as they happen.
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getActivity, loadActivities, saveActivity, store } from '$lib/activities.svelte';
	import BankPage from '$lib/BankPage.svelte';
	import EditorSidebar, { type EditorPage } from '$lib/EditorSidebar.svelte';
	import SettingsPage from '$lib/SettingsPage.svelte';
	import { settingsToQuery } from '$lib/settings';

	onMount(loadActivities);

	const activity = $derived(store.loaded ? getActivity(page.params.id ?? '') : undefined);
	let current = $state<EditorPage>('prefix');

	// Save whenever the name or a setting changes. The first look at an activity
	// only notes how it stands, so opening one does not count as editing it.
	let lastSaved: string | null = null;
	$effect(() => {
		if (!activity) return;
		const now = activity.name + '\n' + settingsToQuery(activity.settings);
		if (lastSaved !== null && now !== lastSaved) saveActivity(activity.id);
		lastSaved = now;
	});
</script>

<svelte:head>
	<title>{activity ? `${activity.name} · Morphology Mash` : 'Morphology Mash'}</title>
</svelte:head>

{#if activity}
	<div class="editor">
		<EditorSidebar {activity} page={current} onpage={(p) => (current = p)} />
		<main>
			<div class="page">
				{#if current === 'settings'}
					<SettingsPage bind:settings={activity.settings} />
				{:else}
					<BankPage bind:settings={activity.settings} type={current} />
				{/if}
			</div>
		</main>
	</div>
{:else if store.loaded}
	<div class="missing">
		<h1>That activity isn't here</h1>
		<p>It may have been deleted, or made on another computer.</p>
		<a class="btn-primary" href={resolve('/')}>Your activities</a>
	</div>
{/if}

<style>
	/* The sidebar and the page each scroll on their own, so the share tools at
	   the bottom of the sidebar never scroll out of reach. */
	.editor {
		display: grid;
		grid-template-columns: 16rem minmax(0, 1fr);
		height: 100vh;
	}
	main {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: 1.75rem clamp(1rem, 3vw, 2.5rem) 2rem;
	}
	.page {
		flex: 1;
	}
	.missing {
		max-width: 30rem;
		margin: 4rem auto;
		padding: 0 1.25rem;
		text-align: center;
	}
	.missing p {
		margin: 0.5rem 0 1.25rem;
		color: var(--muted);
	}
	@media (max-width: 56rem) {
		.editor {
			grid-template-columns: 1fr;
			height: auto;
		}
		main {
			overflow: visible;
		}
	}
</style>
