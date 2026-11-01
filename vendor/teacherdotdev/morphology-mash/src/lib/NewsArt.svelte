<script lang="ts" module>
	export type NewsArtKind = 'new-morphemes' | 'new-starters' | 'search-spellings';
</script>

<script lang="ts">
	// A drawing for one "What's changed" item, made of the same pieces as the
	// activity pictures (paper, tiles, cards) in the same colours, so it shows
	// the app rather than illustrating it.
	let { kind }: { kind: NewsArtKind } = $props();

	type Tint = 'prefix' | 'base' | 'suffix';

	const FILL: Record<Tint, string> = {
		prefix: 'var(--prefix-wash)',
		base: 'var(--base-wash)',
		suffix: 'var(--suffix-wash)'
	};
	const LINE: Record<Tint, string> = {
		prefix: 'var(--prefix-ink)',
		base: 'var(--base-ink)',
		suffix: 'var(--suffix-ink)'
	};

	const LABELS: Record<NewsArtKind, string> = {
		'new-morphemes':
			'New morpheme tiles with their meanings: fore, before; mal, bad; circum, around; jur, law; bene, good; terra, earth',
		'new-starters': 'Three new starter activities in the activity list',
		'search-spellings':
			'The Morpheme Bank search box with “miss” typed in, finding the base mit, meaning send'
	};

	const TILES: { text: string; note: string; tint: Tint }[][] = [
		[
			{ text: 'fore', note: 'before', tint: 'prefix' },
			{ text: 'mal', note: 'bad', tint: 'prefix' },
			{ text: 'circum', note: 'around', tint: 'prefix' }
		],
		[
			{ text: 'jur', note: 'law', tint: 'base' },
			{ text: 'bene', note: 'good', tint: 'base' },
			{ text: 'terra', note: 'earth', tint: 'base' }
		]
	];

	const STARTERS = ['Prefixes', 'Latin bases', 'Unit words'];
</script>

<!-- One morpheme tile with its meaning underneath, raised off the paper. -->
{#snippet tile(x: number, y: number, w: number, text: string, note: string, tint: Tint)}
	<rect x={x + 1} y={y + 2} width={w} height="30" rx="4" fill="rgb(51 42 36 / 0.12)" />
	<rect
		{x}
		{y}
		width={w}
		height="30"
		rx="4"
		fill={FILL[tint]}
		stroke={LINE[tint]}
		stroke-width="1.2"
	/>
	<text x={x + w / 2} y={y + 15} class="word">{text}</text>
	<text x={x + w / 2} y={y + 25} class="note">{note}</text>
{/snippet}

<svg viewBox="0 0 160 100" role="img" aria-label={LABELS[kind]}>
	<rect x="4" y="4" width="152" height="92" rx="5" fill="var(--paper)" stroke="var(--line)" />

	{#if kind === 'new-morphemes'}
		{#each TILES as row, r (r)}
			{#each row as t, i (t.text)}
				{@render tile(12 + i * 47, 14 + r * 40, 42, t.text, t.note, t.tint)}
			{/each}
		{/each}
	{:else if kind === 'new-starters'}
		{#each STARTERS as name, i (name)}
			{@const y = 12 + i * 27}
			<rect
				x="14"
				{y}
				width="132"
				height="22"
				rx="4"
				fill="var(--paper-low)"
				stroke="var(--line)"
			/>
			<rect
				x="19"
				y={y + 4}
				width="20"
				height="14"
				rx="2"
				fill="var(--base-wash)"
				stroke="var(--base-line)"
			/>
			<text x="45" y={y + 14.5} class="card">{name}</text>
			<rect x="118" y={y + 6} width="22" height="10" rx="5" fill="var(--accent-wash)" />
			<text x="129" y={y + 13.2} class="new">NEW</text>
		{/each}
	{:else if kind === 'search-spellings'}
		<!-- The Morpheme Bank's search box, and the row it finds. -->
		<rect
			x="14"
			y="14"
			width="132"
			height="20"
			rx="10"
			fill="var(--paper-low)"
			stroke="var(--line-strong)"
		/>
		<circle cx="26" cy="23.5" r="3.5" fill="none" stroke="var(--muted)" stroke-width="1.2" />
		<line x1="28.5" y1="26" x2="31" y2="28.5" stroke="var(--muted)" stroke-width="1.2" />
		<text x="38" y="27.5" class="card">miss</text>
		<rect
			x="14"
			y="44"
			width="132"
			height="40"
			rx="4"
			fill="var(--paper-low)"
			stroke="var(--line)"
		/>
		{@render tile(22, 49, 42, 'mit', 'send', 'base')}
		<text x="74" y="62" class="card">mission</text>
		<text x="74" y="73" class="found">also written miss</text>
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	text {
		text-anchor: middle;
		fill: var(--ink);
	}
	.word {
		font-family: var(--serif);
		font-size: 9.5px;
		font-weight: 600;
	}
	.note {
		font-family: var(--serif);
		font-size: 6.5px;
		font-style: italic;
		fill: var(--ink-soft);
	}
	.card {
		font-family: var(--serif);
		font-size: 8px;
		font-weight: 600;
		text-anchor: start;
	}
	.found {
		font-family: var(--sans);
		font-size: 6px;
		text-anchor: start;
		fill: var(--muted);
	}
	.new {
		font-family: var(--sans);
		font-size: 5.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		fill: var(--accent);
	}
</style>
