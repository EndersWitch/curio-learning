<script lang="ts">
	// A box for writing to us, shared by Help and Suggest an activity so the two
	// look alike: a short message, the address with a copy button (many school
	// computers have no email app), and a button that opens an email.
	import { Check, Copy, Mail, X } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { SUPPORT_EMAIL } from '$lib/support';

	let {
		title,
		subject,
		body = '',
		children
	}: { title: string; subject: string; body?: string; children: Snippet } = $props();

	let dialog = $state<HTMLDialogElement>();
	export const open = () => dialog?.showModal();

	const id = $props.id();
	const query = $derived(
		`subject=${encodeURIComponent(subject)}` + (body ? `&body=${encodeURIComponent(body)}` : '')
	);
	let copied = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(SUPPORT_EMAIL);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			// The address is on screen to copy by hand.
		}
	}
</script>

<!-- A click on the backdrop, outside the box, closes it too. -->
<dialog
	bind:this={dialog}
	aria-labelledby="{id}-title"
	onclick={(e) => e.target === dialog && dialog.close()}
>
	<div class="box">
		<header>
			<h2 id="{id}-title">{title}</h2>
			<button type="button" class="close" aria-label="Close" onclick={() => dialog?.close()}>
				<X size={18} />
			</button>
		</header>
		<div class="message">{@render children()}</div>
		<div class="address">
			<span>{SUPPORT_EMAIL}</span>
			<button type="button" class="copy" onclick={copy}>
				{#if copied}
					<Check size={15} aria-hidden="true" /> Copied
				{:else}
					<Copy size={15} aria-hidden="true" /> Copy
				{/if}
			</button>
		</div>
		<a class="btn-primary open" href="mailto:{SUPPORT_EMAIL}?{query}">
			<Mail size={17} aria-hidden="true" /> Open in email
		</a>
	</div>
</dialog>

<style>
	dialog {
		width: min(27rem, calc(100vw - 2rem));
		margin: auto;
		padding: 0;
		border: none;
		border-radius: 12px;
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 18px 60px rgb(29 40 56 / 0.24);
	}
	dialog::backdrop {
		background: rgb(29 40 56 / 0.35);
	}
	.box {
		padding: 1.25rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.6rem;
	}
	h2 {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.close {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: none;
		border-radius: 8px;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}
	.close:hover {
		background: var(--paper-low);
	}
	.message {
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.message :global(p + p) {
		margin-top: 0.6rem;
	}
	.address {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 1rem;
		padding: 0.35rem 0.35rem 0.35rem 0.8rem;
		border: 1.5px solid var(--line);
		border-radius: 10px;
		font-weight: 600;
		word-break: break-all;
	}
	.copy {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.3rem;
		padding: 0.4rem 0.65rem;
		border: 0;
		border-radius: 7px;
		background: var(--accent-wash);
		color: var(--accent);
		font-size: 0.86rem;
		font-weight: 700;
		cursor: pointer;
	}
	.open {
		display: flex;
		justify-content: center;
		gap: 0.4rem;
		width: 100%;
		margin-top: 0.75rem;
	}
</style>
