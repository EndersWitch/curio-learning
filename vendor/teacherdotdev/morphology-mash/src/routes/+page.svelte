<script lang="ts">
	// "Your activities": every activity the teacher has, newest first. Opening
	// one goes to its editor; New activity asks for a type and creates one.
	import { Check, Copy, Ellipsis, Plus } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import {
		createActivity,
		deleteActivity,
		duplicateActivity,
		loadActivities,
		markShared,
		sortedActivities,
		store,
		studentLink,
		teacherLink,
		type Activity
	} from '$lib/activities.svelte';
	import { sampleWord, wordsFor } from '$lib/content';
	import NewActivityDialog from '$lib/NewActivityDialog.svelte';
	import Picture from '$lib/Picture.svelte';
	import { TYPE_LABELS, type ActivityType } from '$lib/settings';
	import logo from '$lib/assets/logo.svg';

	let origin = $state('');
	let newDialog = $state<ReturnType<typeof NewActivityDialog>>();

	onMount(() => {
		origin = window.location.origin;
		loadActivities();
	});

	const activities = $derived(store.loaded ? sortedActivities() : []);

	function open(a: Activity) {
		goto(resolve('/activity/[id]', { id: a.id }));
	}

	function create(type: ActivityType) {
		open(createActivity(type));
	}

	// --- the ⋯ menu on each card, and the copy button ---

	let menuFor = $state<string | null>(null);
	let confirmingDelete = $state<string | null>(null);
	// What was just copied — a card's student link, or a menu's teacher link —
	// shown on the button itself for a moment rather than in a message.
	let copied = $state<string | null>(null);
	let copiedTimer: ReturnType<typeof setTimeout>;

	function toggleMenu(id: string) {
		menuFor = menuFor === id ? null : id;
		confirmingDelete = null;
	}

	// A click anywhere outside an open menu closes it.
	function closeMenus(event: MouseEvent) {
		if (!(event.target as HTMLElement).closest('.menu-wrap')) {
			menuFor = null;
			confirmingDelete = null;
		}
	}

	async function copy(text: string, key: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			return false;
		}
		copied = key;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = null), 1500);
		return true;
	}

	async function copyStudentLink(a: Activity) {
		const link = studentLink(origin, a);
		if (await copy(link, `student:${a.id}`)) markShared(a.id, link);
	}

	// The menu stays open just long enough to say the link was copied.
	async function copyTeacherLink(a: Activity) {
		if (await copy(teacherLink(origin, a), `teacher:${a.id}`))
			setTimeout(() => (menuFor = null), 900);
	}

	function duplicate(a: Activity) {
		menuFor = null;
		duplicateActivity(a.id);
	}

	function remove(a: Activity) {
		deleteActivity(a.id);
		menuFor = null;
		confirmingDelete = null;
	}
</script>

<svelte:window onclick={closeMenus} />

<div class="page">
	<header class="top">
		<div>
			<p class="brand"><img src={logo} alt="" width="30" height="30" /> Morphology Mash</p>
			<h1>Your activities</h1>
			<p class="lede">
				Each activity is a set of morphemes and settings you share with students as a link.
			</p>
		</div>
		<button type="button" class="btn-primary new" onclick={() => newDialog?.open()}>
			<Plus size={16} /> New activity
		</button>
	</header>

	{#if store.loaded && !activities.length}
		<button type="button" class="empty" onclick={() => newDialog?.open()}>
			No activities yet. Make your first one.
		</button>
	{/if}

	<ul class="grid">
		{#each activities as a (a.id)}
			{@const words = wordsFor(a.settings.bank).length}
			<li class="card">
				<button type="button" class="open" onclick={() => open(a)} aria-label="Open {a.name}">
					<span class="thumb"
						><Picture kind={a.settings.type} word={sampleWord(a.settings.bank)} label="" /></span
					>
				</button>
				<div class="body">
					<div class="title-row">
						<h2>{a.name}</h2>
						<span class="badge {a.settings.type}">{TYPE_LABELS[a.settings.type]}</span>
					</div>
					<p class="meta" class:low={words < 5}>
						{words} word{words === 1 ? '' : 's'} · {a.settings.bank.length} morphemes
					</p>
				</div>
				<div class="card-actions">
					<div class="menu-wrap">
						<button
							type="button"
							class="iconbtn ghost"
							aria-haspopup="menu"
							aria-expanded={menuFor === a.id}
							aria-label="More for {a.name}"
							onclick={() => toggleMenu(a.id)}
						>
							<Ellipsis size={18} strokeWidth={3} />
						</button>
						{#if menuFor === a.id}
							<div class="menu" role="menu">
								{#if confirmingDelete === a.id}
									<p class="confirm">Delete “{a.name}” for good?</p>
									<div class="confirm-row">
										<button type="button" class="btn-danger" onclick={() => remove(a)}
											>Delete</button
										>
										<button
											type="button"
											class="btn-ghost"
											onclick={() => (confirmingDelete = null)}>Keep</button
										>
									</div>
								{:else}
									<button type="button" role="menuitem" onclick={() => open(a)}>Edit</button>
									<button type="button" role="menuitem" onclick={() => duplicate(a)}
										>Duplicate</button
									>
									<button type="button" role="menuitem" onclick={() => copyTeacherLink(a)}
										>{copied === `teacher:${a.id}`
											? 'Copied a link for another teacher'
											: 'Share with a teacher'}</button
									>
									<button
										type="button"
										role="menuitem"
										class="danger"
										onclick={() => (confirmingDelete = a.id)}>Delete</button
									>
								{/if}
							</div>
						{/if}
					</div>
					<button
						type="button"
						class="iconbtn"
						onclick={() => copyStudentLink(a)}
						aria-label="Copy student link for {a.name}"
						title={copied === `student:${a.id}` ? 'Copied' : 'Copy student link'}
					>
						{#if copied === `student:${a.id}`}<Check size={16} />{:else}<Copy size={16} />{/if}
					</button>
				</div>
			</li>
		{/each}
	</ul>
</div>

<NewActivityDialog bind:this={newDialog} oncreate={create} />

<style>
	.page {
		max-width: 68rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 3rem;
	}
	.top {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1.75rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
		font-family: var(--serif);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--accent);
	}
	h1 {
		font-size: 2.2rem;
		font-weight: 700;
	}
	.lede {
		margin-top: 0.25rem;
		color: var(--muted);
	}
	.new {
		gap: 0.4rem;
	}
	.empty {
		width: 100%;
		padding: 2.5rem;
		border: 2px dashed var(--line-strong);
		border-radius: 14px;
		background: var(--paper-low);
		color: var(--ink-soft);
		font-family: var(--serif);
		font-size: 1.1rem;
		cursor: pointer;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
		gap: 1.1rem;
		list-style: none;
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper);
		box-shadow: 0 1px 2px rgb(51 42 36 / 0.06);
		transition:
			box-shadow 0.15s,
			transform 0.15s;
	}
	.card:hover {
		box-shadow: 0 6px 18px rgb(51 42 36 / 0.12);
		transform: translateY(-1px);
	}
	/* The thumbnail is the big open button; the card's other buttons sit over it. */
	.open {
		padding: 0.6rem 0.6rem 0;
		border: none;
		background: none;
		cursor: pointer;
	}
	.thumb {
		display: block;
		overflow: hidden;
		border-radius: 8px;
		background: var(--paper-low);
	}
	.body {
		padding: 0.6rem 0.9rem 0.85rem;
	}
	.title-row {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding-right: 4.5rem;
	}
	h2 {
		overflow: hidden;
		font-size: 1.1rem;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.badge {
		flex: none;
		padding: 0.05rem 0.5rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 700;
	}
	.badge.build {
		background: var(--accent-wash);
		color: var(--accent-dark);
	}
	.badge.break {
		background: var(--prefix-wash);
		color: var(--prefix-ink);
	}
	.meta {
		margin-top: 0.15rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.meta.low {
		color: var(--bad);
	}
	.card-actions {
		position: absolute;
		right: 0.6rem;
		bottom: 0.75rem;
		display: flex;
		gap: 0.3rem;
	}
	.iconbtn {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: var(--paper);
		color: var(--ink-soft);
		cursor: pointer;
	}
	.iconbtn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	/* The ⋯ menu sits quietly until it is pointed at. */
	.iconbtn.ghost {
		border-color: transparent;
		background: none;
	}
	.iconbtn.ghost:hover,
	.iconbtn.ghost:focus-visible,
	.iconbtn.ghost[aria-expanded='true'] {
		border-color: var(--line-strong);
		background: var(--paper-low);
		color: var(--ink);
	}
	.menu-wrap {
		position: relative;
	}
	.menu {
		position: absolute;
		right: 0;
		bottom: calc(100% + 0.35rem);
		z-index: 5;
		display: flex;
		flex-direction: column;
		min-width: 12rem;
		padding: 0.35rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--paper);
		box-shadow: 0 10px 28px rgb(51 42 36 / 0.18);
	}
	.menu button[role='menuitem'] {
		padding: 0.5rem 0.65rem;
		border: none;
		border-radius: 6px;
		background: none;
		color: var(--ink);
		font-size: 0.9rem;
		text-align: left;
		cursor: pointer;
	}
	.menu button[role='menuitem']:hover {
		background: var(--paper-low);
	}
	.menu .danger {
		color: var(--bad);
	}
	.confirm {
		padding: 0.35rem 0.45rem;
		font-size: 0.88rem;
	}
	.confirm-row {
		display: flex;
		gap: 0.4rem;
		padding: 0 0.35rem 0.35rem;
	}
	.confirm-row button {
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
	}
</style>
