<script lang="ts" module>
	import type { MorphemeType } from './content';

	/** The editor's pages: one Morpheme Bank list per type, and the settings. */
	export type EditorPage = MorphemeType | 'settings';
</script>

<script lang="ts">
	// The editor's left column: back to the list, the activity's picture and
	// name, its pages — the Morpheme Bank split by type, each with how many of
	// that type are ticked, then the settings — and, pinned to the bottom,
	// everything for getting it to students.
	import {
		AlignCenterVertical,
		AlignEndVertical,
		AlignStartVertical,
		ArrowLeft,
		Blocks,
		Check,
		Copy,
		Download,
		ExternalLink,
		Eye,
		EyeOff,
		SlidersHorizontal
	} from '@lucide/svelte';
	import type { Component } from 'svelte';
	import { resolve } from '$app/paths';
	import Footer from './Footer.svelte';
	import { onMount } from 'svelte';
	import {
		loadQrOpen,
		markShared,
		saveQrOpen,
		studentLink,
		type Activity
	} from './activities.svelte';
	import { MORPHEMES, sampleWord } from './content';
	import Picture from './Picture.svelte';
	import { makeQr, qrExtent, qrPath, qrPng } from './qr';
	import { TYPE_LABELS } from './settings';

	let {
		activity,
		page,
		onpage
	}: { activity: Activity; page: EditorPage; onpage: (page: EditorPage) => void } = $props();

	const BANK_PAGES: { id: MorphemeType; label: string; icon: Component }[] = [
		{ id: 'prefix', label: 'Prefixes', icon: AlignStartVertical },
		{ id: 'base', label: 'Bases', icon: AlignCenterVertical },
		{ id: 'suffix', label: 'Suffixes', icon: AlignEndVertical }
	];

	/** How many morphemes of a type are ticked in the bank. */
	function ticked(type: MorphemeType): number {
		return activity.settings.bank.filter((id) => MORPHEMES[id]?.type === type).length;
	}

	let origin = $state('');
	onMount(() => {
		origin = window.location.origin;
		qrOpen = loadQrOpen();
	});

	const link = $derived(origin ? studentLink(origin, activity) : '');
	// The link carries the whole activity, so any edit after it was handed out
	// means students still have the old one.
	const changedSinceShared = $derived(!!activity.sharedLink && activity.sharedLink !== link);

	let copied = $state(false);
	let note = $state('');

	async function copyLink() {
		note = '';
		try {
			await navigator.clipboard.writeText(link);
			markShared(activity.id, link);
			copied = true;
			setTimeout(() => (copied = false), 1500);
		} catch {
			note = 'This browser would not copy the link.';
		}
	}

	// --- the QR code: hidden until asked for, and remembered either way ---

	const qr = $derived(link ? makeQr(link) : null);
	let qrOpen = $state(false);

	function toggleQr() {
		qrOpen = !qrOpen;
		saveQrOpen(qrOpen);
	}

	async function copyQr() {
		if (!qr) return;
		note = '';
		try {
			const png = await qrPng(qr);
			await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
			note = 'QR code copied.';
		} catch {
			// Not every browser will put an image on the clipboard. Say so rather
			// than failing quietly — Save always works.
			note = 'This browser will not copy images. Use Save instead.';
		}
	}

	async function saveQr() {
		if (!qr) return;
		const url = URL.createObjectURL(await qrPng(qr));
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activity.name.replace(/[^\w-]+/g, '-').toLowerCase()}-qr.png`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<aside class="sidebar">
	<a class="back" href={resolve('/')}><ArrowLeft size={16} /> Your activities</a>

	<div class="identity">
		<div class="thumb">
			<Picture kind={activity.settings.type} word={sampleWord(activity.settings.bank)} label="" />
			<span class="badge {activity.settings.type}">{TYPE_LABELS[activity.settings.type]}</span>
		</div>
		<label class="name">
			<span class="visually-hidden">Activity name</span>
			<input
				type="text"
				bind:value={activity.name}
				placeholder="Name this activity"
				title="Rename this activity"
			/>
		</label>
	</div>

	<nav aria-label="Activity pages">
		<!-- The Morpheme Bank heading opens its first list; its lists sit under it. -->
		<button
			type="button"
			class="item"
			class:within={page !== 'settings'}
			onclick={() => page === 'settings' && onpage('prefix')}
		>
			<Blocks size={18} /> Morpheme Bank
		</button>
		{#each BANK_PAGES as p (p.id)}
			{@const Icon = p.icon}
			<button
				type="button"
				class="item sub"
				class:active={page === p.id}
				aria-current={page === p.id ? 'page' : undefined}
				onclick={() => onpage(p.id)}
			>
				<Icon size={16} />
				<span class="label">{p.label}</span>
				<span class="count" aria-label="{ticked(p.id)} ticked">{ticked(p.id)}</span>
			</button>
		{/each}
		<button
			type="button"
			class="item"
			class:active={page === 'settings'}
			aria-current={page === 'settings' ? 'page' : undefined}
			onclick={() => onpage('settings')}
		>
			<SlidersHorizontal size={18} /> Activity settings
		</button>
	</nav>

	<div class="share">
		<p class="share-title">Share with students</p>
		<button
			type="button"
			class="copy"
			class:stale={changedSinceShared}
			onclick={copyLink}
			disabled={!link}
		>
			{#if copied}<Check size={16} />{:else}<Copy size={16} />{/if}
			{copied ? 'Copied' : changedSinceShared ? 'Copy new link' : 'Copy student link'}
		</button>
		{#if changedSinceShared}
			<p class="hint">
				You changed this activity after copying its link. Students with the old link still see the
				old version.
			</p>
		{/if}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the student page, with this activity in its address -->
		<a class="view" href={link} target="_blank" rel="noopener"
			>View as student <ExternalLink size={15} /></a
		>

		{#if qr}
			<div class="qrrow">
				<span>QR code</span>
				<button
					type="button"
					class="iconbtn"
					onclick={toggleQr}
					aria-expanded={qrOpen}
					aria-label={qrOpen ? 'Hide the QR code' : 'Show the QR code'}
					title={qrOpen ? 'Hide' : 'Show'}
					>{#if qrOpen}<EyeOff size={16} />{:else}<Eye size={16} />{/if}</button
				>
				<button
					type="button"
					class="iconbtn"
					onclick={saveQr}
					aria-label="Save QR code"
					title="Save"><Download size={16} /></button
				>
				<button
					type="button"
					class="iconbtn"
					onclick={copyQr}
					aria-label="Copy QR code"
					title="Copy"><Copy size={16} /></button
				>
			</div>
			{#if qrOpen}
				<div class="qr">
					<svg
						viewBox="0 0 {qrExtent(qr)} {qrExtent(qr)}"
						role="img"
						aria-label="QR code for the student link"
					>
						<rect width={qrExtent(qr)} height={qrExtent(qr)} fill="#fff" />
						<path d={qrPath(qr)} fill="#000" />
					</svg>
				</div>
			{/if}
		{/if}
		{#if note}<p class="hint">{note}</p>{/if}
	</div>

	<!-- Help in the very bottom-left corner, under the share tools, with who
	     made the tool across from it. -->
	<div class="help-corner"><Footer /></div>
</aside>

<style>
	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		overflow-y: auto;
		padding: 1rem;
		border-right: 1px solid var(--line);
		background: var(--paper-low);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--accent);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.back:hover {
		text-decoration: underline;
	}
	.identity {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}
	.thumb {
		position: relative;
		overflow: hidden;
		border: 1px solid var(--line);
		border-radius: 10px;
	}
	/* The activity type rides on the picture's empty corner, like a sticker. */
	.badge {
		position: absolute;
		bottom: 0.45rem;
		left: 0.45rem;
		padding: 0.05rem 0.55rem;
		border-radius: 999px;
		box-shadow: 0 1px 3px rgb(51 42 36 / 0.18);
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
	/* A light outline says the name can be typed over; it firms up on hover. */
	.name input {
		width: 100%;
		padding: 0.35rem 0.5rem;
		border: 1px solid var(--line);
		border-radius: 6px;
		background: var(--paper);
		color: var(--ink);
		font-family: var(--serif);
		font-size: 1.05rem;
		font-weight: 700;
		text-overflow: ellipsis;
	}
	.name input:hover {
		border-color: var(--line-strong);
	}
	.name input:focus {
		border-color: var(--accent);
		outline: none;
		background: var(--paper);
	}
	/* Square rows that run the full width of the column, like a file list. */
	nav {
		display: flex;
		flex-direction: column;
		margin: 0 -1rem;
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
	}
	.item {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.6rem 1rem;
		border: none;
		border-radius: 0;
		background: none;
		color: var(--ink-soft);
		font-size: 0.95rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
	}
	.item:hover {
		background: var(--paper);
	}
	.item.within {
		color: var(--ink);
		cursor: default;
	}
	.item.within:hover {
		background: none;
	}
	.item.sub {
		padding: 0.45rem 1rem 0.45rem 2.1rem;
		font-size: 0.9rem;
		font-weight: 500;
	}
	.item.active {
		background: var(--paper);
		color: var(--accent-dark);
		box-shadow: inset 3px 0 0 var(--accent);
	}
	.label {
		flex: 1;
	}
	.count {
		color: var(--muted);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}
	.item.active .count {
		color: var(--accent-dark);
	}
	/* Pinned to the bottom of the column, the way a store's link is in Class Grocery. */
	.share {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	.help-corner {
		margin: 0.5rem 0 -0.25rem -0.4rem;
	}
	.share-title {
		font-family: var(--serif);
		font-weight: 600;
	}
	.copy {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.65rem 0.8rem;
		border: none;
		border-radius: 8px;
		background: var(--accent);
		color: var(--paper);
		font-size: 0.92rem;
		font-weight: 700;
		cursor: pointer;
	}
	.copy:hover {
		background: var(--accent-dark);
	}
	.copy.stale {
		background: var(--amber);
		color: #6b4a00;
		box-shadow: inset 0 0 0 1px var(--amber-border);
	}
	.view {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.55rem 0.8rem;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: var(--paper);
		color: var(--ink-soft);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.view:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.hint {
		color: var(--muted);
		font-size: 0.8rem;
	}
	.qrrow {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--ink-soft);
	}
	.qrrow span {
		flex: 1;
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
	.qr {
		padding: 0.4rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: #fff;
	}
	.qr svg {
		display: block;
		width: 100%;
		height: auto;
		shape-rendering: crispEdges;
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	/* On a narrow screen the column becomes a bar across the top. */
	@media (max-width: 56rem) {
		.sidebar {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			height: auto;
			border-right: none;
			border-bottom: 1px solid var(--line);
		}
		.back {
			flex-basis: 100%;
		}
		.thumb {
			display: none;
		}
		.identity {
			flex: 1 1 14rem;
		}
		/* The pages wrap into a strip of tabs; the bank's three lists keep their counts. */
		nav {
			flex-basis: calc(100% + 2rem);
			flex-direction: row;
			flex-wrap: wrap;
		}
		.item,
		.item.sub {
			padding: 0.5rem 0.75rem;
		}
		.item.within {
			display: none;
		}
		.share {
			flex-basis: 100%;
			margin-top: 0;
		}
	}
</style>
