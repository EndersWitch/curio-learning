// An activity's settings, and how they travel as URL text in a shareable link.

import { MORPHEMES, STARTERS } from './content';

export type ActivityType = 'build' | 'break';
export type Feedback = 'now' | 'end';

export interface Settings {
	type: ActivityType;
	/** The Morpheme Bank: ids of the morphemes in play. */
	bank: string[];
	/** Build: label and colour tiles by type. Break: label each part with its type once cut, instead of asking. */
	showTypes: boolean;
	/** Break only: show each part's meaning once cut, instead of asking. Build tiles always show meanings. */
	showMeanings: boolean;
	/** Tell the student right or wrong as they go, or only once the word is finished. */
	feedback: Feedback;
	questionLimit: number; // 0 = off, else 1..1000
	timeLimitSec: number; // 0 = off, else 1..3600 (an hour)
}

export const TYPE_LABELS: Record<ActivityType, string> = { build: 'Build', break: 'Break' };

export const TYPE_ABOUT: Record<ActivityType, string> = {
	build: 'Read a definition and build the word from morphemes.',
	break: 'Cut a word into morphemes and work out what it means.'
};

/** A new activity of a type: the first starter's bank, types labelled, feedback as they go. */
export function defaultSettings(type: ActivityType): Settings {
	return {
		type,
		bank: [...STARTERS[0].morphemes],
		showTypes: true,
		showMeanings: false,
		feedback: 'now',
		questionLimit: 0,
		timeLimitSec: 0
	};
}

// A session ends early only when one of the limits is set.
export function isChallengeMode(s: Settings): boolean {
	return s.questionLimit > 0 || s.timeLimitSec > 0;
}

export const MAX_QUESTIONS = 1000;
export const MAX_SECONDS = 3600; // one hour

// "3 min 30 sec", "45 sec", "5 min".
export function formatDuration(totalSec: number): string {
	const min = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	if (!min) return `${sec} sec`;
	if (!sec) return `${min} min`;
	return `${min} min ${sec} sec`;
}

export function settingsToQuery(s: Settings): string {
	const p = new URLSearchParams();
	p.set('type', s.type);
	p.set('bank', s.bank.join(','));
	p.set('types', s.showTypes ? '1' : '0');
	if (s.type === 'break') p.set('meanings', s.showMeanings ? '1' : '0');
	p.set('fb', s.feedback);
	p.set('qlim', String(s.questionLimit));
	p.set('tsec', String(s.timeLimitSec));
	return p.toString();
}

/**
 * Read settings back out of a link. Anything missing or not understood falls
 * back to the default, so an old or hand-edited link shifts the activity but
 * never breaks it. Links made before activity types were named carry `mode`.
 */
export function settingsFromParams(params: URLSearchParams): Settings {
	const type: ActivityType =
		(params.get('type') ?? params.get('mode')) === 'break' ? 'break' : 'build';
	const d = defaultSettings(type);
	const bank = params.has('bank')
		? unique(csv(params.get('bank')).filter((id) => id in MORPHEMES))
		: d.bank;
	return {
		type,
		bank,
		showTypes: bool(params.get('types'), d.showTypes),
		showMeanings: type === 'break' && bool(params.get('meanings'), d.showMeanings),
		feedback: params.get('fb') === 'end' ? 'end' : 'now',
		questionLimit: clampCount(Number(params.get('qlim')), MAX_QUESTIONS),
		timeLimitSec: clampCount(Number(params.get('tsec')), MAX_SECONDS)
	};
}

function csv(v: string | null): string[] {
	return (v ?? '').split(',').filter(Boolean);
}
function unique(items: string[]): string[] {
	return [...new Set(items)];
}
function bool(v: string | null, fallback: boolean): boolean {
	if (v === '1') return true;
	if (v === '0') return false;
	return fallback;
}
function clampCount(n: number, max: number): number {
	if (!Number.isFinite(n) || n <= 0) return 0;
	return Math.min(max, Math.max(1, Math.round(n)));
}
