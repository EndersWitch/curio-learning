<script lang="ts">
	// The student's view. With a question or time limit it runs ready → running
	// → done, and the clock starts only when they press Start. Without one it is
	// endless practice, and Finish ends it whenever they like. Either way it ends
	// on the Report, which the student can save as a PDF with their name on it.
	import { onDestroy, onMount, tick } from 'svelte';
	import BreakQuestion from './BreakQuestion.svelte';
	import BuildQuestion from './BuildQuestion.svelte';
	import { shuffle, wordsFor, type Word } from './content';
	import type { Miss } from './miss';
	import { formatDuration, isChallengeMode, TYPE_LABELS, type Settings } from './settings';

	let { settings, title = 'Morphology Mash' }: { settings: Settings; title?: string } = $props();

	const challenge = $derived(isChallengeMode(settings));
	const pool = $derived(wordsFor(settings.bank));

	// --- which word comes next ---
	//
	// A session starts by sweeping the pool: every word once, in a shuffled
	// order, so the student meets all of them rather than the same few. Then it
	// comes back to the words they missed on the way through. After that words
	// are drawn at random.
	let sweeping = true;
	let queue: Word[] = [];
	let missed: Word[] = [];

	function startSweep() {
		sweeping = true;
		queue = shuffle(pool);
		missed = [];
	}

	function nextWord(): Word {
		if (!queue.length && sweeping && missed.length) {
			queue = shuffle(missed);
			missed = [];
			sweeping = false;
		}
		if (queue.length) return queue.shift()!;
		sweeping = false;
		return pool[Math.floor(Math.random() * pool.length)];
	}

	function firstWord(): Word | null {
		return pool.length ? nextWord() : null;
	}

	// --- session state ---
	function initialPhase(): 'ready' | 'running' | 'done' {
		return isChallengeMode(settings) ? 'ready' : 'running';
	}
	startSweep();
	let phase = $state(initialPhase());
	let current = $state<Word | null>(firstWord());
	/** Counts up with every word, so each one gets a fresh question. */
	let asked = $state(0);
	let correct = $state(0);
	let completed = $state(0);
	let thisWordMissed = false;
	let startTime = Date.now();
	let elapsedMs = $state(0);

	/** How one word fared over the session, for the report at the end. */
	interface WordTally {
		word: string;
		asked: number;
		wrong: number;
		/** The wrong answers, the same slip counted once with a tally. */
		misses: (Miss & { times: number })[];
	}
	let tally = $state<Record<string, WordTally>>({});

	let ticker: ReturnType<typeof setInterval> | undefined;

	const percent = $derived(completed ? Math.round((correct / completed) * 100) : 0);
	const timeLimitMs = $derived(settings.timeLimitSec * 1000);
	const remainingMs = $derived(Math.max(0, timeLimitMs - elapsedMs));

	function start() {
		startSweep();
		correct = 0;
		completed = 0;
		tally = {};
		thisWordMissed = false;
		current = nextWord();
		asked += 1;
		startTime = Date.now();
		elapsedMs = 0;
		phase = 'running';
		clearInterval(ticker);
		ticker = setInterval(() => {
			elapsedMs = Date.now() - startTime;
			if (settings.timeLimitSec > 0 && elapsedMs >= timeLimitMs) finish();
		}, 250);
	}

	// Endless practice has no Start button, so its clock starts with the page.
	onMount(() => {
		if (phase === 'running' && current)
			ticker = setInterval(() => (elapsedMs = Date.now() - startTime), 250);
	});

	function recordMiss(miss: Miss) {
		if (!current) return;
		thisWordMissed = true;
		const entry = entryFor(current);
		const same = entry.misses.find(
			(m) => m.what === miss.what && m.gave === miss.gave && m.want === miss.want
		);
		if (same) same.times += 1;
		else entry.misses.push({ ...miss, times: 1 });
	}

	function entryFor(word: Word): WordTally {
		return (tally[word.word] ??= { word: word.word, asked: 0, wrong: 0, misses: [] });
	}

	// A word is finished: tally it and either move on or end the session.
	function wordDone() {
		if (!current || phase !== 'running') return;
		const entry = entryFor(current);
		entry.asked += 1;
		if (thisWordMissed) {
			entry.wrong += 1;
			// A word missed on the way through comes back once the sweep is done.
			if (sweeping) missed = [...missed, current];
		} else correct += 1;
		completed += 1;
		thisWordMissed = false;
		if (settings.questionLimit > 0 && completed >= settings.questionLimit) {
			finish();
			return;
		}
		current = nextWord();
		asked += 1;
	}

	function finish() {
		// A word left half-done still counts if something in it was missed, so
		// stopping early never hides a mistake from the report.
		if (phase === 'running' && current && thisWordMissed) {
			const entry = entryFor(current);
			entry.asked += 1;
			entry.wrong += 1;
			completed += 1;
			thisWordMissed = false;
		}
		clearInterval(ticker);
		elapsedMs = Date.now() - startTime;
		phase = 'done';
	}

	/** The words that went wrong, the ones missed most often first. */
	const report = $derived(
		Object.values(tally)
			.filter((w) => w.wrong > 0)
			.sort((a, b) => b.wrong - a.wrong || a.word.localeCompare(b.word))
	);

	// --- saving the report as a PDF ---
	//
	// The student types their name, then the browser's own print window opens,
	// where "Save as PDF" is one of the choices. The page's print styles hide
	// everything but the report.
	let saveDialog = $state<HTMLDialogElement>();
	let studentName = $state('');
	let finishedAt = $state(new Date());

	function openSaveDialog() {
		finishedAt = new Date();
		saveDialog?.showModal();
	}

	async function savePdf(event: SubmitEvent) {
		event.preventDefault();
		saveDialog?.close();
		// Wait for the name to appear on the page before it is printed.
		await tick();
		// Browsers suggest the page title as the file name.
		const pageTitle = document.title;
		document.title = `${studentName.trim()} - ${title} - ${finishedAt.toLocaleDateString()}`;
		window.print();
		document.title = pageTitle;
	}

	onDestroy(() => clearInterval(ticker));

	function formatTime(ms: number): string {
		const total = Math.round(ms / 1000);
		const m = Math.floor(total / 60);
		const s = total % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	// The settings in words, for the printed report.
	const settingsSummary = $derived(
		[
			`${TYPE_LABELS[settings.type]} activity`,
			`${pool.length} words in play`,
			settings.showTypes ? 'types shown' : 'types asked',
			settings.type === 'build' || settings.showMeanings ? 'meanings shown' : 'meanings asked',
			settings.feedback === 'now' ? 'feedback right away' : 'feedback at the end'
		].join(' · ')
	);
</script>

<div class="session">
	{#if !current}
		<div class="card">
			<h2>No words to practise</h2>
			<p class="sub">
				This link's Morpheme Bank cannot make any words. Ask your teacher for a new link.
			</p>
		</div>
	{:else if phase === 'ready'}
		<div class="card">
			<h2>Ready to start</h2>
			<p class="sub">
				{#if settings.questionLimit > 0 && settings.timeLimitSec > 0}
					{settings.questionLimit} words or {formatDuration(settings.timeLimitSec)}, whichever comes
					first.
				{:else if settings.questionLimit > 0}
					{settings.questionLimit} word{settings.questionLimit === 1 ? '' : 's'}.
				{:else}
					{formatDuration(settings.timeLimitSec)}.
				{/if}
			</p>
			<button type="button" class="btn-primary big" onclick={start}>Start</button>
		</div>
	{:else if phase === 'running'}
		<div class="statusbar">
			<div class="score">
				<strong>{correct}/{completed}</strong>
				<span class="pct">{percent}%</span>
			</div>
			<div class="progress">
				{#if settings.questionLimit > 0}
					<span
						>Word {Math.min(completed + 1, settings.questionLimit)} of {settings.questionLimit}</span
					>
				{/if}
				{#if settings.timeLimitSec > 0}
					<span class="clock">{formatTime(remainingMs)}</span>
				{/if}
				<!-- Endless practice ends when the student says so. It sits up here, beside
				     the score, so the whole session fits the window without scrolling. -->
				{#if !challenge}
					<button type="button" class="btn-ghost finish" onclick={finish}>Finish</button>
				{/if}
			</div>
		</div>

		<div class="question">
			{#key asked}
				{#if settings.type === 'build'}
					<BuildQuestion word={current} {settings} onmiss={recordMiss} ondone={wordDone} />
				{:else}
					<BreakQuestion word={current} {settings} onmiss={recordMiss} ondone={wordDone} />
				{/if}
			{/key}
		</div>
	{:else}
		<div class="card results print-area">
			<!-- Only on the saved PDF: who did it, what it was, and when. -->
			<div class="print-only">
				<p class="print-name">{studentName.trim()}</p>
				<p>{title}</p>
				<p>{finishedAt.toLocaleString()}</p>
				<p>{settingsSummary}</p>
			</div>
			<h2>{challenge ? 'Challenge complete' : 'Session complete'}</h2>
			<p class="bigscore">{correct}/{completed}</p>
			<p class="detail">
				{percent}% of words with no mistakes · {formatTime(elapsedMs)}
			</p>

			<!-- What the student struggled with, word by word, for the teacher. -->
			<section class="report">
				<h3>Words missed</h3>
				{#if !completed}
					<p class="clean">No words finished yet.</p>
				{:else if report.length}
					<ul class="misses">
						{#each report as w (w.word)}
							<li>
								<p class="missed-word">{w.word}</p>
								<p class="count">Missed {w.wrong} of {w.asked}</p>
								<ul class="diffs">
									{#each w.misses as m, i (i)}
										<li>
											<span class="what">{m.what}:</span>
											<span class="gave"><span class="mark">✗</span> {m.gave}</span>
											<span class="want"><span class="mark">✓</span> {m.want}</span>
											{#if m.times > 1}<span class="times">×{m.times}</span>{/if}
										</li>
									{/each}
								</ul>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="clean">Nothing missed — every word was right.</p>
				{/if}
			</section>

			<div class="result-actions no-print">
				<button type="button" class="btn-primary" onclick={start}>Start again</button>
				<button type="button" class="btn-ghost" onclick={openSaveDialog}>Save as PDF</button>
			</div>
		</div>

		<dialog bind:this={saveDialog} class="save-dialog no-print" aria-labelledby="save-title">
			<form onsubmit={savePdf}>
				<h3 id="save-title">Save your results</h3>
				<label>
					Your name
					<!-- svelte-ignore a11y_autofocus -->
					<input type="text" bind:value={studentName} required autocomplete="name" autofocus />
				</label>
				<p class="hint">
					Your browser's print window will open. Choose “Save as PDF” to keep a copy you can share
					with your teacher.
				</p>
				<div class="dialog-actions">
					<button type="button" class="btn-ghost" onclick={() => saveDialog?.close()}>Cancel</button
					>
					<button type="submit" class="btn-primary" disabled={!studentName.trim()}
						>Save as PDF</button
					>
				</div>
			</form>
		</dialog>
	{/if}
</div>

<style>
	.session {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		width: 100%;
		max-width: 52rem;
		margin: 0 auto;
	}
	.card {
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 1.5rem 1.25rem;
		box-shadow: 0 1px 2px rgb(51 42 36 / 0.06);
	}
	.card h2 {
		font-size: 1.6rem;
		font-weight: 700;
		text-align: center;
	}
	.sub {
		margin: 0.35rem 0 1.25rem;
		color: var(--muted);
		text-align: center;
	}
	.card:not(.question) > .btn-primary {
		display: flex;
		margin: 0 auto;
	}
	.big {
		font-size: 1.05rem;
		padding: 0.8rem 2rem;
	}
	.statusbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.9rem;
	}
	.score strong {
		font-size: 1.15rem;
	}
	.pct {
		margin-left: 0.5rem;
		color: var(--accent);
		font-weight: 700;
	}
	.progress {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		color: var(--muted);
		font-weight: 600;
	}
	.clock {
		font-variant-numeric: tabular-nums;
		background: var(--accent-wash);
		color: var(--accent-dark);
		padding: 0.1rem 0.5rem;
		border-radius: 6px;
	}
	.finish {
		padding: 0.4rem 0.8rem;
		font-size: 0.85rem;
	}
	.result-actions,
	.dialog-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
	}
	.results {
		text-align: center;
	}
	.bigscore {
		margin: 0.5rem 0 0.25rem;
		font-family: var(--serif);
		font-size: 2.75rem;
		font-weight: 700;
	}
	.detail {
		margin-bottom: 1.25rem;
		color: var(--muted);
	}
	/* The report reads as a list of words rather than more score: quieter than
	   the total above it, and left-aligned so the words line up. */
	.report {
		margin-bottom: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--line);
		text-align: left;
	}
	.report h3 {
		margin-bottom: 0.6rem;
		font-size: 1.05rem;
		font-weight: 600;
	}
	.misses {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		list-style: none;
	}
	.misses > li {
		padding: 0.6rem 0.85rem;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--paper-low);
	}
	.missed-word {
		font-family: var(--serif);
		font-size: 1.2rem;
		font-weight: 600;
	}
	.count {
		margin-bottom: 0.25rem;
		color: var(--bad);
		font-size: 0.8rem;
		font-weight: 700;
	}
	.diffs {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		list-style: none;
	}
	.diffs li {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		font-size: 0.85rem;
	}
	.what {
		font-weight: 700;
	}
	.gave {
		color: var(--bad);
	}
	.want {
		color: var(--good);
		font-weight: 700;
	}
	/* The tick and cross carry the same meaning as the colours, for anyone who
	   cannot tell the two colours apart. */
	.mark {
		font-weight: 700;
	}
	.times,
	.clean {
		color: var(--muted);
	}
	.clean {
		font-size: 0.9rem;
	}
	.print-only {
		display: none;
		margin-bottom: 1rem;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.print-name {
		color: var(--ink);
		font-family: var(--serif);
		font-size: 1.3rem;
		font-weight: 700;
	}
	@media print {
		.print-only {
			display: block;
		}
		.results {
			border: none;
			box-shadow: none;
		}
		/* Keep each missed word whole rather than split across two pages. */
		.misses > li {
			break-inside: avoid;
		}
	}
	.save-dialog {
		margin: auto;
		width: min(24rem, calc(100% - 2rem));
		border: none;
		border-radius: var(--radius);
		padding: 1.5rem;
		background: var(--paper);
		color: var(--ink);
		box-shadow: 0 10px 40px rgb(51 42 36 / 0.25);
	}
	.save-dialog::backdrop {
		background: rgb(51 42 36 / 0.4);
	}
	.save-dialog h3 {
		margin-bottom: 1rem;
		font-size: 1.25rem;
		font-weight: 600;
	}
	.save-dialog label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.save-dialog input {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: #fff;
		font-size: 1rem;
		font-weight: 400;
	}
	.save-dialog input:focus {
		outline: 2px solid var(--accent);
		border-color: var(--accent);
	}
	.hint {
		margin: 0.75rem 0 1.25rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
