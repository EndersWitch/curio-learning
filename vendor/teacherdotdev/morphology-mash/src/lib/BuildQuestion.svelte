<script lang="ts">
	// One Build question: the student reads a definition and puts the word
	// together from the tray, one morpheme per slot. Tiles can be dragged, or
	// tapped and then placed by tapping a slot — which also works on a touch
	// screen and from the keyboard.
	//
	// With feedback "now", each tile is checked as it lands: a right one stays,
	// a wrong one bounces back. With feedback "at the end", the student fills
	// every slot, rearranging as they like, and then presses Check.
	import { onDestroy } from 'svelte';
	import Tile from './Tile.svelte';
	import {
		MORPHEMES,
		TYPE_NAMES,
		meaningIn,
		tileLabel,
		trayFor,
		writtenForm,
		type Word
	} from './content';
	import { BOUNCE_MS, CORRECT_MS, type Miss } from './miss';
	import type { Settings } from './settings';

	let {
		word,
		settings,
		onmiss,
		ondone
	}: {
		word: Word;
		settings: Settings;
		onmiss: (miss: Miss) => void;
		ondone: () => void;
	} = $props();

	const now = $derived(settings.feedback === 'now');
	const want = $derived(word.parts.map((p) => p.m));

	function makeTray(): string[] {
		return trayFor(word, settings.bank);
	}
	function emptySlots(): (string | null)[] {
		return word.parts.map(() => null);
	}
	function emptyMarks(): ('right' | 'wrong' | null)[] {
		return word.parts.map(() => null);
	}

	const tray = makeTray();
	let slots = $state(emptySlots());
	let marks = $state(emptyMarks());
	let selected = $state<string | null>(null);
	let finished = $state(false);
	let clean = $state(true);
	let message = $state('');

	let timer: ReturnType<typeof setTimeout> | undefined;
	let bounceTimer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => {
		clearTimeout(timer);
		clearTimeout(bounceTimer);
	});

	const allFilled = $derived(slots.every((s) => s !== null));
	const label = (id: string) => tileLabel(MORPHEMES[id]);

	function pickTile(id: string) {
		if (finished) return;
		selected = selected === id ? null : id;
	}

	function pressSlot(i: number) {
		if (finished || marks[i] === 'right') return;
		if (selected) place(selected, i);
		// Tapping a filled slot hands its tile back, so a student can change
		// their mind before checking.
		else if (!now && slots[i]) slots[i] = null;
	}

	function place(id: string, i: number) {
		selected = null;
		if (finished || marks[i] === 'right' || marks[i] === 'wrong') return;
		if (now) placeAndCheck(id, i);
		else {
			// A tile can only be in one slot at a time.
			slots = slots.map((s, j) => (j === i ? id : s === id ? null : s));
		}
	}

	function placeAndCheck(id: string, i: number) {
		slots[i] = id;
		if (id === want[i]) {
			marks[i] = 'right';
			if (marks.every((m) => m === 'right')) finish();
			else message = 'Yes — that piece fits.';
			return;
		}
		marks[i] = 'wrong';
		clean = false;
		message = 'Not quite — try another piece.';
		onmiss({ what: `Piece ${i + 1}`, gave: label(id), want: label(want[i]) });
		bounceTimer = setTimeout(() => {
			slots[i] = null;
			marks[i] = null;
		}, BOUNCE_MS);
	}

	function check() {
		if (!allFilled || finished) return;
		marks = slots.map((s, i) => (s === want[i] ? 'right' : 'wrong'));
		for (const [i, s] of slots.entries()) {
			if (s !== want[i]) onmiss({ what: `Piece ${i + 1}`, gave: label(s!), want: label(want[i]) });
		}
		clean = marks.every((m) => m === 'right');
		finish();
	}

	function finish() {
		finished = true;
		message = '';
		if (clean) timer = setTimeout(ondone, CORRECT_MS);
	}

	// --- dragging ---
	function dragStart(event: DragEvent, id: string) {
		event.dataTransfer?.setData('text/plain', id);
		selected = id;
	}
	function drop(event: DragEvent, i: number) {
		event.preventDefault();
		const id = event.dataTransfer?.getData('text/plain');
		if (id && tray.includes(id)) place(id, i);
	}

	// The spelling changes this word makes, to point out once it is built.
	const changes = $derived(
		word.parts.filter((p) => p.as).map((p) => `${MORPHEMES[p.m].spelling} → ${writtenForm(p)}`)
	);
</script>

<div class="build">
	<!-- The sheet of paper: the definition, the blanks, and what happened. -->
	<div class="sheet">
		<p class="ask">Build the word that means</p>
		<p class="definition">“{word.definition}”</p>

		<ol class="slots" aria-label="Blanks">
			{#each word.parts as part, i (i)}
				<li>
					<!-- Always takes its line, labelled or not, so the blanks sit at the same height either way. -->
					<span class="slot-type"
						>{settings.showTypes ? TYPE_NAMES[MORPHEMES[part.m].type] : ''}</span
					>
					<button
						type="button"
						class="slot"
						class:filled={slots[i]}
						class:right={marks[i] === 'right' && (now || finished)}
						class:wrong={marks[i] === 'wrong'}
						class:target={selected && !slots[i]}
						aria-label={slots[i] ? `Blank ${i + 1}: ${label(slots[i]!)}` : `Blank ${i + 1}, empty`}
						disabled={finished}
						onclick={() => pressSlot(i)}
						ondragover={(e) => e.preventDefault()}
						ondrop={(e) => drop(e, i)}
					>
						{#if slots[i]}
							<Tile
								morpheme={MORPHEMES[slots[i]!]}
								meaning={meaningIn(MORPHEMES[slots[i]!], word)}
								showType={settings.showTypes}
								showMeaning
							/>
						{/if}
					</button>
				</li>
				{#if i < word.parts.length - 1}<li class="plus" aria-hidden="true">+</li>{/if}
			{/each}
		</ol>

		<!-- A fixed-height line for whatever there is to say, so nothing above or below it moves. -->
		<div class="status" aria-live="polite">
			{#if finished}
				<p class="verdict" class:good={clean} class:bad={!clean && !now}>
					<!-- With feedback as they go, the student did finish the word; it took
					     another try, which is what the report counts. -->
					{clean ? 'Correct!' : now ? 'You got there, with a retry' : 'Not quite'}
				</p>
				<p class="equation">
					{#each word.parts as part, i (i)}
						<span>{tileLabel(MORPHEMES[part.m])}</span>
						{#if i < word.parts.length - 1}<span class="op">+</span>{/if}
					{/each}
					<span class="op">→</span>
					<strong>{word.word}</strong>
					{#if changes.length}<span class="changes">({changes.join(', ')})</span>{/if}
				</p>
			{:else}
				<p class:bad={message.startsWith('Not')} class:good={message.startsWith('Yes')}>
					{message}
				</p>
			{/if}
		</div>
	</div>

	<!-- The tray. A tile that leaves keeps its place as an empty dip, so the
	     others never slide around. -->
	<div class="tray" class:done={finished} aria-label="Morpheme tray">
		{#each tray as id (id)}
			{#if slots.includes(id) || finished}
				<span class="dip" aria-hidden="true"></span>
			{:else}
				<button
					type="button"
					class="tray-tile"
					class:selected={selected === id}
					aria-pressed={selected === id}
					draggable="true"
					ondragstart={(e) => dragStart(e, id)}
					onclick={() => pickTile(id)}
				>
					<Tile
						morpheme={MORPHEMES[id]}
						meaning={meaningIn(MORPHEMES[id], word)}
						showType={settings.showTypes}
						showMeaning
					/>
				</button>
			{/if}
		{/each}
	</div>

	<div class="bar">
		{#if finished}
			{#if !clean}
				<button type="button" class="btn-primary" onclick={ondone}>Next word</button>
			{/if}
		{:else}
			<p class="hint">
				{selected
					? 'Now tap a blank to put it there.'
					: 'Drag a piece onto a blank, or tap a piece and then a blank.'}
			</p>
			{#if !now}
				<button type="button" class="btn-primary" disabled={!allFilled} onclick={check}
					>Check</button
				>
			{/if}
		{/if}
	</div>
</div>

<style>
	.build {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	/* Lined paper with a margin rule, the way a worksheet looks. */
	.sheet {
		padding: 1.5rem 1.25rem 0.75rem 3.5rem;
		border: 1px solid var(--line);
		border-radius: 6px;
		background-color: var(--paper);
		background-image:
			linear-gradient(
				to right,
				transparent 2.4rem,
				var(--accent-line) 2.4rem,
				var(--accent-line) calc(2.4rem + 1.5px),
				transparent calc(2.4rem + 1.5px)
			),
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(2rem - 1px),
				#ebe0cf calc(2rem - 1px),
				#ebe0cf 2rem
			);
		box-shadow:
			0 1px 2px rgb(51 42 36 / 0.08),
			0 12px 28px rgb(51 42 36 / 0.1);
	}
	.ask {
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 600;
		text-align: center;
	}
	.definition {
		min-height: 2.2rem;
		margin-top: 0.2rem;
		font-family: var(--serif);
		font-size: 1.55rem;
		line-height: 1.3;
		text-align: center;
	}
	.slots {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.25rem;
		list-style: none;
	}
	.slots li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.3rem;
	}
	.slot-type {
		height: 0.9rem;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.plus {
		align-self: center;
		padding-top: 1.2rem;
		font-family: var(--serif);
		font-size: 1.5rem;
		color: var(--muted);
	}
	/* A blank is exactly a tile's size plus its border, so a tile drops in without anything moving. */
	.slot {
		display: grid;
		place-items: center;
		width: calc(7.5rem + 10px);
		height: calc(5rem + 10px);
		padding: 0;
		border: 2px dashed var(--line-strong);
		border-radius: 12px;
		background: rgb(242 230 216 / 0.7);
		cursor: pointer;
	}
	.slot.filled {
		border-style: solid;
		border-color: transparent;
		background: transparent;
	}
	.slot.target {
		border-color: var(--accent);
		background: var(--accent-wash);
	}
	.slot.right {
		border-color: var(--good);
		background: var(--good-wash);
	}
	.slot.wrong {
		border-color: var(--bad);
		background: var(--bad-wash);
		animation: shake 0.3s;
	}
	.slot:disabled {
		cursor: default;
	}
	@keyframes shake {
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}
	.status {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 4.5rem;
		margin-top: 0.5rem;
		font-weight: 600;
		text-align: center;
	}
	.verdict {
		font-family: var(--serif);
		font-size: 1.3rem;
	}
	.equation {
		font-family: var(--serif);
		font-size: 1.1rem;
		font-weight: 400;
	}
	.equation .op {
		margin: 0 0.35rem;
		color: var(--muted);
	}
	.changes {
		margin-left: 0.4rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.good {
		color: var(--good);
	}
	.bad {
		color: var(--bad);
	}
	/* The tray under the paper: recessed, like the pencil groove on a desk. Its
	   height is set for two rows of tiles, whatever is in it. */
	.tray {
		display: flex;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
		gap: 0.75rem;
		min-height: calc(2 * 5rem + 0.75rem + 1.6rem);
		padding: 0.8rem;
		border-radius: 18px;
		background: #e9dccb;
		box-shadow:
			inset 0 3px 8px rgb(51 42 36 / 0.16),
			inset 0 -1px 0 rgb(255 255 255 / 0.5);
	}
	.tray.done {
		opacity: 0.55;
	}
	.dip {
		width: 7.5rem;
		height: 5rem;
		border-radius: 9px;
		background: rgb(51 42 36 / 0.05);
	}
	.tray-tile {
		padding: 0;
		border: none;
		border-radius: 9px;
		background: none;
		cursor: grab;
	}
	/* Picking a tile up lifts it off the tray. */
	.tray-tile:hover :global(.tile) {
		transform: translateY(-3px);
		box-shadow:
			0 5px 0 rgb(51 42 36 / 0.14),
			0 8px 16px rgb(51 42 36 / 0.14);
	}
	.tray-tile.selected :global(.tile) {
		transform: translateY(-6px);
		border-color: var(--accent);
		box-shadow:
			0 8px 0 rgb(51 42 36 / 0.12),
			0 14px 22px rgb(51 42 36 / 0.18);
	}
	.tray-tile:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 3px;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		height: 2.75rem;
	}
	.hint {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
