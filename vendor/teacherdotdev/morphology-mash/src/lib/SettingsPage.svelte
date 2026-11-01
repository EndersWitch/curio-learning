<script lang="ts">
	// The Activity settings page. Build and Break ask different things of the
	// student, so each has its own settings; only the session limits are shared.
	// Every choice is a pair of picture cards showing what the student will see.
	import Picture, { type PictureKind } from './Picture.svelte';
	import { MAX_QUESTIONS, MAX_SECONDS, TYPE_LABELS, type Settings } from './settings';

	let { settings = $bindable() }: { settings: Settings } = $props();

	interface Choice {
		value: boolean;
		picture: PictureKind;
		title: string;
		caption: string;
	}
	interface Setting {
		key: 'showTypes' | 'showMeanings' | 'feedbackNow';
		name: string;
		choices: [Choice, Choice];
	}

	const BUILD: Setting[] = [
		{
			key: 'showTypes',
			name: 'Morpheme types',
			choices: [
				{
					value: true,
					picture: 'types-labelled',
					title: 'Labelled',
					caption:
						'Tiles are coloured and named by type, and each blank says which type goes there.'
				},
				{
					value: false,
					picture: 'types-plain',
					title: 'Plain',
					caption: 'Every tile looks the same, so students work out where each piece goes.'
				}
			]
		},
		{
			key: 'feedbackNow',
			name: 'Feedback',
			choices: [
				{
					value: true,
					picture: 'feedback-now',
					title: 'Right away',
					caption: 'A piece that fits stays; a wrong one bounces back to try again.'
				},
				{
					value: false,
					picture: 'feedback-end',
					title: 'At the end',
					caption: 'Students fill every blank, then press Check to see what was right.'
				}
			]
		}
	];

	const BREAK: Setting[] = [
		{
			key: 'showTypes',
			name: 'After cutting: types',
			choices: [
				{
					value: false,
					picture: 'cut-types-asked',
					title: 'Ask',
					caption: 'Students say whether each part is a prefix, base or suffix.'
				},
				{
					value: true,
					picture: 'cut-types-shown',
					title: 'Show',
					caption: 'Each part is labelled with its type as soon as the word is cut.'
				}
			]
		},
		{
			key: 'showMeanings',
			name: 'After cutting: meanings',
			choices: [
				{
					value: false,
					picture: 'cut-meanings-asked',
					title: 'Ask',
					caption: 'Students choose what each part means.'
				},
				{
					value: true,
					picture: 'cut-meanings-shown',
					title: 'Show',
					caption: 'Each part shows its meaning, leaving only the whole word to work out.'
				}
			]
		},
		{
			key: 'feedbackNow',
			name: 'Feedback',
			choices: [
				{
					value: true,
					picture: 'feedback-now',
					title: 'Right away',
					caption: 'Each answer is marked as it is given, and a wrong one can be tried again.'
				},
				{
					value: false,
					picture: 'feedback-end',
					title: 'At the end',
					caption: 'Students answer everything about a word, then see what was right.'
				}
			]
		}
	];

	const sections = $derived(settings.type === 'build' ? BUILD : BREAK);

	function current(key: Setting['key']): boolean {
		if (key === 'feedbackNow') return settings.feedback === 'now';
		return settings[key];
	}

	function choose(key: Setting['key'], value: boolean) {
		if (key === 'feedbackNow') settings.feedback = value ? 'now' : 'end';
		else settings[key] = value;
	}

	// --- session limits: both optional, a blank box means "no limit" ---

	const MAX_MINUTES = MAX_SECONDS / 60;
	const limitMinutes = $derived(Math.floor(settings.timeLimitSec / 60));
	const limitSeconds = $derived(settings.timeLimitSec % 60);

	// Minutes and seconds are two boxes over one stored value, so each edit keeps
	// the other half and re-clamps the total to at most an hour.
	function setTimeLimit(minutes: number, seconds: number) {
		settings.timeLimitSec = Math.min(MAX_SECONDS, Math.max(0, minutes * 60 + seconds));
	}
	function clamp(value: string, max: number): number {
		const n = Math.round(Number(value));
		if (!Number.isFinite(n) || n <= 0) return 0;
		return Math.min(max, n);
	}
</script>

<div class="settings">
	<header>
		<h1>Activity settings</h1>
		<p class="lede">
			{settings.type === 'build'
				? 'How students build each word. Every tile always shows what its morpheme means.'
				: 'What students do once they have cut a word into its parts.'}
		</p>
	</header>

	{#each sections as section (section.key)}
		<fieldset>
			<legend>{section.name}</legend>
			<div class="choices">
				{#each section.choices as choice (choice.title)}
					{@const on = current(section.key) === choice.value}
					<label class="choice" class:on>
						<input
							type="radio"
							name="{settings.type}-{section.key}"
							checked={on}
							onchange={() => choose(section.key, choice.value)}
						/>
						<span class="picture"><Picture kind={choice.picture} label="" /></span>
						<span class="title">{choice.title}</span>
						<span class="caption">{choice.caption}</span>
					</label>
				{/each}
			</div>
		</fieldset>
	{/each}

	<fieldset>
		<legend>Session</legend>
		<p class="hint">
			With no limits, students practise for as long as they like and press Finish for their report.
			Leave a box empty for no limit.
		</p>
		<div class="limits">
			<label class="limit">
				<span>Words</span>
				<input
					type="number"
					min="1"
					max={MAX_QUESTIONS}
					step="1"
					placeholder="No limit"
					value={settings.questionLimit || ''}
					oninput={(e) => (settings.questionLimit = clamp(e.currentTarget.value, MAX_QUESTIONS))}
				/>
			</label>
			<div class="limit" role="group" aria-label="Time limit">
				<span>Time limit</span>
				<div class="timerow">
					<span class="timebox">
						<input
							type="number"
							min="0"
							max={MAX_MINUTES}
							step="1"
							placeholder="0"
							aria-label="Time limit minutes"
							value={limitMinutes || ''}
							oninput={(e) => setTimeLimit(clamp(e.currentTarget.value, MAX_MINUTES), limitSeconds)}
						/>
						<span class="unit">min</span>
					</span>
					<span class="timebox">
						<input
							type="number"
							min="0"
							max="59"
							step="1"
							placeholder="0"
							aria-label="Time limit seconds"
							value={limitSeconds || ''}
							oninput={(e) => setTimeLimit(limitMinutes, clamp(e.currentTarget.value, 59))}
						/>
						<span class="unit">sec</span>
					</span>
				</div>
			</div>
		</div>
	</fieldset>

	<p class="type-note">
		This is a {TYPE_LABELS[settings.type]} activity. To make a {settings.type === 'build'
			? 'Break'
			: 'Build'} activity, go back to your activities and choose New activity.
	</p>
</div>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		max-width: 52rem;
	}
	h1 {
		font-size: 1.9rem;
		font-weight: 700;
	}
	.lede {
		margin-top: 0.25rem;
		color: var(--muted);
		font-size: 0.92rem;
	}
	fieldset {
		margin: 0;
		padding: 1rem;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--paper);
	}
	/* Floated so the heading sits inside the box rather than on its border. */
	legend {
		float: left;
		width: 100%;
		margin-bottom: 0.75rem;
		font-family: var(--serif);
		font-size: 1.15rem;
		font-weight: 600;
	}
	.choices {
		clear: both;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.9rem;
	}
	/* Picture on the left, what it means on the right. */
	.choice {
		position: relative;
		display: grid;
		grid-template-columns: 11rem 1fr;
		grid-template-rows: auto 1fr;
		column-gap: 0.75rem;
		align-items: start;
		padding: 0.55rem;
		border: 2px solid var(--line);
		border-radius: 12px;
		background: var(--paper-low);
		cursor: pointer;
	}
	.choice:hover {
		border-color: var(--line-strong);
	}
	.choice.on {
		border-color: var(--accent);
		background: var(--accent-wash);
	}
	.choice:has(input:focus-visible) {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
	/* The card is the control; the radio stays for keyboards and screen readers. */
	.choice input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	.picture {
		display: block;
		grid-row: 1 / 3;
		overflow: hidden;
		border-radius: 8px;
	}
	.title {
		margin-top: 0.1rem;
		font-family: var(--serif);
		font-size: 1.05rem;
		font-weight: 700;
	}
	.caption {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
	.hint {
		clear: both;
		margin-bottom: 0.75rem;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.limits {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
	}
	.limit {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.9rem;
	}
	.limit > span {
		font-weight: 600;
	}
	.timerow {
		display: flex;
		gap: 0.5rem;
	}
	.timebox {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	.unit {
		color: var(--muted);
		font-size: 0.85rem;
	}
	.limit input {
		width: 6rem;
		padding: 0.45rem 0.55rem;
		border: 1px solid var(--line-strong);
		border-radius: 8px;
		background: #fff;
		font: inherit;
		font-weight: 600;
	}
	.limit input:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
	.type-note {
		color: var(--muted);
		font-size: 0.82rem;
	}
	@media (max-width: 60rem) {
		.choices {
			grid-template-columns: 1fr;
		}
	}
</style>
