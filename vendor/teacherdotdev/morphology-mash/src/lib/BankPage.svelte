<script lang="ts">
	// One of the Morpheme Bank's three lists — prefixes, bases or suffixes — with
	// a slim toolbar over it, the way a Notion table has one: search as you type,
	// filters added one at a time as removable pills, and a sort. Search, filters
	// and sort stay put when switching between the three lists. A bar along the
	// bottom keeps the whole bank's result in view — how many words it makes —
	// since that is what decides whether the activity works at all.
	import { ArrowUpDown, Flag, ListFilter, Plus, Search, X } from '@lucide/svelte';
	import {
		GRADE_NAMES,
		GROUP_NAMES,
		MORPHEMES,
		morphemesOfType,
		ORIGIN_NAMES,
		OTHER_SPELLINGS,
		tileLabel,
		wordsFor,
		type Morpheme,
		type MorphemeType,
		type Word
	} from './content';
	import Popover from './Popover.svelte';
	import type { Settings } from './settings';

	let { settings = $bindable(), type }: { settings: Settings; type: MorphemeType } = $props();

	const HEADINGS: Record<MorphemeType, string> = {
		prefix: 'Prefixes',
		base: 'Bases (roots)',
		suffix: 'Suffixes'
	};
	const MIN_WORDS = 5;

	// --- filters: each is one property and the values picked for it ---

	type Property = 'grade' | 'origin' | 'group' | 'bank';
	interface Filter {
		property: Property;
		values: string[];
	}

	const IN_BANK: Record<string, string> = { in: 'In the bank', out: 'Not in the bank' };
	const PROPERTIES: Record<Property, { name: string; values: Record<string, string> }> = {
		grade: { name: 'Grade band', values: GRADE_NAMES },
		origin: { name: 'Origin', values: ORIGIN_NAMES },
		group: { name: 'Meaning group', values: GROUP_NAMES },
		bank: { name: 'In bank', values: IN_BANK }
	};

	let query = $state('');
	let filters = $state<Filter[]>([]);
	/** Which pill's choices are open, by index. */
	let openPill = $state<number | null>(null);
	let adding = $state(false);

	const unused = $derived(
		(Object.keys(PROPERTIES) as Property[]).filter((p) => !filters.some((f) => f.property === p))
	);

	function addFilter(property: Property) {
		// Take the index first: the new filter lands at the end.
		const index = filters.length;
		filters = [...filters, { property, values: [] }];
		adding = false;
		openPill = index;
	}

	function toggleValue(i: number, value: string) {
		const f = filters[i];
		f.values = f.values.includes(value)
			? f.values.filter((v) => v !== value)
			: [...f.values, value];
	}

	function removeFilter(i: number) {
		filters = filters.filter((_, j) => j !== i);
		openPill = null;
	}

	/** "Grade band: 5–6, 7–8", or just the property while nothing is picked. */
	function describe(f: Filter): string {
		const { name, values } = PROPERTIES[f.property];
		if (!f.values.length) return name;
		return `${name}: ${f.values.map((v) => values[v].replace('Grades ', '')).join(', ')}`;
	}

	function valueOf(m: Morpheme, property: Property): string {
		if (property === 'bank') return settings.bank.includes(m.id) ? 'in' : 'out';
		return m[property];
	}

	/** Matches the search, and every filter with something picked. */
	function shown(m: Morpheme): boolean {
		const q = query.trim().toLowerCase().replace(/^-|-$/g, '');
		const matches =
			!q ||
			m.spelling.includes(q) ||
			(OTHER_SPELLINGS[m.id] ?? []).some((spelling) => spelling.startsWith(q)) ||
			m.meanings.some((meaning) => meaning.toLowerCase().includes(q)) ||
			(m.root ?? '').toLowerCase().includes(q);
		return (
			matches && filters.every((f) => !f.values.length || f.values.includes(valueOf(m, f.property)))
		);
	}

	// --- sorting ---

	type Sort = 'az' | 'grade' | 'origin' | 'selected';
	const SORTS: Record<Sort, string> = {
		az: 'A–Z',
		grade: 'Grade band',
		origin: 'Origin',
		selected: 'Ticked first'
	};
	let sort = $state<Sort>('az');
	let sorting = $state(false);

	const ORIGIN_ORDER = Object.keys(ORIGIN_NAMES);

	function compare(a: Morpheme, b: Morpheme): number {
		const byName = a.spelling.localeCompare(b.spelling);
		if (sort === 'grade') return a.grade.localeCompare(b.grade) || byName;
		if (sort === 'origin')
			return ORIGIN_ORDER.indexOf(a.origin) - ORIGIN_ORDER.indexOf(b.origin) || byName;
		if (sort === 'selected')
			return Number(settings.bank.includes(b.id)) - Number(settings.bank.includes(a.id)) || byName;
		return byName;
	}

	const all = $derived(morphemesOfType(type));
	const visible = $derived(all.filter(shown).sort(compare));
	const tickedHere = $derived(all.filter((m) => settings.bank.includes(m.id)).length);
	const tickedShown = $derived(visible.filter((m) => settings.bank.includes(m.id)).length);

	// --- choosing ---

	function toggle(id: string) {
		settings.bank = settings.bank.includes(id)
			? settings.bank.filter((x) => x !== id)
			: [...settings.bank, id];
	}

	// Shift-click ticks (or clears) every row between the last one clicked and
	// this one, the way a file list or a spreadsheet does. The last row clicked
	// is remembered by id, so it still means the same row after a sort or filter.
	let anchor: string | null = null;
	let shiftHeld = false;

	function noteShift(event: MouseEvent) {
		shiftHeld = event.shiftKey;
		// Without this a shift-click also selects the text between the rows.
		if (event.shiftKey) event.preventDefault();
	}

	function pick(id: string) {
		const from = anchor === null ? -1 : visible.findIndex((m) => m.id === anchor);
		const to = visible.findIndex((m) => m.id === id);
		if (shiftHeld && from !== -1 && to !== -1) {
			const ids = visible.slice(Math.min(from, to), Math.max(from, to) + 1).map((m) => m.id);
			const rest = settings.bank.filter((x) => !ids.includes(x));
			// The row clicked decides: ticking it ticks the range, clearing it clears it.
			settings.bank = settings.bank.includes(id) ? rest : [...rest, ...ids];
		} else toggle(id);
		anchor = id;
		shiftHeld = false;
	}

	function setShown(on: boolean) {
		const ids = visible.map((m) => m.id);
		const rest = settings.bank.filter((id) => !ids.includes(id));
		settings.bank = on ? [...rest, ...ids] : rest;
	}

	const words = $derived(wordsFor(settings.bank));
	let showWords = $state(false);

	// Asking for a missing morpheme: the search they tried goes in the email, so
	// we know what they were looking for.
	const CONTACT = 'support@teacher.dev';

	// Reporting a mistake: the entry itself goes in the email, so whoever reads
	// it sees exactly what the teacher saw.
	function reportLink(subject: string, body: string): string {
		return `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	}
	function reportMorpheme(m: Morpheme): string {
		return reportLink(
			`Morphology Mash: problem with ${tileLabel(m)}`,
			`${tileLabel(m)} (${m.type}): ${m.meanings.join('; ')}\n` +
				`${GRADE_NAMES[m.grade]} · ${ORIGIN_NAMES[m.origin]} · ${GROUP_NAMES[m.group]}` +
				(m.root ? `\nFrom ${m.root}` : '') +
				`\n\nWhat's wrong:\n`
		);
	}
	function reportWord(w: Word): string {
		return reportLink(
			`Morphology Mash: problem with “${w.word}”`,
			`${w.word}: ${w.definition}\n` +
				`Parts: ${w.parts.map((p) => MORPHEMES[p.m].spelling).join(' + ')}\n\nWhat's wrong:\n`
		);
	}

	const requestLink = $derived(
		`mailto:${CONTACT}?subject=${encodeURIComponent(
			`Morphology Mash: please add ${query.trim() ? `“${query.trim()}”` : `a ${type}`}`
		)}`
	);
</script>

<div class="bank {type}">
	<div class="main">
		<header>
			<p class="eyebrow">Morpheme Bank</p>
			<h1>{HEADINGS[type]}</h1>
			<p class="lede">
				Students only see words made entirely from ticked morphemes — so a base needs the prefixes
				and suffixes its words use, too.
			</p>
		</header>

		<div class="toolbar">
			<label class="search">
				<Search size={15} />
				<input
					type="search"
					placeholder="Search spelling or meaning — try “carry”"
					bind:value={query}
					aria-label="Search {HEADINGS[type].toLowerCase()}"
				/>
			</label>

			<Popover bind:open={adding} minWidth={200}>
				{#snippet trigger({ toggle })}
					<button
						type="button"
						class="tool"
						class:on={filters.length}
						onclick={toggle}
						disabled={!unused.length}><ListFilter size={15} /> Filter</button
					>
				{/snippet}
				<div class="options">
					{#each unused as p (p)}
						<button type="button" class="pick" onclick={() => addFilter(p)}
							>{PROPERTIES[p].name}</button
						>
					{/each}
				</div>
			</Popover>

			<Popover bind:open={sorting} minWidth={180}>
				{#snippet trigger({ toggle })}
					<button type="button" class="tool" class:on={sort !== 'az'} onclick={toggle}
						><ArrowUpDown size={15} /> Sort{sort === 'az' ? '' : `: ${SORTS[sort]}`}</button
					>
				{/snippet}
				{#snippet children({ close })}
					<div class="options">
						{#each Object.entries(SORTS) as [id, name] (id)}
							<label class="option">
								<input
									type="radio"
									name="sort"
									checked={sort === id}
									onchange={() => {
										sort = id as Sort;
										close();
									}}
								/>
								{name}
							</label>
						{/each}
					</div>
				{/snippet}
			</Popover>
		</div>

		{#if filters.length}
			<!-- Each filter is a pill: press it to change its choices or remove it. -->
			<div class="pills">
				{#each filters as f, i (f.property)}
					<Popover
						bind:open={() => openPill === i, (v) => (openPill = v ? i : null)}
						minWidth={210}
					>
						{#snippet trigger({ toggle })}
							<button type="button" class="pill" class:empty={!f.values.length} onclick={toggle}
								>{describe(f)}</button
							>
						{/snippet}
						<div class="options">
							{#each Object.entries(PROPERTIES[f.property].values) as [value, name] (value)}
								<label class="option">
									<input
										type="checkbox"
										checked={f.values.includes(value)}
										onchange={() => toggleValue(i, value)}
									/>
									{name}
								</label>
							{/each}
						</div>
						<button type="button" class="remove" onclick={() => removeFilter(i)}
							><X size={14} /> Remove filter</button
						>
					</Popover>
				{/each}
				{#if unused.length}
					<Popover bind:open={adding} minWidth={200}>
						{#snippet trigger({ toggle })}
							<button type="button" class="pill add" onclick={toggle}><Plus size={13} /> Add</button
							>
						{/snippet}
						<div class="options">
							{#each unused as p (p)}
								<button type="button" class="pick" onclick={() => addFilter(p)}
									>{PROPERTIES[p].name}</button
								>
							{/each}
						</div>
					</Popover>
				{/if}
				<button
					type="button"
					class="textbtn"
					onclick={() => {
						filters = [];
						openPill = null;
					}}>Clear filters</button
				>
			</div>
		{/if}

		<div class="list-head">
			<span
				>{visible.length} shown · {tickedHere} of {all.length} ticked
				<span class="tip">· Shift-click to tick a range</span></span
			>
			<span class="bulk">
				<button
					type="button"
					class="textbtn"
					disabled={tickedShown === visible.length}
					onclick={() => setShown(true)}>Select all shown</button
				>
				<button
					type="button"
					class="textbtn"
					disabled={!tickedShown}
					onclick={() => setShown(false)}>Clear shown</button
				>
			</span>
		</div>

		<ul class="list">
			{#each visible as m (m.id)}
				<li class:on={settings.bank.includes(m.id)}>
					<!-- The mouse-down only notes whether Shift is held; the checkbox
					     itself stays the control, and Shift+Space on it does the same. -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<label class="row" onmousedown={noteShift}>
						<input
							type="checkbox"
							checked={settings.bank.includes(m.id)}
							onkeydown={(e) => (shiftHeld = e.shiftKey)}
							onchange={() => pick(m.id)}
						/>
						<span class="spelling">{tileLabel(m)}</span>
						<span class="meaning">{m.meanings.join('; ')}</span>
						<span class="tags"
							>{m.grade.replace('-', '–')} · {ORIGIN_NAMES[m.origin]} · {GROUP_NAMES[m.group]}</span
						>
					</label>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- an email link, not a page -->
					<a
						href={reportMorpheme(m)}
						class="report"
						title="Report a problem with {tileLabel(m)}"
						aria-label="Report a problem with {tileLabel(m)}"><Flag size={14} /></a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{:else}
				<li class="none">No {HEADINGS[type].toLowerCase()} match.</li>
			{/each}
		</ul>

		<p class="request">
			Can't find the morpheme you're looking for?
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- an email link, not a page -->
			<a href={requestLink}>Email us</a> and we'll add it.
		</p>

		<!-- On narrow screens: stays at the bottom of the window while the list
	     scrolls under it. Wide screens show the words in the side panel instead. -->
		<div class="summary" class:low={words.length < MIN_WORDS}>
			{#if showWords && words.length}
				<p class="wordlist">{words.map((w) => w.word).join(', ')}</p>
			{/if}
			<div class="summary-row">
				<p>
					<strong>{settings.bank.length}</strong> morphemes ·
					<strong>{words.length}</strong> word{words.length === 1 ? '' : 's'}
					{#if words.length < MIN_WORDS}
						<span>— students need at least {MIN_WORDS}. Tick more morphemes.</span>
					{/if}
				</p>
				{#if words.length}
					<button type="button" class="textbtn" onclick={() => (showWords = !showWords)}
						>{showWords ? 'Hide the words' : 'See the words'}</button
					>
				{/if}
			</div>
		</div>
	</div>

	<!-- Every word the bank makes, kept in view beside the list so ticking a
	     morpheme shows straight away what it adds. -->
	<aside class="preview" class:low={words.length < MIN_WORDS} aria-label="Words in this bank">
		<p class="preview-head">
			<strong>{words.length}</strong> word{words.length === 1 ? '' : 's'}
			<span>from {settings.bank.length} morphemes</span>
		</p>
		{#if words.length < MIN_WORDS}
			<p class="preview-warn">Students need at least {MIN_WORDS}. Tick more morphemes.</p>
		{/if}
		<ul class="preview-words">
			{#each words as w (w.word)}
				<li>
					<span class="preview-word">{w.word}</span>
					<span class="preview-def">{w.definition}</span>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- an email link, not a page -->
					<a
						href={reportWord(w)}
						class="report"
						title="Report a problem with “{w.word}”"
						aria-label="Report a problem with {w.word}"><Flag size={13} /></a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ul>
	</aside>
</div>

<style>
	.bank {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
		max-width: 52rem;
	}
	.main {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}
	/* Room for the words beside the list: the panel sits on the right, and the
	   bar along the bottom has nothing left to say. */
	.preview {
		display: none;
	}
	@media (min-width: 72rem) {
		.bank {
			grid-template-columns: minmax(0, 1fr) 15rem;
			max-width: 70rem;
		}
		.summary {
			display: none;
		}
		.preview {
			position: sticky;
			top: 0;
			display: flex;
			flex-direction: column;
			align-self: start;
			max-height: calc(100vh - 3rem);
			border: 1px solid var(--line);
			border-radius: 10px;
			background: var(--paper);
		}
	}
	.preview-head {
		padding: 0.7rem 0.9rem 0.5rem;
		border-bottom: 1px solid var(--line);
		color: var(--good);
		font-size: 0.9rem;
	}
	.preview-head span {
		color: var(--muted);
		font-size: 0.8rem;
	}
	.preview.low .preview-head {
		color: #6b4a00;
	}
	.preview-warn {
		padding: 0.5rem 0.9rem;
		background: var(--amber);
		color: #6b4a00;
		font-size: 0.8rem;
	}
	.preview-words {
		overflow-y: auto;
		list-style: none;
	}
	.preview-words li {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 0.35rem 2rem 0.35rem 0.9rem;
		border-bottom: 1px solid var(--line);
	}
	.preview-words li:hover {
		background: var(--paper-low);
	}
	.preview-word {
		font-family: var(--serif);
		font-size: 0.92rem;
		font-weight: 600;
	}
	.preview-def {
		color: var(--muted);
		font-family: var(--serif);
		font-size: 0.78rem;
		font-style: italic;
		line-height: 1.3;
	}
	/* A quiet flag on every row, shown on hover or focus, for a teacher who
	   spots a meaning or definition that isn't right. */
	.report {
		position: absolute;
		top: 50%;
		right: 0.4rem;
		display: grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 5px;
		color: var(--muted);
		opacity: 0;
		transform: translateY(-50%);
	}
	li:hover > .report,
	.report:focus-visible {
		opacity: 1;
	}
	.report:hover {
		background: var(--paper);
		color: var(--bad);
	}
	.preview-words li:last-child {
		border-bottom: none;
	}
	.request {
		padding: 0 0.5rem;
		color: var(--muted);
		font-size: 0.82rem;
	}
	.request a {
		color: var(--accent);
		font-weight: 600;
	}
	.eyebrow {
		color: var(--muted);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	h1 {
		font-size: 1.9rem;
		font-weight: 700;
	}
	.prefix h1 {
		color: var(--prefix-ink);
	}
	.base h1 {
		color: var(--base-ink);
	}
	.suffix h1 {
		color: var(--suffix-ink);
	}
	.lede {
		margin-top: 0.2rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	/* --- the toolbar: search, then Filter and Sort --- */
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--line);
	}
	.search {
		display: flex;
		flex: 1 1 14rem;
		align-items: center;
		gap: 0.4rem;
		padding: 0 0.55rem;
		border: 1px solid var(--line);
		border-radius: 7px;
		background: #fff;
		color: var(--muted);
	}
	.search:focus-within {
		border-color: var(--accent);
	}
	.search input {
		flex: 1;
		min-width: 0;
		padding: 0.42rem 0;
		border: none;
		outline: none;
		background: none;
		color: var(--ink);
		font-size: 0.9rem;
	}
	.tool {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.38rem 0.6rem;
		border: none;
		border-radius: 6px;
		background: none;
		color: var(--muted);
		font-size: 0.86rem;
		font-weight: 600;
		cursor: pointer;
	}
	.tool:hover:not(:disabled) {
		background: var(--paper-low);
		color: var(--ink);
	}
	.tool.on {
		color: var(--accent-dark);
	}
	.tool:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.pills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.22rem 0.65rem;
		border: 1px solid transparent;
		border-radius: 999px;
		background: var(--accent-wash);
		color: var(--accent-dark);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}
	/* A filter with nothing picked yet narrows nothing, and says so. */
	.pill.empty {
		background: var(--amber);
		color: #6b4a00;
	}
	.pill.add {
		border: 1px dashed var(--line-strong);
		background: none;
		color: var(--muted);
	}
	.options {
		display: flex;
		flex-direction: column;
		max-height: 260px;
		overflow: auto;
	}
	.option,
	.pick {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.38rem 0.5rem;
		border: none;
		border-radius: 5px;
		background: none;
		color: var(--ink);
		font-size: 0.86rem;
		text-align: left;
		cursor: pointer;
	}
	.option:hover,
	.pick:hover {
		background: var(--paper-low);
	}
	.option input {
		accent-color: var(--accent);
	}
	.remove {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		width: 100%;
		margin-top: 0.25rem;
		padding: 0.5rem;
		border: none;
		border-top: 1px solid var(--line);
		background: none;
		color: var(--bad);
		font-size: 0.85rem;
		cursor: pointer;
	}
	.textbtn {
		padding: 0.15rem 0.25rem;
		border: none;
		background: none;
		color: var(--accent);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}
	.textbtn:hover:not(:disabled) {
		text-decoration: underline;
	}
	.textbtn:disabled {
		color: var(--line-strong);
		cursor: default;
	}

	/* --- the list: dense rows, one morpheme each --- */
	.list-head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 0.75rem;
		padding: 0 0.5rem;
		color: var(--muted);
		font-size: 0.8rem;
	}
	.tip {
		color: var(--line-strong);
	}
	.list {
		border-top: 1px solid var(--line);
		list-style: none;
	}
	.list li {
		position: relative;
		border-bottom: 1px solid var(--line);
	}
	.row {
		display: grid;
		grid-template-columns: auto minmax(4.5rem, auto) minmax(0, 1fr) auto;
		align-items: baseline;
		gap: 0.65rem;
		padding: 0.4rem 2.2rem 0.4rem 0.5rem;
		cursor: pointer;
	}
	/* Clearly darker than the page, ticked or not, so the row under the pointer
	   is never in doubt. */
	.list li:hover {
		background: var(--line);
	}
	.list li.on:hover {
		box-shadow: inset 3px 0 0 var(--accent);
		filter: brightness(0.95);
	}
	.row input {
		align-self: center;
		accent-color: var(--accent);
	}
	.prefix li.on {
		background: var(--prefix-wash);
	}
	.base li.on {
		background: var(--base-wash);
	}
	.suffix li.on {
		background: var(--suffix-wash);
	}
	.spelling {
		font-family: var(--serif);
		font-size: 1rem;
		font-weight: 600;
	}
	.meaning {
		overflow: hidden;
		color: var(--ink-soft);
		font-family: var(--serif);
		font-size: 0.88rem;
		font-style: italic;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tags {
		color: var(--muted);
		font-size: 0.74rem;
		white-space: nowrap;
	}
	.list li.none {
		border-bottom: none;
	}
	.none {
		padding: 0.5rem;
		color: var(--muted);
		font-size: 0.88rem;
	}

	.summary {
		position: sticky;
		bottom: 0;
		z-index: 2;
		margin-top: 0.5rem;
		padding: 0.65rem 0.9rem;
		border: 1px solid var(--good-line);
		border-radius: 10px;
		background: var(--good-wash);
		color: var(--good);
		font-size: 0.9rem;
		box-shadow: 0 -6px 18px rgb(51 42 36 / 0.08);
	}
	.summary.low {
		border-color: var(--amber-border);
		background: var(--amber);
		color: #6b4a00;
	}
	.summary-row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.summary .textbtn {
		color: inherit;
	}
	.wordlist {
		max-height: 8rem;
		overflow-y: auto;
		margin-bottom: 0.5rem;
		color: var(--ink-soft);
		font-family: var(--serif);
		line-height: 1.5;
	}

	/* On a phone the tags move under the meaning rather than crowd the row. */
	@media (max-width: 40rem) {
		.row {
			grid-template-columns: auto minmax(3.5rem, auto) minmax(0, 1fr);
		}
		.tags {
			grid-column: 3;
		}
	}
</style>
