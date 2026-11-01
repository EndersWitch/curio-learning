<script lang="ts">
	// The one way to reach a person, the way TestParrot has it: a quiet question
	// mark at the left of every teacher screen's footer, opening a short
	// note on how the app works and who to email. The browser's own modal dialog
	// keeps focus inside it and closes it on Escape.
	import { CircleQuestionMark, X } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { NEWS, showAllNews } from './news.svelte';

	const CONTACT = 'support@teacher.dev';
	const mail = (subject: string) =>
		`mailto:${CONTACT}?subject=${encodeURIComponent(`Morphology Mash: ${subject}`)}`;

	let dialog = $state<HTMLDialogElement>();

	// A press on the dimmed backdrop lands on the dialog element itself, not on
	// anything inside it.
	function closeOnBackdrop(event: MouseEvent) {
		if (event.target === dialog) dialog?.close();
	}

	function whatsChanged() {
		dialog?.close();
		showAllNews();
	}
</script>

<button
	type="button"
	class="help no-print"
	aria-label="Help"
	aria-haspopup="dialog"
	title="Help"
	onclick={() => dialog?.showModal()}
>
	<CircleQuestionMark size={22} />
</button>

<dialog
	bind:this={dialog}
	class="help-dialog"
	aria-labelledby="help-title"
	onclick={closeOnBackdrop}
>
	<header>
		<h2 id="help-title">Need a hand?</h2>
		<button type="button" class="close" aria-label="Close help" onclick={() => dialog?.close()}
			><X size={18} /></button
		>
	</header>

	<h3>How it works</h3>
	<ol>
		<li>
			<strong>Make an activity</strong>: Build or Break, or start from one of the ready-made ones.
		</li>
		<li>
			<strong>Fill its Morpheme Bank</strong>: tick the prefixes, bases and suffixes students should
			practise. They only see words made entirely from those.
		</li>
		<li><strong>Choose its settings</strong>: what to show or ask, feedback, and any limits.</li>
		<li>
			<strong>Share the link</strong>: students open it, with no accounts, and finish with a report
			they can save as a PDF.
		</li>
	</ol>

	<h3>Get in touch</h3>
	<p>
		Running into trouble or have an idea? Email us at
		<!-- eslint-disable svelte/no-navigation-without-resolve -- email links, not pages -->
		<a href={mail('help')}>{CONTACT}</a>. Missing a morpheme, or spotted a definition that isn't
		right? <a href={mail('a morpheme to add')}>Ask us to add it</a> or use the flag beside any
		morpheme or word in the Morpheme Bank.
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</p>

	<p class="links">
		{#if NEWS.length}<button type="button" class="link" onclick={whatsChanged}
				>What's changed</button
			>
			·{/if}
		<a href={resolve('/about')}>About</a> · <a href={resolve('/privacy')}>Privacy</a>
	</p>
</dialog>

<style>
	.help {
		display: inline-flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--muted);
		cursor: pointer;
	}
	.help:hover,
	.help:focus-visible {
		background: var(--paper-low);
		color: var(--accent);
	}
	.help-dialog {
		width: min(28rem, calc(100vw - 2rem));
		margin: auto;
		padding: 1.25rem 1.4rem 1.4rem;
		border: none;
		border-radius: 12px;
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 18px 60px rgb(51 42 36 / 0.24);
	}
	.help-dialog::backdrop {
		background: rgb(51 42 36 / 0.42);
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	h2 {
		font-size: 1.3rem;
		font-weight: 700;
	}
	h3 {
		margin: 0.9rem 0 0.35rem;
		font-size: 1rem;
		font-weight: 600;
	}
	.close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 6px;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}
	.close:hover {
		background: var(--paper-low);
		color: var(--ink);
	}
	ol {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding-left: 1.2rem;
		font-size: 0.9rem;
		line-height: 1.5;
	}
	p {
		font-size: 0.9rem;
		line-height: 1.6;
	}
	a,
	.link {
		color: var(--accent);
		font-weight: 600;
	}
	.link {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		text-decoration: underline;
		cursor: pointer;
	}
	.links {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--line);
		color: var(--muted);
	}
</style>
