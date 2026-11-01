import { describe, expect, test } from 'bun:test';
import {
	XLEN,
	UNIT,
	checkGroups,
	checkProduct,
	checkSides,
	checkSidesAgainst,
	lenEq,
	lenPx,
	packSides,
	readRectangle,
	settle,
	readSide,
	zeroPairs,
	pairUp,
	stackBelow,
	GAP,
	type Kind,
	type Len,
	type Sign,
	type SideTile,
	type Tile
} from './mat';

let ids = 0;
const len = (x: number, u: number): Len => ({ x, u });
/** A tile lined up on the mat at the given lengths from the T's corner. */
const tile = (kind: Kind, sign: Sign, at: [Len, Len], turned = false): Tile => ({
	id: ids++,
	kind,
	sign,
	turned,
	x: lenPx(at[0]),
	y: lenPx(at[1]),
	at: { x: at[0], y: at[1] }
});
const side = (spec: string): SideTile[] =>
	// "x+1+1" or "x-1-1-1": one tile per term.
	(spec.match(/[+-]?(x|1)/g) ?? []).map((t) => ({
		id: ids++,
		kind: t.endsWith('x') ? 'x' : 'unit',
		sign: t.startsWith('-') ? -1 : 1
	}));

describe('settle', () => {
	test('a tile dropped near the corner snaps into it', () => {
		const at = settle({ kind: 'x2', turned: false }, 5, -4, [], [], [], 14);
		expect(at.x).toBe(0);
		expect(at.y).toBe(0);
		expect(at.at.x && lenEq(at.at.x, len(0, 0))).toBe(true);
	});
	test('a tile dropped beside another snaps flush, and knows its length', () => {
		const x2 = tile('x2', 1, [len(0, 0), len(0, 0)]);
		const at = settle({ kind: 'x', turned: true }, XLEN + 6, 3, [x2], [], [], 14);
		expect(at.x).toBeCloseTo(XLEN);
		expect(at.at.x && lenEq(at.at.x, len(1, 0)) && at.at.y && lenEq(at.at.y, len(0, 0))).toBe(true);
	});
	test('a tile dropped on another slides to the nearest free spot', () => {
		const x2 = tile('x2', 1, [len(0, 0), len(0, 0)]);
		const at = settle({ kind: 'unit', turned: false }, 20, 20, [x2], [], [], 14);
		const r = { x: at.x, y: at.y };
		const inside = r.x < XLEN - 0.5 && r.y < XLEN - 0.5 && r.x + UNIT > 0.5 && r.y + UNIT > 0.5;
		expect(inside).toBe(false);
	});
	test('a tile with nothing near stays where it was dropped', () => {
		const at = settle({ kind: 'unit', turned: false }, 900, 700, [], [], [], 14);
		expect(at).toEqual({ x: 900, y: 700, at: { x: null, y: null } });
	});
});

describe('Multiply', () => {
	const top = side('x+1+1'); // x + 2
	const left = side('x-1-1-1'); // x − 3
	test('the sides, either way round', () => {
		const f = { x: 1, unit: 2 };
		const g = { x: 1, unit: -3 };
		expect(checkSides(top, left, [f, g]).ok).toBe(true);
		expect(checkSides(left, top, [f, g]).ok).toBe(true);
		expect(checkSides(side('x+1'), left, [f, g]).ok).toBe(false);
		// A zero pair on a side isn't the factor's tiles.
		expect(checkSides(side('x+1+1+1-1'), left, [f, g]).ok).toBe(false);
	});

	// (x + 2)(x − 3): x², 2x down the right, −3x along the bottom, −6 in the corner.
	const product = () => {
		const out = [tile('x2', 1, [len(0, 0), len(0, 0)])];
		for (let c = 0; c < 2; c++) out.push(tile('x', 1, [len(1, c), len(0, 0)], true));
		for (let r = 0; r < 3; r++) {
			out.push(tile('x', -1, [len(0, 0), len(1, r)]));
			for (let c = 0; c < 2; c++) out.push(tile('unit', -1, [len(1, c), len(1, r)]));
		}
		return out;
	};
	test('a right rectangle passes', () => {
		expect(checkProduct(product(), top, left).ok).toBe(true);
	});
	test('a missing tile is a gap, a wrong sign is marked', () => {
		const tiles = product();
		const gone = tiles.pop()!;
		const r = checkProduct(tiles, top, left);
		expect(r.ok).toBe(false);
		expect(r.gaps.length).toBe(1);
		tiles.push({ ...gone, sign: 1 });
		const s = checkProduct(tiles, top, left);
		expect(s.wrong).toEqual([gone.id]);
	});
	test('a tile turned the wrong way doesn’t fit', () => {
		const tiles = product();
		tiles[1] = { ...tiles[1], turned: false };
		expect(checkProduct(tiles, top, left).wrong).toContain(tiles[1].id);
	});
	test('like-term groups', () => {
		const tiles = product();
		const groups = {
			x2: tiles.filter((t) => t.kind === 'x2'),
			x: tiles.filter((t) => t.kind === 'x'),
			unit: tiles.filter((t) => t.kind === 'unit')
		};
		const poly = [-6, -1, 1];
		// Still a zero pair among the x tiles.
		expect(checkGroups([], groups, poly).ok).toBe(false);
		// Zero out two zero pairs.
		const pos = groups.x.filter((t) => t.sign === 1);
		const neg = groups.x.filter((t) => t.sign === -1);
		const zeroed = { ...groups, x: neg.slice(2) };
		expect(pos.length).toBe(2);
		expect(checkGroups([], zeroed, poly).ok).toBe(true);
		expect(checkGroups(tiles.slice(0, 1), zeroed, poly).ok).toBe(false);
		expect(checkGroups([], { ...zeroed, x2: [...zeroed.x2, zeroed.unit[0]] }, poly).ok).toBe(false);
	});
});

describe('Factor', () => {
	// x² − 1 needs a zero pair: x² and x across the top row, −x and −1 below.
	const square = () => [
		tile('x2', 1, [len(0, 0), len(0, 0)]),
		tile('x', 1, [len(1, 0), len(0, 0)], true),
		tile('x', -1, [len(0, 0), len(1, 0)]),
		tile('unit', -1, [len(1, 0), len(1, 0)])
	];
	test('a rectangle with a zero pair reads as (x + 1)(x − 1)', () => {
		const r = readRectangle(square(), [-1, 0, 1]);
		expect(r.ok).toBe(true);
		expect(r.grid!.colSigns).toEqual([1, 1]);
		expect(r.grid!.rowSigns).toEqual([1, -1]);
		expect(checkSidesAgainst(side('x+1'), side('x-1'), r.grid!).ok).toBe(true);
		expect(checkSidesAgainst(side('-x-1'), side('-x+1'), r.grid!).ok).toBe(true);
		expect(checkSidesAgainst(side('x+1'), side('x+1'), r.grid!).ok).toBe(false);
		expect(checkSidesAgainst(side('1+x'), side('x-1'), r.grid!).ok).toBe(false);
	});
	test('signs that no rows and columns could give', () => {
		const tiles = square();
		tiles[1] = { ...tiles[1], sign: -1 };
		const r = readRectangle(tiles, [-1, -2, 1]);
		expect(r.ok).toBe(false);
		expect(r.message).toContain('signs');
	});
	test('a rectangle with the wrong tiles, a gap, or off the corner', () => {
		expect(readRectangle(square(), [-1, 1, 1]).ok).toBe(false);
		expect(readRectangle(square().slice(0, 3), [0, 0, 1]).gaps.length).toBe(1);
		const shifted = square().map((t) => ({
			...t,
			at: { x: { ...t.at.x!, u: t.at.x!.u + 1 }, y: t.at.y }
		}));
		expect(readRectangle(shifted, [-1, 0, 1]).message).toContain('corner');
	});
	test('rows that don’t line up', () => {
		// x² beside a unit tile: the unit is shorter, so the row has a ragged edge.
		const tiles = [tile('x2', 1, [len(0, 0), len(0, 0)]), tile('unit', 1, [len(1, 0), len(0, 0)])];
		const r = readRectangle(tiles, [1, 0, 1]);
		expect(r.ok).toBe(false);
	});
});

describe('readSide', () => {
	/** A tile lying on the top side, `along` from the corner. */
	const onTop = (kind: Kind, sign: Sign, along: Len, turned = false): Tile => {
		const t = tile(kind, sign, [along, len(0, 0)], turned);
		const h = kind === 'x' && turned ? XLEN : UNIT;
		return { ...t, y: -GAP - h, at: { x: along, y: null } };
	};
	test('x + 2 laid end to end from the corner', () => {
		const r = readSide(
			[onTop('unit', 1, len(1, 0)), onTop('x', 1, len(0, 0)), onTop('unit', 1, len(1, 1))],
			'top'
		);
		expect(r.ok).toBe(true);
		expect(r.side.map((t) => t.kind)).toEqual(['x', 'unit', 'unit']);
	});
	test('an x tile standing up on the top side has to be turned', () => {
		const r = readSide([onTop('x', 1, len(0, 0), true)], 'top');
		expect(r.ok).toBe(false);
		expect(r.message).toContain('Turn');
	});
	test('a gap along the side', () => {
		const r = readSide([onTop('x', 1, len(0, 0)), onTop('unit', 1, len(1, 1))], 'top');
		expect(r.ok).toBe(false);
	});
	test('a tile not pushed up against the rectangle', () => {
		const t = onTop('unit', 1, len(0, 0));
		expect(readSide([{ ...t, y: t.y - 20 }], 'top').ok).toBe(false);
	});
});

describe('zeroPairs', () => {
	test('opposite tiles flush against each other pair up', () => {
		const a = tile('x', 1, [len(0, 0), len(0, 0)]);
		const b = tile('x', -1, [len(0, 0), len(0, 1)]);
		expect(zeroPairs([a, b]).length).toBe(1);
	});
	test('not when they only touch at a corner, differ in shape, or share a sign', () => {
		const a = tile('x', 1, [len(0, 0), len(0, 0)]);
		expect(zeroPairs([a, tile('x', -1, [len(1, 0), len(0, 1)])]).length).toBe(0);
		expect(zeroPairs([a, tile('x', -1, [len(1, 0), len(0, 0)], true)]).length).toBe(0);
		expect(zeroPairs([a, tile('x', 1, [len(0, 0), len(0, 1)])]).length).toBe(0);
	});
});

describe('packSides', () => {
	const free = (kind: Kind, x: number, y: number, turned = false): Tile => ({
		id: ids++,
		kind,
		sign: 1,
		turned,
		x,
		y,
		at: { x: null, y: null }
	});
	const ARM = 10 * XLEN;

	test('a tile dropped along the top slides back to the corner', () => {
		const t = free('unit', 3 * XLEN, -GAP - UNIT);
		const [packed] = packSides([t], ARM);
		expect(packed.x).toBe(0);
		expect(packed.at.x).toEqual(len(0, 0));
		expect(readSide([packed], 'top').ok).toBe(true);
	});

	test('a tile dropped between two goes between them, and the row closes up', () => {
		const a = free('x', 0, -GAP - UNIT);
		const b = free('unit', XLEN + 50, -GAP - UNIT);
		const c = free('unit', XLEN - 10, -GAP - UNIT);
		const packed = packSides([a, b, c], ARM);
		expect(packed.map((t) => t.x)).toEqual([0, XLEN + UNIT, XLEN]);
		expect(readSide(packed, 'top').ok).toBe(true);
	});

	test('the left side packs downward, and tiles elsewhere stay put', () => {
		const a = free('x', -GAP - UNIT, 200, true);
		const loose = free('unit', 300, 300);
		const [packed, still] = packSides([a, loose], ARM);
		expect(packed.y).toBe(0);
		expect(packed.at.y).toEqual(len(0, 0));
		expect(still).toEqual(loose);
	});

	test('locked tiles stay at the front of their row', () => {
		const kept = free('unit', 2 * UNIT, -GAP - UNIT);
		const added = free('unit', 0, -GAP - UNIT);
		const packed = packSides([kept, added], ARM, (t) => t.id === kept.id);
		expect(packed.map((t) => t.x)).toEqual([0, UNIT]);
	});
});

describe('zeroing out a selection', () => {
	const t = (id: number, kind: Kind, sign: Sign, x: number, y = 0): Tile => ({
		id,
		kind,
		sign,
		turned: false,
		x,
		y,
		at: { x: null, y: null }
	});
	test('pairs each positive tile with the nearest negative of its kind, flush or not', () => {
		const tiles = [
			t(1, 'unit', 1, 0),
			t(2, 'unit', -1, 300),
			t(3, 'unit', -1, 100),
			t(4, 'unit', 1, 380),
			t(5, 'x', -1, 0, 200)
		];
		const pairs = pairUp(tiles).map(([a, b]) => [a.id, b.id]);
		expect(pairs).toEqual([
			[4, 2],
			[1, 3]
		]);
	});
	test('leaves tiles without a partner out', () => {
		const pairs = pairUp([t(1, 'unit', 1, 0), t(2, 'unit', 1, 40), t(3, 'unit', -1, 80)]);
		expect(pairs.map(([a, b]) => [a.id, b.id])).toEqual([[2, 3]]);
		expect(pairUp([t(1, 'unit', 1, 0), t(2, 'x', -1, 40)])).toEqual([]);
	});
	test('pairs only within a region, never across it', () => {
		const tiles = [t(1, 'unit', 1, 90), t(2, 'unit', -1, 110), t(3, 'unit', -1, 0)];
		const side = (x: Tile) => (x.x < 100 ? 'left' : 'right');
		expect(pairUp(tiles, side).map(([a, b]) => [a.id, b.id])).toEqual([[1, 3]]);
	});
});

describe('copies below', () => {
	const r = (x: number, y: number, w = UNIT, h = UNIT) => ({ x, y, w, h });
	test('directly below the block, flush', () => {
		const block = [r(0, 0), r(UNIT, 0), r(0, UNIT)];
		expect(stackBelow(block, () => [])).toBe(2 * UNIT);
	});
	test('further down, past what lies in the way', () => {
		const block = [r(0, 0), r(UNIT, 0)];
		expect(stackBelow(block, () => [r(UNIT, UNIT, UNIT, 3 * UNIT)])).toBe(4 * UNIT);
		// Only what's in a copy's own way counts.
		expect(stackBelow(block, (i) => (i ? [] : [r(UNIT, UNIT, UNIT, 3 * UNIT)]))).toBe(UNIT);
	});
});
