<script lang="ts">
	// The pop-up behind "New activity": pick an activity type by its picture,
	// then Create. The browser's own <dialog> handles Escape, focus and the
	// backdrop.
	import Picture from './Picture.svelte';
	import { TYPE_ABOUT, TYPE_LABELS, type ActivityType } from './settings';

	let { oncreate }: { oncreate: (type: ActivityType) => void } = $props();

	let dialog = $state<HTMLDialogElement>();
	let chosen = $state<ActivityType>('build');

	export function open() {
		chosen = 'build';
		dialog?.showModal();
	}

	function create(event: SubmitEvent) {
		event.preventDefault();
		dialog?.close();
		oncreate(chosen);
	}
</script>

<dialog bind:this={dialog} aria-labelledby="new-title">
	<form onsubmit={create}>
		<h2 id="new-title">New activity</h2>
		<p class="lede">Choose an activity type. You can set up its morphemes and settings next.</p>

		<div class="types" role="radiogroup" aria-label="Activity type">
			{#each ['build', 'break'] as const as type (type)}
				<label class="type" class:on={chosen === type}>
					<input type="radio" name="type" value={type} bind:group={chosen} />
					<Picture kind={type} label="" />
					<span class="name">{TYPE_LABELS[type]}</span>
					<span class="about">{TYPE_ABOUT[type]}</span>
				</label>
			{/each}
		</div>

		<div class="actions">
			<button type="button" class="btn-ghost" onclick={() => dialog?.close()}>Cancel</button>
			<button type="submit" class="btn-primary">Create</button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		width: min(36rem, calc(100% - 2rem));
		margin: auto;
		padding: 1.5rem;
		border: none;
		border-radius: 14px;
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 16px 48px rgb(51 42 36 / 0.25);
	}
	dialog::backdrop {
		background: rgb(51 42 36 / 0.4);
	}
	h2 {
		font-size: 1.5rem;
		font-weight: 700;
	}
	.lede {
		margin: 0.25rem 0 1.25rem;
		color: var(--muted);
		font-size: 0.92rem;
	}
	.types {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	.type {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 0.6rem 0.6rem 0.85rem;
		border: 2px solid var(--line);
		border-radius: 12px;
		background: var(--paper-low);
		cursor: pointer;
	}
	.type:hover {
		border-color: var(--line-strong);
	}
	.type.on {
		border-color: var(--accent);
		background: var(--accent-wash);
	}
	.type:has(input:focus-visible) {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
	/* The card itself is the control; the radio stays for keyboards and screen readers. */
	.type input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.name {
		margin-top: 0.2rem;
		font-family: var(--serif);
		font-size: 1.2rem;
		font-weight: 700;
	}
	.about {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 1.25rem;
	}
	@media (max-width: 30rem) {
		.types {
			grid-template-columns: 1fr;
		}
	}
</style>
