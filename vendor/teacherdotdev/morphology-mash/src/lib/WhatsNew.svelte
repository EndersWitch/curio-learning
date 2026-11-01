<script lang="ts">
	// The "What's changed" window: the news a teacher hasn't seen, newest first,
	// each change beside a drawing of it. Closing it in any way counts as having
	// seen it. The browser's own <dialog> handles Escape, focus and the backdrop.
	import NewsArt from './NewsArt.svelte';
	import { closeNews, news } from './news.svelte';

	let dialog = $state<HTMLDialogElement>();

	// Opening focuses "Got it" at the bottom; start from the top so a phone
	// shows the heading first.
	$effect(() => {
		if (!dialog || !news.shown.length || dialog.open) return;
		dialog.showModal();
		dialog.scrollTop = 0;
	});

	// A press on the dimmed backdrop lands on the dialog element itself, not on
	// anything inside it.
	function closeOnBackdrop(event: MouseEvent) {
		if (event.target === dialog) dialog?.close();
	}
</script>

<dialog
	bind:this={dialog}
	class="whats-changed no-print"
	aria-labelledby="whats-changed-title"
	onclose={closeNews}
	onclick={closeOnBackdrop}
>
	<p class="eyebrow">What's changed</p>
	<h2 id="whats-changed-title">Thank you for all your suggestions</h2>
	<p class="lede">Here's what's new in Morphology Mash.</p>

	{#each news.shown as update (update.id)}
		<section class="update">
			{#if news.shown.length > 1}<p class="eyebrow">{update.title}</p>{/if}
			<ol class="changes">
				{#each update.items as item (item.title)}
					<li>
						<div>
							<h3>{item.title}</h3>
							<p class="text">{item.text}</p>
						</div>
						<NewsArt kind={item.art} />
					</li>
				{/each}
			</ol>
		</section>
	{/each}

	<div class="actions">
		<button type="button" class="btn-primary" onclick={() => dialog?.close()}>Got it</button>
	</div>
</dialog>

<style>
	.whats-changed {
		width: min(52rem, calc(100vw - 2rem));
		max-height: calc(100vh - 2rem);
		margin: auto;
		padding: 1.5rem 1.6rem;
		border: none;
		border-radius: 14px;
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 16px 48px rgb(51 42 36 / 0.25);
	}
	.whats-changed::backdrop {
		background: rgb(51 42 36 / 0.4);
	}
	.eyebrow {
		color: var(--accent);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	h2 {
		margin-top: 0.2rem;
		font-size: 1.5rem;
		font-weight: 700;
	}
	.lede {
		margin: 0.25rem 0 0.5rem;
		color: var(--muted);
		font-size: 0.92rem;
	}
	.update {
		display: grid;
		gap: 0.6rem;
		margin-top: 0.75rem;
	}
	.update + .update {
		padding-top: 1.25rem;
		border-top: 2px solid var(--line-strong);
	}
	.changes {
		display: grid;
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.changes li {
		display: grid;
		grid-template-columns: 1fr minmax(0, 15rem);
		align-items: center;
		gap: 1.75rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
	}
	h3 {
		margin-bottom: 0.35rem;
		font-size: 1.1rem;
		font-weight: 700;
	}
	.text {
		color: var(--ink-soft);
		font-size: 0.92rem;
		line-height: 1.55;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.25rem;
	}
	@media (max-width: 40rem) {
		.changes li {
			grid-template-columns: 1fr;
			gap: 0.75rem;
		}
	}
</style>
