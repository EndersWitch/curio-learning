<script lang="ts" module>
	export type PictureKind =
		| 'build'
		| 'break'
		| 'types-labelled'
		| 'types-plain'
		| 'feedback-now'
		| 'feedback-end'
		| 'cut-types-shown'
		| 'cut-types-asked'
		| 'cut-meanings-shown'
		| 'cut-meanings-asked';
</script>

<script lang="ts">
	// Small drawings that show what an activity type or a setting does, so a
	// teacher can pick by looking rather than by reading. Every drawing is made
	// of the same pieces the student sees — paper, tiles, slots — in the same
	// colours, so the picture is a preview, not an illustration.
	//
	// The Build and Break pictures can be drawn from a real word, so each
	// activity's card shows a word its students will actually meet.
	import { meaningOf, MORPHEMES, writtenForm, type Word } from './content';

	let { kind, label = '', word }: { kind: PictureKind; label?: string; word?: Word } = $props();

	type Tint = 'prefix' | 'base' | 'suffix' | 'plain';

	interface Piece {
		text: string;
		tint: Tint;
		note: string;
	}

	// Without a word to draw, the pictures use unkind and unkindness.
	const UN: Piece = { text: 'un', tint: 'prefix', note: 'not' };
	const KIND: Piece = { text: 'kind', tint: 'base', note: 'caring' };
	const NESS: Piece = { text: 'ness', tint: 'suffix', note: 'state of' };

	const sample = $derived.by(() => {
		if (!word)
			return { definition: 'not kind', pieces: kind === 'break' ? [UN, KIND, NESS] : [UN, KIND] };
		return {
			definition: word.definition,
			// Four pieces is as many as fit across the drawing.
			pieces: word.parts.slice(0, 4).map((p): Piece => ({
				text: kind === 'break' ? writtenForm(p) : MORPHEMES[p.m].spelling,
				tint: MORPHEMES[p.m].type,
				note: meaningOf(p)
			}))
		};
	});

	/** Where each piece goes in a centred row across the paper. */
	function row(count: number, gap: number): { w: number; xs: number[] } {
		const w = Math.min(44, (128 - gap * (count - 1)) / count);
		const start = 84 - (count * w + gap * (count - 1)) / 2;
		return { w, xs: Array.from({ length: count }, (_, i) => start + i * (w + gap)) };
	}

	/** The largest font size up to `max` at which `text` fits in `width`. */
	function fit(text: string, width: number, max: number): number {
		return Math.min(max, width / (text.length * 0.6));
	}

	function clip(text: string, chars: number): string {
		return text.length > chars ? text.slice(0, chars - 1).trimEnd() + '…' : text;
	}

	const buildRow = $derived(row(sample.pieces.length, 10));
	const breakRow = $derived(row(sample.pieces.length, 6));

	const FILL: Record<Tint, string> = {
		prefix: 'var(--prefix-wash)',
		base: 'var(--base-wash)',
		suffix: 'var(--suffix-wash)',
		plain: 'var(--paper)'
	};
	const LINE: Record<Tint, string> = {
		prefix: 'var(--prefix-ink)',
		base: 'var(--base-ink)',
		suffix: 'var(--suffix-ink)',
		plain: 'var(--line-strong)'
	};
</script>

<!-- One morpheme tile: a raised card with its spelling, and optionally its type above. -->
{#snippet tile(
	x: number,
	y: number,
	w: number,
	text: string,
	tint: Tint,
	tag = '',
	note = '',
	size = 11
)}
	<rect x={x + 1} y={y + 2} width={w} height="26" rx="4" fill="rgb(51 42 36 / 0.12)" />
	<rect
		{x}
		{y}
		width={w}
		height="26"
		rx="4"
		fill={FILL[tint]}
		stroke={LINE[tint]}
		stroke-width="1.2"
	/>
	{#if tag}
		<text x={x + w / 2} y={y + 8.5} class="tag" fill={LINE[tint]}>{tag}</text>
	{/if}
	<text x={x + w / 2} y={y + (tag ? 20 : note ? 14 : 17.5)} class="word" font-size={size}
		>{text}</text
	>
	{#if note}
		<text x={x + w / 2} y={y + 22} class="note">{note}</text>
	{/if}
{/snippet}

<!-- An empty worksheet blank. -->
{#snippet slot(x: number, y: number, w: number)}
	<rect
		{x}
		{y}
		width={w}
		height="26"
		rx="4"
		fill="var(--paper-low)"
		stroke="var(--line-strong)"
		stroke-dasharray="3 2.5"
	/>
{/snippet}

<!-- The lined sheet every drawing sits on. -->
{#snippet paper()}
	<rect x="4" y="4" width="152" height="92" rx="5" fill="var(--paper)" stroke="var(--line)" />
	{#each [26, 46, 66, 86] as y (y)}
		<line x1="12" x2="148" y1={y} y2={y} stroke="var(--line)" stroke-width="0.8" />
	{/each}
	<line x1="20" x2="20" y1="4" y2="96" stroke="var(--accent-line)" stroke-width="0.8" />
{/snippet}

{#snippet check(cx: number, cy: number)}
	<circle {cx} {cy} r="6" fill="var(--good)" />
	<path
		d="M{cx - 3} {cy}l2 2.2 4-4.4"
		fill="none"
		stroke="var(--paper)"
		stroke-width="1.6"
		stroke-linecap="round"
		stroke-linejoin="round"
	/>
{/snippet}

{#snippet cross(cx: number, cy: number)}
	<circle {cx} {cy} r="6" fill="var(--bad)" />
	<path
		d="M{cx - 2.3} {cy - 2.3}l4.6 4.6M{cx + 2.3} {cy - 2.3}l-4.6 4.6"
		stroke="var(--paper)"
		stroke-width="1.6"
		stroke-linecap="round"
	/>
{/snippet}

<!-- A multiple-choice answer, as a small pill. -->
{#snippet option(x: number, y: number, w: number, text: string)}
	<rect
		{x}
		{y}
		width={w}
		height="12"
		rx="6"
		fill="var(--paper)"
		stroke="var(--line-strong)"
		stroke-width="0.9"
	/>
	<text x={x + w / 2} y={y + 8.6} class="pill">{text}</text>
{/snippet}

<svg viewBox="0 0 160 100" role="img" aria-label={label}>
	{@render paper()}

	{#if kind === 'build'}
		<!-- A definition, blanks on the paper, and the last piece on its way in. -->
		{@const { w, xs } = buildRow}
		{@const last = sample.pieces.length - 1}
		<text x="84" y="17" class="definition">“{clip(sample.definition, 26)}”</text>
		{#each sample.pieces as piece, i (i)}
			{#if i < last}
				{@render tile(
					xs[i],
					24,
					w,
					piece.text,
					piece.tint,
					'',
					clip(piece.note, Math.floor(w / 3.3)),
					fit(piece.text, w - 5, 11)
				)}
				<text x={xs[i] + w + 5} y="41" class="plus">+</text>
			{:else}
				{@render slot(xs[i], 24, w)}
				{@render tile(
					xs[i],
					66,
					w,
					piece.text,
					piece.tint,
					'',
					clip(piece.note, Math.floor(w / 3.3)),
					fit(piece.text, w - 5, 11)
				)}
				<path
					d="M{xs[i] + w / 2} 63 V55"
					stroke="var(--accent)"
					stroke-width="1.6"
					stroke-linecap="round"
					marker-end="url(#arrow-{kind})"
				/>
			{/if}
		{/each}
		<defs>
			<marker
				id="arrow-{kind}"
				viewBox="0 0 6 6"
				refX="3"
				refY="3"
				markerWidth="4"
				markerHeight="4"
				orient="auto"
			>
				<path d="M0 0L6 3L0 6z" fill="var(--accent)" />
			</marker>
		</defs>
	{:else if kind === 'break'}
		<!-- A word, cut, and coming apart into its pieces. -->
		{@const { w, xs } = breakRow}
		{@const whole = sample.pieces.map((p) => p.text).join('|')}
		<text x="84" y="22" class="whole" font-size={fit(whole, 128, 14)}>{whole}</text>
		{#each sample.pieces as piece, i (i)}
			<line
				x1="84"
				y1="28"
				x2={xs[i] + w / 2}
				y2="52"
				stroke="var(--line-strong)"
				stroke-width="0.9"
				stroke-dasharray="2 2"
			/>
			{@render tile(xs[i], 56, w, piece.text, piece.tint, '', '', fit(piece.text, w - 5, 11))}
		{/each}
	{:else if kind === 'types-labelled'}
		{@render tile(30, 36, 46, 'un', 'prefix', 'PREFIX')}
		{@render tile(84, 36, 46, 'kind', 'base', 'BASE')}
	{:else if kind === 'types-plain'}
		{@render tile(30, 36, 46, 'un', 'plain')}
		{@render tile(84, 36, 46, 'kind', 'plain')}
	{:else if kind === 'feedback-now'}
		<!-- One piece fits and stays; the wrong one bounces back to the tray. -->
		{@render tile(30, 30, 46, 'un', 'prefix')}
		{@render check(76, 30)}
		{@render slot(84, 30, 46)}
		{@render tile(96, 68, 46, 'dis', 'prefix')}
		{@render cross(142, 68)}
		<!-- The path it takes falling back out of the slot. -->
		<path
			d="M107 58 q-2 5 4 8"
			fill="none"
			stroke="var(--bad)"
			stroke-width="1.3"
			stroke-dasharray="2 2"
		/>
	{:else if kind === 'feedback-end'}
		<!-- Every slot filled first, then one Check for the lot. -->
		{@render tile(30, 26, 46, 'un', 'prefix')}
		{@render tile(84, 26, 46, 'kind', 'base')}
		<rect x="58" y="66" width="44" height="18" rx="5" fill="var(--accent)" />
		<text x="80" y="78.5" class="button">Check</text>
	{:else if kind === 'cut-types-shown'}
		<text x="80" y="22" class="whole" font-size="14">un|kind</text>
		{@render tile(30, 42, 46, 'un', 'prefix', 'PREFIX')}
		{@render tile(84, 42, 46, 'kind', 'base', 'BASE')}
	{:else if kind === 'cut-types-asked'}
		<!-- The part is outlined and the student picks its type. -->
		<rect
			x="55"
			y="13"
			width="50"
			height="30"
			rx="6"
			fill="none"
			stroke="var(--accent)"
			stroke-width="1.6"
		/>
		{@render tile(57, 15, 46, 'un', 'plain')}
		<text x="80" y="56" class="ask">What type?</text>
		{@render option(16, 66, 40, 'Prefix')}
		{@render option(60, 66, 40, 'Base')}
		{@render option(104, 66, 40, 'Suffix')}
	{:else if kind === 'cut-meanings-shown'}
		<text x="80" y="22" class="whole" font-size="14">un|kind</text>
		{@render tile(30, 42, 46, 'un', 'plain', '', 'not')}
		{@render tile(84, 42, 46, 'kind', 'plain', '', 'caring')}
	{:else if kind === 'cut-meanings-asked'}
		<rect
			x="55"
			y="9"
			width="50"
			height="30"
			rx="6"
			fill="none"
			stroke="var(--accent)"
			stroke-width="1.6"
		/>
		{@render tile(57, 11, 46, 'un', 'plain')}
		<text x="80" y="51" class="ask">What does it mean?</text>
		{@render option(36, 58, 88, 'not')}
		{@render option(36, 74, 88, 'again')}
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
		font-weight: 600;
	}
	.tag {
		font-family: var(--sans);
		font-size: 5px;
		font-weight: 700;
		letter-spacing: 0.06em;
	}
	.note {
		font-family: var(--serif);
		font-size: 6px;
		font-style: italic;
		fill: var(--ink-soft);
	}
	.definition {
		font-family: var(--serif);
		font-size: 10px;
		font-style: italic;
	}
	.whole {
		font-family: var(--serif);
		font-weight: 600;
		letter-spacing: 0.04em;
	}
	.plus {
		font-family: var(--serif);
		font-size: 11px;
		fill: var(--muted);
	}
	.button {
		font-family: var(--sans);
		font-size: 8px;
		font-weight: 700;
		fill: var(--paper);
	}
	.ask {
		font-family: var(--sans);
		font-size: 7px;
		font-weight: 600;
		fill: var(--ink-soft);
	}
	.pill {
		font-family: var(--serif);
		font-size: 6.5px;
	}
</style>
