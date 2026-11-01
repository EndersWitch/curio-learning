// "What's changed": news a teacher is told once, in a big window over
// whatever teacher page they open next. Only teachers who were using
// Morphology Mash before the change see it; a first visit counts every piece
// of news as already seen. Students never see it.
//
// Which news this browser has seen is kept on the teacher's own machine, like
// their activities. The Help pop-up can show every piece of news again.
//
// Add new news at the end of `NEWS`.

import type { NewsArtKind } from './NewsArt.svelte';

export interface News {
	id: string;
	/** Heads this news when it's shown along with older news the teacher hasn't seen. */
	title: string;
	items: { title: string; text: string; art: NewsArtKind }[];
}

export const NEWS: News[] = [
	{
		id: '2026-10-teacher-morphemes',
		title: 'Morphemes you asked for',
		items: [
			{
				title: '35 new morphemes and 255 new words',
				text: 'You emailed us the morphemes your classes study, and we added them: prefixes like fore-, ad-, mal-, circum- and ob-; bases like jur (law), bene (good), fact (make), strict, stat, sist and terra; and the words of a community and migration unit. Find them in any activity’s Morpheme Bank.',
				art: 'new-morphemes'
			},
			{
				title: 'Three new starter activities',
				text: 'Your activity list now has a starter for each: Prefixes: fore-, ad-, mal-, circum-, ob-; Latin bases: law, judging, good, make, draw tight; and Unit words: community, migration & citizenship. Edit or delete them like any other.',
				art: 'new-starters'
			},
			{
				title: 'Search finds every spelling',
				text: 'Some morphemes change their spelling from word to word: mit is written miss in mission, ceive is capt in capture. Searching the Morpheme Bank for either spelling now finds it.',
				art: 'search-spellings'
			}
		]
	}
];

const SEEN_KEY = 'morphmash:seen-news';

export const news = $state<{ shown: News[] }>({ shown: [] });

/** Show any news this browser hasn't seen, newest first. */
export function showUnseenNews() {
	const seen = seenIds();
	news.shown = NEWS.filter((n) => !seen.includes(n.id)).reverse();
}

/** Show every piece of news, seen or not, newest first. */
export function showAllNews() {
	news.shown = [...NEWS].reverse();
}

/** Closing the window in any way counts as having seen what it showed. */
export function closeNews() {
	markSeen(news.shown.map((n) => n.id));
	news.shown = [];
}

/** On a first visit there's nothing new to a teacher: everything so far counts as seen. */
export function markAllNewsSeen() {
	markSeen(NEWS.map((n) => n.id));
}

function markSeen(ids: string[]) {
	const seen = seenIds();
	write([...seen, ...ids.filter((id) => !seen.includes(id))]);
}

// Storage can be unavailable on a locked-down school device. Then every visit
// looks like a first one, so no news is shown at all.
function seenIds(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]');
		return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
	} catch {
		return [];
	}
}

function write(ids: string[]) {
	try {
		localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
	} catch {
		// Nothing useful to do.
	}
}
