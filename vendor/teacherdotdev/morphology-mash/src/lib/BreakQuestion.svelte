<script lang="ts">
	// One Break question: the student cuts a word into its morphemes, then says
	// what each one is — its type, then its meaning — and finally what the whole
	// word means. Types and meanings the teacher has chosen to show are on the
	// tiles from the start and not asked.
	//
	// The cuts are always checked before moving on, since every later question
	// is about the parts they make. After that, feedback "now" marks each answer
	// as it is given and lets the student try again; feedback "at the end" takes
	// every answer without comment and goes over them once the word is done.
	import { onDestroy } from 'svelte';
	import Tile from './Tile.svelte';
	import {
		cutsAreRight,
		cutsOf,
		definitionChoices,
		meaningChoices,
		meaningOf,
		MORPHEMES,
		MORPHEME_TYPES,
		showCuts,
		TYPE_NAMES,
		type MorphemeType,
		type Word
	} from './content';
	import { CORRECT_MS, type Miss } from './miss';
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

	type Step =
		| { kind: 'cut' }
		| { kind: 'type'; part: number }
		| { kind: 'meaning'; part: number }
		| { kind: 'whole' };

	/** The questions that follow the cuts, in the order they are asked. */
	function laterSteps(): Step[] {
		const steps: Step[] = [];
		for (const i of word.parts.keys()) {
			if (!settings.showTypes) steps.push({ kind: 'type', part: i });
			if (!settings.showMeanings) steps.push({ kind: 'meaning', part: i });
		}
		steps.push({ kind: 'whole' });
		return steps;
	}

	// Choices are drawn once per question, so they do not reshuffle mid-word.
	function drawMeanings(): string[][] {
		return word.parts.map((p) => meaningChoices(p, settings.bank));
	}
	function drawDefinitions(): string[] {
		return definitionChoices(word, settings.bank);
	}

	const now = $derived(settings.feedback === 'now');
	const steps: Step[] = [{ kind: 'cut' }, ...laterSteps()];
	const meaningOptions = drawMeanings();
	const definitionOptions = drawDefinitions();

	let at = $state(0);
	const step = $derived(steps[at] ?? null);
	let cuts = $state<number[]>([]);
	let cutDone = $state(false);
	/** Answers given, for the summary at the end: one per question asked. */
	let answers = $state<{ what: string; gave: string; want: string; ok: boolean }[]>([]);
	let wrongKeys = $state<string[]>([]);
	let message = $state('');
	let clean = $state(true);
	let finished = $state(false);

	let timer: ReturnType<typeof setTimeout> | undefined;
	onDestroy(() => clearTimeout(timer));

	// --- the word, as the student has cut it ---

	const letters = $derived([...word.word]);
	const segments = $derived.by(() => {
		const sorted = [...cuts].sort((a, b) => a - b);
		const out: string[] = [];
		let from = 0;
		for (const cut of [...sorted, word.word.length]) {
			out.push(word.word.slice(from, cut));
			from = cut;
		}
		return out;
	});

	function toggleCut(position: number) {
		if (cutDone) return;
		cuts = cuts.includes(position) ? cuts.filter((c) => c !== position) : [...cuts, position];
		message = '';
	}

	function checkCuts() {
		if (!cuts.length) return;
		if (cutsAreRight(word, cuts)) {
			cutDone = true;
			message = now ? 'Yes — those are the parts.' : '';
			next();
			return;
		}
		clean = false;
		onmiss({
			what: 'Cuts',
			gave: showCuts(word.word, cuts),
			want: showCuts(word.word, cutsOf(word))
		});
		if (now) {
			message = 'Not quite — look again for the prefix, base and suffix.';
			return;
		}
		// Every later question is about the parts, so they have to be the right
		// ones: show where the word splits and carry on from there.
		cuts = cutsOf(word);
		cutDone = true;
		message = 'Here is where it splits.';
		next();
	}

	// --- the questions about each part ---

	const choices = $derived.by((): { key: string; label: string }[] => {
		if (!step || step.kind === 'cut') return [];
		if (step.kind === 'type') return MORPHEME_TYPES.map((t) => ({ key: t, label: TYPE_NAMES[t] }));
		if (step.kind === 'meaning')
			return meaningOptions[step.part].map((m) => ({ key: m, label: m }));
		return definitionOptions.map((d) => ({ key: d, label: d }));
	});

	const rightKey = $derived.by(() => {
		if (!step || step.kind === 'cut') return '';
		if (step.kind === 'type') return MORPHEMES[word.parts[step.part].m].type;
		if (step.kind === 'meaning') return meaningOf(word.parts[step.part]);
		return word.definition;
	});

	const prompt = $derived.by(() => {
		if (!step || step.kind === 'cut') return 'Cut the word into its morphemes';
		if (step.kind === 'type') return `What type of morpheme is “${segments[step.part]}”?`;
		if (step.kind === 'meaning')
			return `What does “${segments[step.part]}” mean in “${word.word}”?`;
		return `What does “${word.word}” mean?`;
	});

	function stepName(s: Step): string {
		if (s.kind === 'type') return `Type of ${segments[s.part]}`;
		if (s.kind === 'meaning') return `Meaning of ${segments[s.part]}`;
		return 'Whole word';
	}

	function choose(key: string) {
		if (!step || step.kind === 'cut' || finished || wrongKeys.includes(key)) return;
		const ok = key === rightKey;
		const gave = labelFor(key);
		const want = labelFor(rightKey);
		if (!ok) {
			clean = false;
			onmiss({ what: stepName(step), gave, want });
		}
		if (now && !ok) {
			wrongKeys = [...wrongKeys, key];
			message = 'Not quite — try again.';
			return;
		}
		answers = [...answers, { what: stepName(step), gave, want, ok }];
		message = now ? 'Yes!' : '';
		next();
	}

	function labelFor(key: string): string {
		return step?.kind === 'type' ? TYPE_NAMES[key as MorphemeType] : key;
	}

	function next() {
		wrongKeys = [];
		at += 1;
		if (at >= steps.length) finish();
	}

	function finish() {
		finished = true;
		message = '';
		if (clean) timer = setTimeout(ondone, CORRECT_MS);
	}

	// --- what each tile shows so far ---

	/** Whether the student has been told this part's type yet. */
	function typeShown(i: number): boolean {
		return settings.showTypes || finished || (now && passed('type', i));
	}
	function meaningShown(i: number): boolean {
		return settings.showMeanings || finished || (now && passed('meaning', i));
	}
	function passed(kind: 'type' | 'meaning', i: number): boolean {
		const index = steps.findIndex((s) => s.kind === kind && 'part' in s && s.part === i);
		return index !== -1 && index < at;
	}
	/** Once a part has been identified, show the morpheme its letters stand for: hop → hope. */
	function trueForm(i: number): string | null {
		const spelling = MORPHEMES[word.parts[i].m].spelling;
		if (segments[i] === spelling) return null;
		const identified = finished || (typeShown(i) && meaningShown(i));
		return identified ? spelling : null;
	}
</script>

<div class="break">
	<!-- The sheet of paper: the word, then its parts, then what happened. -->
	<div class="sheet">
		<p class="ask">{finished ? 'How it breaks down' : prompt}</p>

		<div class="work">
			{#if !cutDone}
				<!-- The word with a gap between every pair of letters; pressing a gap
				     cuts the word there, and pressing it again joins it back up. -->
				<div class="word" role="group" aria-label="Cut {word.word}">
					{#each letters as letter, i (i)}
						<span class="letter">{letter}</span>
						{#if i < letters.length - 1}
							<button
								type="button"
								class="gap"
								class:cut={cuts.includes(i + 1)}
								aria-pressed={cuts.includes(i + 1)}
								aria-label="Cut after {word.word.slice(0, i + 1)}"
								onclick={() => toggleCut(i + 1)}
							>
								<span class="knife" aria-hidden="true"></span>
							</button>
						{/if}
					{/each}
				</div>
			{:else}
				<ol class="parts" aria-label="Parts of {word.word}">
					{#each word.parts as p, i (i)}
						<li class:current={step && 'part' in step && step.part === i}>
							<Tile
								morpheme={MORPHEMES[p.m]}
								text={segments[i]}
								meaning={meaningOf(p)}
								showType={typeShown(i)}
								showMeaning={meaningShown(i)}
								root={finished}
							/>
							<!-- Always holds its line, so revealing a true form moves nothing. -->
							<span class="true-form">{trueForm(i) ? `${segments[i]} → ${trueForm(i)}` : ''}</span>
						</li>
						{#if i < word.parts.length - 1}<li class="plus" aria-hidden="true">+</li>{/if}
					{/each}
				</ol>
			{/if}
		</div>

		<!-- A fixed-height line for whatever there is to say. -->
		<div class="status" aria-live="polite">
			{#if finished}
				<p class="verdict" class:good={clean} class:bad={!clean && !now}>
					{clean ? 'Correct!' : now ? 'You got there, with a retry' : 'Not quite'}
				</p>
				<p class="definition"><strong>{word.word}</strong>: {word.definition}</p>
			{:else}
				<p class:good={message.startsWith('Yes')} class:bad={message.startsWith('Not')}>
					{message}
				</p>
			{/if}
		</div>
	</div>

	<!-- The answers, in a space that keeps its height from one question to the next. -->
	<div class="answers">
		{#if !cutDone}
			<p class="hint">Tap between two letters to cut there. Tap again to join them back.</p>
			<button type="button" class="btn-primary" disabled={!cuts.length} onclick={checkCuts}>
				Check cuts
			</button>
		{:else if !finished}
			<div class="choices" class:long={step?.kind !== 'type'}>
				{#each choices as c (c.key)}
					<button
						type="button"
						class="choice"
						class:wrong={wrongKeys.includes(c.key)}
						disabled={wrongKeys.includes(c.key)}
						onclick={() => choose(c.key)}
					>
						{c.label}
					</button>
				{/each}
			</div>
		{:else}
			{#if !now && answers.length}
				<!-- Going over the answers once the word is done. -->
				<ul class="summary">
					{#each answers as a, i (i)}
						<li class:ok={a.ok}>
							<span class="mark">{a.ok ? '✓' : '✗'}</span>
							<span class="what">{a.what}:</span>
							<span>{a.gave}</span>
							{#if !a.ok}<span class="want">— it was {a.want}</span>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if !clean}
				<button type="button" class="btn-primary" onclick={ondone}>Next word</button>
			{/if}
		{/if}
	</div>
</div>

<style>
	.break {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
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
		height: 1.5rem;
		color: var(--ink-soft);
		font-weight: 600;
		text-align: center;
	}
	/* Tall enough for the word or for its tiles, so cutting the word moves nothing below. */
	.work {
		display: grid;
		place-items: center;
		height: 8rem;
		margin-top: 0.75rem;
	}
	.word {
		display: flex;
		align-items: stretch;
		height: 4.5rem;
	}
	.letter {
		font-family: var(--serif);
		font-size: 3rem;
		line-height: 1.4;
	}
	.gap {
		display: grid;
		place-items: center;
		width: 1.1rem;
		margin: 0 -0.1rem;
		padding: 0;
		border: none;
		border-radius: 4px;
		background: none;
		cursor: pointer;
	}
	.gap:hover,
	.gap:focus-visible {
		background: var(--accent-wash);
	}
	.knife {
		width: 3px;
		height: 75%;
		border-radius: 2px;
		background: transparent;
	}
	.gap:hover .knife {
		background: var(--line-strong);
	}
	.gap.cut .knife {
		background: var(--accent);
	}
	.parts {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: 0.4rem;
		list-style: none;
	}
	.parts li {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.35rem;
		padding: 4px;
		border-radius: 13px;
	}
	.parts li.current {
		box-shadow: 0 0 0 3px var(--accent);
	}
	.plus {
		align-self: center;
		padding-bottom: 1.5rem;
		font-family: var(--serif);
		font-size: 1.5rem;
		color: var(--muted);
	}
	.true-form {
		height: 1.1rem;
		font-family: var(--serif);
		font-size: 0.85rem;
		color: var(--muted);
	}
	.status {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 4rem;
		font-weight: 600;
		text-align: center;
	}
	.verdict {
		font-family: var(--serif);
		font-size: 1.3rem;
	}
	.definition {
		font-family: var(--serif);
		font-weight: 400;
	}
	.good {
		color: var(--good);
	}
	.bad {
		color: var(--bad);
	}
	/* Room for four answers, whatever is being asked. */
	.answers {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.75rem;
		min-height: calc(4 * 3.1rem + 3 * 0.5rem);
	}
	.hint {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.choices {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		width: 100%;
	}
	/* Meanings and definitions are phrases, so they get a line each. */
	.choices.long {
		grid-template-columns: 1fr;
	}
	.choice {
		min-height: 3.1rem;
		padding: 0.6rem 1rem;
		border: 1.5px solid var(--line-strong);
		border-radius: 10px;
		background: var(--paper);
		color: var(--ink);
		font-family: var(--serif);
		font-size: 1.05rem;
		text-align: center;
		box-shadow: 0 2px 0 rgb(51 42 36 / 0.1);
		cursor: pointer;
	}
	.choice:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--accent-wash);
	}
	.choice.wrong {
		border-color: var(--bad-line);
		background: var(--bad-wash);
		color: var(--bad);
		text-decoration: line-through;
		box-shadow: none;
		cursor: default;
	}
	.summary {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--paper);
		list-style: none;
		font-size: 0.9rem;
	}
	.summary li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		color: var(--bad);
	}
	.summary li.ok {
		color: var(--good);
	}
	.summary .what {
		font-weight: 700;
	}
	.summary .want {
		color: var(--good);
		font-weight: 600;
	}
	.mark {
		font-weight: 700;
	}
</style>
