// The words, morphemes and starter activities the app ships with, and the
// questions you can ask about them.
//
// The content lives in three JSON files under ./content so it can grow without
// touching any code: a morpheme is written once in morphemes.json however many
// words use it, words.json says which morphemes make each word, and
// starters.json lists the activities every teacher's list begins with.
// `bun run check:content` checks all three.

import morphemeData from './content/morphemes.json';
import wordData from './content/words.json';
import starterData from './content/starters.json';

export type MorphemeType = 'prefix' | 'base' | 'suffix';

export const MORPHEME_TYPES: MorphemeType[] = ['prefix', 'base', 'suffix'];

export const TYPE_NAMES: Record<MorphemeType, string> = {
	prefix: 'Prefix',
	base: 'Base',
	suffix: 'Suffix'
};

export interface Morpheme {
	id: string;
	type: MorphemeType;
	spelling: string;
	/** Most morphemes have one meaning; a few, like un- (not / reverse of), have two. */
	meanings: string[];
	/** The historical word a base comes from, such as Latin rumpere for rupt. */
	root?: string;
	grade: GradeBand;
	origin: Origin;
	group: MeaningGroup;
}

// --- tags, for finding morphemes in the Morpheme Bank ---

export type GradeBand = '3-4' | '5-6' | '7-8';
export type Origin = 'english' | 'latin' | 'greek';
export type MeaningGroup =
	| 'not'
	| 'amount'
	| 'place'
	| 'time'
	| 'people'
	| 'describing'
	| 'feelings'
	| 'actions'
	| 'senses'
	| 'nature';

export const GRADE_NAMES: Record<GradeBand, string> = {
	'3-4': 'Grades 3–4',
	'5-6': 'Grades 5–6',
	'7-8': 'Grades 7–8'
};
// Words that came through French from Latin (agree, cover, safe) count as
// Latin: what a teacher means by "Latin" here is the word's deepest layer.
export const ORIGIN_NAMES: Record<Origin, string> = {
	english: 'English',
	latin: 'Latin',
	greek: 'Greek'
};
export const GROUP_NAMES: Record<MeaningGroup, string> = {
	not: 'Not & opposite',
	amount: 'Number & amount',
	place: 'Place & direction',
	time: 'Time & order',
	people: 'People & things',
	describing: 'Describing',
	feelings: 'Feelings',
	actions: 'Actions',
	senses: 'Seeing, hearing & saying',
	nature: 'Nature & science'
};

/** One morpheme in a word, as it is written there. */
export interface Part {
	/** The morpheme's id in morphemes.json. */
	m: string;
	/** How the morpheme is written in this word when a spelling change alters it (hope → hop in hoping). */
	as?: string;
	/** Which of the morpheme's meanings this word uses, when it has more than one. */
	meaning?: number;
}

export interface Word {
	word: string;
	grade: number;
	definition: string;
	parts: Part[];
}

/** A ready-made activity every teacher's list begins with. */
export interface Starter {
	id: string;
	name: string;
	type: 'build' | 'break';
	morphemes: string[];
}

type RawMorpheme = Omit<Morpheme, 'id'>;

export const MORPHEMES: Record<string, Morpheme> = Object.fromEntries(
	Object.entries(morphemeData as Record<string, RawMorpheme>).map(([id, m]) => [id, { id, ...m }])
);
export const WORDS: Word[] = wordData as Word[];
export const STARTERS: Starter[] = starterData as Starter[];

/** Every morpheme of one type, in the order morphemes.json lists them. */
export function morphemesOfType(type: MorphemeType): Morpheme[] {
	return Object.values(MORPHEMES).filter((m) => m.type === type);
}

export function morphemeOf(part: Part): Morpheme {
	return MORPHEMES[part.m];
}

/**
 * The other ways each morpheme is written in its words (mit as "miss" in
 * missionary, syn as "sym" in symmetry), so a teacher searching the Morpheme
 * Bank for either spelling finds it.
 */
export const OTHER_SPELLINGS: Record<string, string[]> = {};
for (const w of WORDS)
	for (const p of w.parts)
		if (p.as && !(OTHER_SPELLINGS[p.m] ??= []).includes(p.as)) OTHER_SPELLINGS[p.m].push(p.as);

/** The letters this part takes up in its word. */
export function writtenForm(part: Part): string {
	return part.as ?? MORPHEMES[part.m].spelling;
}

/** What this part means in this particular word. */
export function meaningOf(part: Part): string {
	return MORPHEMES[part.m].meanings[part.meaning ?? 0];
}

/**
 * The meaning a tile shows while building this word: the one the word uses,
 * when the morpheme has it, so -s in "reads" says what it does there. A wrong
 * tile that shares that meaning (-es) shows it too, so the meanings never give
 * away which spelling is right.
 */
export function meaningIn(m: Morpheme, word: Word): string {
	const used = new Set(word.parts.map(meaningOf));
	return m.meanings.find((meaning) => used.has(meaning)) ?? m.meanings[0];
}

/** A morpheme as students see it written on a tile: un-, kind, -ness. */
export function tileLabel(m: Morpheme, showType = true): string {
	if (!showType) return m.spelling;
	if (m.type === 'prefix') return `${m.spelling}-`;
	if (m.type === 'suffix') return `-${m.spelling}`;
	return m.spelling;
}

/** The words that can be built entirely from the morphemes in a bank. */
export function wordsFor(bank: string[]): Word[] {
	const inBank = new Set(bank);
	return WORDS.filter((w) => w.parts.every((p) => inBank.has(p.m)));
}

/**
 * A word to show off a bank with, in an activity's picture: the first one with
 * three parts if there is one, since that shows the most at a glance.
 */
export function sampleWord(bank: string[]): Word | undefined {
	const words = wordsFor(bank);
	return words.find((w) => w.parts.length === 3) ?? words[0];
}

// --- cutting a word into its parts ---

/** Where the word splits, as letter positions: un|kind|ness is [2, 6]. */
export function cutsOf(word: Word): number[] {
	const cuts: number[] = [];
	let at = 0;
	for (const part of word.parts.slice(0, -1)) {
		at += writtenForm(part).length;
		cuts.push(at);
	}
	return cuts;
}

/**
 * Whether a student's cuts split the word correctly. A doubled letter added by
 * a spelling change belongs on either side of the cut, so run|ning is as right
 * as runn|ing.
 */
export function cutsAreRight(word: Word, cuts: number[]): boolean {
	const want = cutsOf(word);
	const given = [...cuts].sort((a, b) => a - b);
	if (given.length !== want.length) return false;
	return want.every((cut, i) => given[i] === cut || given[i] === doubledAlternative(word, i));
}

/** The other place cut `i` may go, when a spelling change doubled the letter before it (run → runn). */
function doubledAlternative(word: Word, i: number): number | null {
	const part = word.parts[i];
	const spelling = MORPHEMES[part.m].spelling;
	const doubled = part.as === spelling + spelling.slice(-1);
	return doubled ? cutsOf(word)[i] - 1 : null;
}

/** The word written out with its cuts: un|kind|ness. */
export function showCuts(text: string, cuts: number[]): string {
	const sorted = [...cuts].sort((a, b) => a - b);
	let out = '';
	let from = 0;
	for (const cut of sorted) {
		out += text.slice(from, cut) + '|';
		from = cut;
	}
	return out + text.slice(from);
}

// --- choices for each question ---

export function shuffle<T>(items: T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}

/** How many wrong tiles each slot brings to the tray. */
const DECOYS_PER_SLOT = 2;

/**
 * The tiles offered for one Build question: the word's own morphemes plus two
 * wrong ones of the same type for each slot, taken from the bank. A wrong tile
 * is never one that would build another word with the same definition — that
 * answer would be right too.
 */
export function trayFor(word: Word, bank: string[]): string[] {
	const own = word.parts.map((p) => p.m);
	const chosen = new Set(own);
	for (const [i, part] of word.parts.entries()) {
		const type = MORPHEMES[part.m].type;
		const candidates = shuffle(
			bank.filter(
				(id) => !chosen.has(id) && MORPHEMES[id]?.type === type && !buildsSameWord(word, i, id)
			)
		);
		for (const id of candidates.slice(0, DECOYS_PER_SLOT)) chosen.add(id);
	}
	return shuffle([...chosen]);
}

function buildsSameWord(word: Word, slot: number, id: string): boolean {
	const ids = word.parts.map((p, i) => (i === slot ? id : p.m));
	return WORDS.some(
		(w) =>
			w.definition === word.definition &&
			w.parts.length === ids.length &&
			w.parts.every((p, i) => p.m === ids[i])
	);
}

/** How many answers a multiple-choice question offers, the right one included. */
const CHOICES = 4;

/**
 * Meanings to choose from for one part of a word. The wrong ones are other
 * morphemes' meanings of the same type, from the bank first. A morpheme's own
 * other meaning is never offered — telling un- "not" from un- "reverse of" is
 * a harder question than this one asks.
 */
export function meaningChoices(part: Part, bank: string[]): string[] {
	const right = meaningOf(part);
	const type = MORPHEMES[part.m].type;
	const own = new Set(MORPHEMES[part.m].meanings);
	const from = (ids: string[]) =>
		shuffle(
			ids
				.map((id) => MORPHEMES[id])
				.filter((m) => m && m.type === type && m.id !== part.m)
				.flatMap((m) => m.meanings)
				.filter((meaning) => !own.has(meaning))
		);
	const wrong = unique([...from(bank), ...from(Object.keys(MORPHEMES))]).slice(0, CHOICES - 1);
	return shuffle([right, ...wrong]);
}

/** Definitions to choose from for a whole word, the wrong ones from other words in the bank first. */
export function definitionChoices(word: Word, bank: string[]): string[] {
	const others = (list: Word[]) =>
		shuffle(list.filter((w) => w.word !== word.word).map((w) => w.definition));
	const wrong = unique([...others(wordsFor(bank)), ...others(WORDS)])
		.filter((d) => d !== word.definition)
		.slice(0, CHOICES - 1);
	return shuffle([word.definition, ...wrong]);
}

function unique(items: string[]): string[] {
	return [...new Set(items)];
}

// --- checking the content files ---

/**
 * Everything wrong with the content, as sentences a content writer can act on.
 * An empty list means the files are good to ship.
 */
export function contentProblems(): string[] {
	const problems: string[] = [];
	for (const m of Object.values(MORPHEMES)) {
		if (!MORPHEME_TYPES.includes(m.type))
			problems.push(`Morpheme "${m.id}" has an unknown type "${m.type}".`);
		if (!m.meanings.length) problems.push(`Morpheme "${m.id}" has no meaning.`);
		if (!(m.grade in GRADE_NAMES))
			problems.push(`Morpheme "${m.id}" needs a grade: 3-4, 5-6 or 7-8.`);
		if (!(m.origin in ORIGIN_NAMES))
			problems.push(`Morpheme "${m.id}" needs an origin: english, latin or greek.`);
		if (!(m.group in GROUP_NAMES))
			problems.push(
				`Morpheme "${m.id}" needs a meaning group: ${Object.keys(GROUP_NAMES).join(', ')}.`
			);
	}
	const seen = new Set<string>();
	for (const w of WORDS) {
		if (seen.has(w.word)) problems.push(`"${w.word}" is listed twice.`);
		seen.add(w.word);
		if (w.parts.length < 2) problems.push(`"${w.word}" needs at least two parts.`);
		const missing = w.parts.filter((p) => !MORPHEMES[p.m]);
		for (const p of missing)
			problems.push(`"${w.word}" uses "${p.m}", which is not in morphemes.json.`);
		if (missing.length) continue;
		const joined = w.parts.map(writtenForm).join('');
		if (joined !== w.word) problems.push(`"${w.word}": its parts join to "${joined}".`);
		for (const p of w.parts) {
			const count = MORPHEMES[p.m].meanings.length;
			if (p.meaning !== undefined && !(p.meaning >= 0 && p.meaning < count))
				problems.push(`"${w.word}": "${p.m}" has no meaning number ${p.meaning}.`);
			if (p.meaning === undefined && count > 1)
				problems.push(`"${w.word}": say which meaning of "${p.m}" it uses.`);
			if (p.as === MORPHEMES[p.m].spelling)
				problems.push(`"${w.word}": "${p.m}" is written as itself, so it needs no "as".`);
		}
	}
	for (const s of STARTERS) {
		for (const id of s.morphemes)
			if (!MORPHEMES[id])
				problems.push(`Starter "${s.id}" uses "${id}", which is not in morphemes.json.`);
		if (s.type !== 'build' && s.type !== 'break')
			problems.push(`Starter "${s.id}" needs a type: build or break.`);
		const count = wordsFor(s.morphemes).length;
		if (count < 5)
			problems.push(`Starter "${s.id}" only makes ${count} words; it needs at least 5.`);
	}
	return problems;
}
