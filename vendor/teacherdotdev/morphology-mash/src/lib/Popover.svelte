<script lang="ts">
	// A small panel that drops from a button — the Filter and Sort menus, and
	// each filter pill's choices. It is placed with fixed positioning, so a
	// scrolling page never clips it, and it closes on Escape or a click outside.
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		trigger,
		children,
		minWidth = 220
	}: {
		open: boolean;
		trigger: Snippet<[{ toggle: () => void }]>;
		children: Snippet<[{ close: () => void }]>;
		minWidth?: number;
	} = $props();

	let anchor: HTMLDivElement | undefined = $state();
	let panel: HTMLDivElement | undefined = $state();
	let pos = $state({ top: 0, left: 0 });

	const close = () => (open = false);
	const toggle = () => (open = !open);

	// Under the button, kept on screen at the right edge.
	function place() {
		if (!anchor) return;
		const r = anchor.getBoundingClientRect();
		pos = {
			top: r.bottom + 4,
			left: Math.max(8, Math.min(r.left, window.innerWidth - minWidth - 8))
		};
	}

	$effect(() => {
		if (!open) return;
		place();
		window.addEventListener('scroll', place, true);
		window.addEventListener('resize', place);
		return () => {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		};
	});

	function onOutside(e: PointerEvent) {
		const t = e.target as Node;
		if (open && !anchor?.contains(t) && !panel?.contains(t)) close();
	}
</script>

<svelte:window
	onpointerdown={onOutside}
	onkeydown={(e) => {
		if (open && e.key === 'Escape') close();
	}}
/>

<div class="anchor" bind:this={anchor}>
	{@render trigger({ toggle })}
</div>

{#if open}
	<div
		class="popover"
		bind:this={panel}
		style:top="{pos.top}px"
		style:left="{pos.left}px"
		style:min-width="{minWidth}px"
	>
		{@render children({ close })}
	</div>
{/if}

<style>
	.anchor {
		display: inline-block;
	}
	.popover {
		position: fixed;
		z-index: 60;
		max-width: 320px;
		padding: 6px;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: var(--paper);
		box-shadow: 0 8px 24px rgb(51 42 36 / 0.16);
	}
</style>
