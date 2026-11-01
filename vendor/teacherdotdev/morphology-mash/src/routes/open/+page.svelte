<script lang="ts">
	// A teacher link: another teacher's activity, carried in the address. Opening
	// it adds a copy to this teacher's list and goes straight to its editor.
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { createActivity, loadActivities } from '$lib/activities.svelte';
	import { settingsFromParams } from '$lib/settings';

	onMount(() => {
		loadActivities();
		const params = page.url.searchParams;
		const settings = settingsFromParams(params);
		const activity = createActivity(settings.type, params.get('name') ?? '', settings);
		goto(resolve('/activity/[id]', { id: activity.id }), { replaceState: true });
	});
</script>

<p class="opening">Adding this activity to your list…</p>

<style>
	.opening {
		padding: 3rem 1.25rem;
		color: var(--muted);
		text-align: center;
	}
</style>
