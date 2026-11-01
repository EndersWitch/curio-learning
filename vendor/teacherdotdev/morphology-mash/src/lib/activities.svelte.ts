// The teacher's activities, kept on their own machine.
//
// Nothing leaves the browser. Each activity's settings are stored in the same
// compact form the shareable link uses, so anything read back is validated by
// exactly the code that validates a link — a stale or hand-edited entry can
// shift an activity, never break it. Every change is saved as it happens;
// there is no Save button.
//
// The first visit fills the list with the starter activities. A flag records
// that it happened, so a starter the teacher deletes stays deleted.

import { STARTERS } from './content';
import { markAllNewsSeen, showUnseenNews } from './news.svelte';
import {
	defaultSettings,
	settingsFromParams,
	settingsToQuery,
	TYPE_LABELS,
	type ActivityType,
	type Settings
} from './settings';

const LIST_KEY = 'morphmash:activities';
const SEEDED_KEY = 'morphmash:seeded';
const QR_OPEN_KEY = 'morphmash:qropen';

export interface Activity {
	id: string;
	name: string;
	settings: Settings;
	/** When it was last changed, for ordering the list. */
	savedAt: number;
	/** The student link as it was last copied, so the editor can tell when it is out of date. */
	sharedLink: string | null;
}

/** What is written to storage: settings in their link form. */
interface Stored {
	id: string;
	name: string;
	query: string;
	savedAt: number;
	sharedLink: string | null;
}

export const store = $state<{ list: Activity[]; loaded: boolean }>({ list: [], loaded: false });

export function newId(): string {
	return crypto.randomUUID?.() ?? `a${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Read the list from storage, adding any starter activity this browser has not
 * been given yet. Each starter is added once, by id, so a teacher who deletes
 * one never sees it again, and starters added to the app later still arrive.
 *
 * This is also where a teacher is told what's changed since their last visit;
 * on a first visit there is nothing to tell.
 */
export function loadActivities() {
	if (store.loaded) return;
	if (read(SEEDED_KEY) === null) markAllNewsSeen();
	else showUnseenNews();
	const raw = read(LIST_KEY);
	store.list = Array.isArray(raw) ? raw.filter(isStored).map(fromStored) : [];
	const given = seededIds();
	const fresh = STARTERS.filter((s) => !given.includes(s.id));
	if (fresh.length) {
		const now = Date.now();
		const starters = fresh.map((s, i) => ({
			id: newId(),
			name: s.name,
			settings: { ...defaultSettings(s.type), bank: [...s.morphemes] },
			// Listed in the order starters.json gives them.
			savedAt: now - i,
			sharedLink: null
		}));
		store.list = [...store.list, ...starters];
		write(SEEDED_KEY, [...given, ...fresh.map((s) => s.id)]);
		persist();
	}
	store.loaded = true;
}

// The starters already given to this browser. Before starters were tracked one
// by one this was a plain `true`, given along with the first six.
const FIRST_STARTERS = [
	'starter',
	'common-prefixes',
	'common-suffixes',
	'spelling-changes',
	'latin-bases',
	'greek-bases'
];
function seededIds(): string[] {
	const raw = read(SEEDED_KEY);
	if (raw === true) return FIRST_STARTERS;
	return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

export function getActivity(id: string): Activity | undefined {
	return store.list.find((a) => a.id === id);
}

export function createActivity(type: ActivityType, name?: string, settings?: Settings): Activity {
	const activity: Activity = {
		id: newId(),
		name: name?.trim() || `Untitled ${TYPE_LABELS[type]} activity`,
		settings: settings ?? defaultSettings(type),
		savedAt: Date.now(),
		sharedLink: null
	};
	store.list = [activity, ...store.list];
	persist();
	return activity;
}

/**
 * Save an activity after the editor has changed it in place. The editor works
 * on the activity in this list directly, so all that is left is to stamp it
 * and write the list out.
 */
export function saveActivity(id: string) {
	const activity = getActivity(id);
	if (!activity) return;
	activity.savedAt = Date.now();
	persist();
}

export function markShared(id: string, link: string) {
	const activity = getActivity(id);
	if (!activity) return;
	activity.sharedLink = link;
	persist();
}

export function duplicateActivity(id: string): Activity | undefined {
	const original = getActivity(id);
	if (!original) return;
	return createActivity(
		original.settings.type,
		`${original.name} (copy)`,
		structuredClone($state.snapshot(original.settings))
	);
}

export function deleteActivity(id: string) {
	store.list = store.list.filter((a) => a.id !== id);
	persist();
}

/** Newest first: the activity a teacher touched last is the one they are most likely after. */
export function sortedActivities(): Activity[] {
	return [...store.list].sort((a, b) => b.savedAt - a.savedAt);
}

// --- links ---

/** The link students open. The name rides along so their page can show it. */
export function studentLink(origin: string, a: Activity): string {
	return `${origin}/practice?${linkQuery(a)}`;
}

/** A link that adds a copy of the activity to whoever opens it — for passing to another teacher. */
export function teacherLink(origin: string, a: Activity): string {
	return `${origin}/open?${linkQuery(a)}`;
}

function linkQuery(a: Activity): string {
	return `name=${encodeURIComponent(a.name)}&${settingsToQuery(a.settings)}`;
}

// --- storage ---

function persist() {
	write(
		LIST_KEY,
		store.list.map((a): Stored => ({
			id: a.id,
			name: a.name,
			query: settingsToQuery(a.settings),
			savedAt: a.savedAt,
			sharedLink: a.sharedLink
		}))
	);
}

function fromStored(s: Stored): Activity {
	return {
		id: s.id,
		name: s.name,
		settings: settingsFromParams(new URLSearchParams(s.query)),
		savedAt: s.savedAt,
		sharedLink: s.sharedLink
	};
}

function isStored(x: unknown): x is Stored {
	const s = x as Stored;
	return (
		!!s &&
		typeof s.id === 'string' &&
		typeof s.name === 'string' &&
		typeof s.query === 'string' &&
		typeof s.savedAt === 'number'
	);
}

/** Whether the QR code is left showing — how the teacher likes to work, not part of any activity. */
export function loadQrOpen(): boolean {
	return read(QR_OPEN_KEY) === true;
}
export function saveQrOpen(open: boolean) {
	write(QR_OPEN_KEY, open);
}

// Storage can be unavailable or full — a browser in private mode, a locked-down
// school device. None of it is worth interrupting the teacher over, so reads
// fall back to nothing and writes are allowed to fail.
function read(key: string): unknown {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function write(key: string, value: unknown) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Nothing useful to do; the activity still works for this visit.
	}
}
