/**
 * One wrong answer within a word: which part of the question it was, what the
 * student gave, and what was right. The report at the end is built from these.
 */
export interface Miss {
	/** "Piece 2", "Cuts", "Meaning of un-", "Whole word". */
	what: string;
	gave: string;
	want: string;
}

// How long "Correct!" stays up before the next word. Long enough to see the
// word come together, short enough to keep the session moving.
export const CORRECT_MS = 1600;

// How long a wrong tile sits in its slot before it bounces back to the tray.
export const BOUNCE_MS = 700;
