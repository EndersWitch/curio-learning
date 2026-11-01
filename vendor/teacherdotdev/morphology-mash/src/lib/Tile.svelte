<script lang="ts">
	// A morpheme written on a tile, like a letter tile from a word game: raised
	// off the page, the same size whatever is written on it, so tiles moving
	// between the tray and the paper never nudge anything else. A long meaning
	// is cut to two lines rather than growing the tile.
	//
	// The tile carries its type's colour and name only when types are being
	// shown — when the student is being asked for the type, every tile is plain
	// cream so the colour cannot give it away.
	import { TYPE_NAMES, tileLabel, type Morpheme } from './content';

	let {
		morpheme,
		text,
		meaning,
		showType = false,
		showMeaning = false,
		root = false
	}: {
		morpheme: Morpheme;
		/** What is written on the tile, when it differs from the morpheme's spelling. */
		text?: string;
		/** The meaning to show, when it is not the first one (see meaningIn). */
		meaning?: string;
		showType?: boolean;
		showMeaning?: boolean;
		/** Show where a base comes from, when it has a root. */
		root?: boolean;
	} = $props();

	const written = $derived(text ?? tileLabel(morpheme, showType));
</script>

<span class="tile {showType ? morpheme.type : 'plain'}" class:long={written.length > 7}>
	<span class="type">{showType ? TYPE_NAMES[morpheme.type] : ''}</span>
	<span class="spelling">{written}</span>
	<span class="meaning"
		>{showMeaning ? (meaning ?? morpheme.meanings[0]) : ''}{#if root && morpheme.root}<span
				class="root"
			>
				· {morpheme.root}</span
			>{/if}</span
	>
</span>

<style>
	.tile {
		display: grid;
		grid-template-rows: 0.8rem 1.75rem 2rem;
		align-items: center;
		justify-items: center;
		width: var(--tile-w, 7.5rem);
		height: var(--tile-h, 5rem);
		padding: 0.3rem 0.4rem;
		border: 1.5px solid var(--line-strong);
		border-radius: 9px;
		background: var(--paper);
		color: var(--ink);
		text-align: center;
		/* Raised: a firm edge underneath and a soft shadow around. */
		box-shadow:
			0 3px 0 rgb(51 42 36 / 0.16),
			0 4px 10px rgb(51 42 36 / 0.1);
		transition:
			transform 0.12s,
			box-shadow 0.12s;
	}
	.prefix {
		background: var(--prefix-wash);
		border-color: var(--prefix-line);
		color: var(--prefix-ink);
	}
	.base {
		background: var(--base-wash);
		border-color: var(--base-line);
		color: var(--base-ink);
	}
	.suffix {
		background: var(--suffix-wash);
		border-color: var(--suffix-line);
		color: var(--suffix-ink);
	}
	.type {
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.spelling {
		font-family: var(--serif);
		font-size: 1.4rem;
		font-weight: 600;
		line-height: 1;
		color: var(--ink);
		white-space: nowrap;
	}
	.long .spelling {
		font-size: 1.1rem;
	}
	.meaning {
		display: -webkit-box;
		overflow: hidden;
		align-self: start;
		font-family: var(--serif);
		font-size: 0.72rem;
		font-style: italic;
		line-height: 1.2;
		color: var(--ink-soft);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
	.root {
		font-style: normal;
		color: var(--muted);
	}
</style>
