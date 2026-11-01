<script lang="ts">
	// The foot of the site's pages: who made the tool, About and Privacy, and a
	// help button pinned to the bottom-left corner of the window.
	import { CircleQuestionMark } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import logo from '$lib/assets/edtechathon-logo.svg';
	import EmailDialog from '$lib/EmailDialog.svelte';

	let help = $state<EmailDialog>();
</script>

<footer>
	<button
		type="button"
		class="help"
		aria-label="Help"
		aria-haspopup="dialog"
		onclick={() => help?.open()}
	>
		<CircleQuestionMark size={20} aria-hidden="true" />
	</button>
	<a class="link built" href="https://teacher.dev" target="_blank" rel="noopener noreferrer">
		<img src={logo} alt="" width="18" height="18" />
		Built by teacher.dev
	</a>
	<a class="link" href={resolve('/about')}>about</a>
	<a class="link" href={resolve('/privacy')}>privacy</a>
</footer>

<EmailDialog bind:this={help} title="Need a hand?" subject="Algebra Tiles">
	<p>If you’re running into trouble or have suggestions, email us and we’ll help.</p>
</EmailDialog>

<style>
	footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.4rem 1.1rem;
	}
	.link {
		color: var(--muted);
		font-size: 0.82rem;
		text-decoration: none;
	}
	.built {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}
	.link:hover {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 4px;
	}
	/* Help stays in the bottom-left corner of the window, wherever the page is scrolled. */
	.help {
		position: fixed;
		z-index: 30;
		bottom: 1rem;
		left: 1rem;
		display: grid;
		place-items: center;
		width: 2.6rem;
		height: 2.6rem;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--paper);
		box-shadow: 0 4px 14px rgb(29 40 56 / 0.12);
		color: var(--muted);
		cursor: pointer;
	}
	.help:hover,
	.help:focus-visible {
		background: var(--accent-wash);
		color: var(--accent);
	}
</style>
