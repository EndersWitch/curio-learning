import { describe, expect, test } from 'bun:test';
import { readProblem, type Equation } from './algebra';
import {
	balanceFor,
	boxHalf,
	boxIn,
	checkBoxes,
	checkPans,
	divisionFor,
	heapSpot,
	isLevel,
	lean,
	tiltOf,
	withHeight
} from './balance';
import { UNIT, XLEN, net, type Kind, type Sign, type Tile } from './mat';

const solve = (text: string): Equation => {
	const p = readProblem('solve', text);
	if (!p.ok || p.type !== 'solve') throw new Error(p.ok ? 'Not Solve' : p.reason);
	return p;
};

let ids = 0;
/** Tiles for a pan, one per term: "x+x+1+1+1", "-x" or "1-1". Where they lie
 *  doesn't matter to the pans' check. */
const pan = (spec: string): Tile[] =>
	(spec.match(/[+-]?(x2|x|1)/g) ?? []).map((t) => ({
		id: ids++,
		kind: (t.endsWith('x2') ? 'x2' : t.endsWith('x') ? 'x' : 'unit') as Kind,
		sign: (t.startsWith('-') ? -1 : 1) as Sign,
		turned: false,
		x: 0,
		y: 0,
		at: { x: null, y: null }
	}));

describe('level', () => {
	const p = solve('2x+3=7');
	const level = (l: string, r: string) => isLevel(net(pan(l)), net(pan(r)), p);
	test('the pans weigh the same with x set to the answer', () => {
		expect(level('x+x+1+1+1', '1+1+1+1+1+1+1')).toBe(true);
		expect(level('-x-x-1-1-1', '-1-1-1-1-1-1-1')).toBe(true);
		expect(level('x+x', '1+1+1+1')).toBe(true);
		expect(level('1+1+1+1', 'x+x')).toBe(true);
		// The same added to both pans, as a zero pair or not.
		expect(level('x+x+1+1+1-1-1-1', '1+1+1+1+1+1+1-1-1-1')).toBe(true);
		// Swapping x tiles for their value, or trying one x against its value.
		expect(level('1+1+1+1+1+1+1', '1+1+1+1+1+1+1')).toBe(true);
		expect(level('x', '1+1')).toBe(true);
	});
	test('two empty pans hang level', () => {
		expect(level('', '')).toBe(true);
		expect(lean([0, 0, 0], [0, 0, 0], p)).toEqual({ toward: null });
	});
	test('a move made to one pan only tips it', () => {
		expect(level('x+x', '1+1+1+1+1+1+1')).toBe(false);
		expect(level('x', '1+1+1')).toBe(false);
	});
	test('x² tiles weigh x²', () => {
		const q = solve('x^2+3x=x^2+6');
		expect(isLevel(net(pan('x2')), net(pan('1+1+1+1')), q)).toBe(true);
	});
});

describe('lean', () => {
	const p = solve('2x+3=7');
	const tips = (l: string, r: string) => lean(net(pan(l)), net(pan(r)), p);
	test('level hangs level', () => {
		expect(tips('x+x+1+1+1', '1+1+1+1+1+1+1')).toEqual({ toward: null });
		expect(tiltOf(tips('x', '1+1'))).toBe(0);
	});
	test('tips toward the pan heavier with x set to the answer', () => {
		// 2x = 7 with x = 2: 4 against 7.
		expect(tips('x+x', '1+1+1+1+1+1+1')).toEqual({ toward: 'right' });
		expect(tips('x+x+1+1+1+1', '1+1+1+1+1+1+1')).toEqual({ toward: 'left' });
		// Negative tiles weigh less than nothing.
		expect(tips('x+x+1+1+1', '1+1+1+1+1+1+1-1')).toEqual({ toward: 'left' });
		expect(tips('', 'x')).toEqual({ toward: 'right' });
		expect(tiltOf(tips('', 'x'))).toBeGreaterThan(0);
	});
});

describe('checkPans', () => {
	const p = solve('2x+3=7');
	const check = (l: string, r: string, q = p) => checkPans(pan(l), pan(r), q);
	test('x tiles in one pan, units in the other, level', () => {
		expect(check('x+x', '1+1+1+1')).toMatchObject({ ok: true, xPan: 'left' });
		expect(check('1+1+1+1', 'x+x')).toMatchObject({ ok: true, xPan: 'right' });
		expect(check('x+x', '1+1+1+1').wrong).toEqual([]);
	});
	test('an empty unit pan is fine, and so are negative units', () => {
		expect(check('x+x', '', solve('2x=0')).ok).toBe(true);
		expect(check('x+x', '-1-1-1-1-1-1', solve('2x=-6')).ok).toBe(true);
	});
	test('not level', () => {
		const r = check('x+x', '1+1+1+1+1+1+1');
		expect(r.ok).toBe(false);
		expect(r.message).toContain('isn’t level');
	});
	test('with the live balance off, it only says the pans don’t weigh the same', () => {
		for (const [l, r] of [
			['x+x', '1+1+1+1+1+1+1'],
			['x+x+1+1+1+1+1', '1+1+1+1']
		]) {
			const res = checkPans(pan(l), pan(r), p, false);
			expect(res.ok).toBe(false);
			expect(res.message).toContain('two sides aren’t equal');
			expect(res.message).not.toMatch(/heav|light|level|tip/i);
		}
		expect(checkPans(pan('x+x'), pan('1+1+1+1'), p, false)).toMatchObject({ ok: true });
	});
	test('with the live balance off, no message speaks of pans or a balance', () => {
		const q = solve('3x-4=x+6');
		const cases: [string, string, Equation][] = [
			['x+x', '1', p],
			['x2+x+x+x', 'x2+1+1+1+1+1+1', solve('x^2+3x=x^2+6')],
			['x+x+1-1', '1+1+1+1', p],
			['x+x+x', 'x+1+1+1+1+1+1+1+1+1+1', q],
			['1+1+1+1+1+1+1', '1+1+1+1+1+1+1', p],
			['x+x+1+1+1', '1+1+1+1+1+1+1', p],
			['-x-x', '1+1+1+1+1+1', solve('-2x=6')]
		];
		for (const [l, r, eq] of cases) {
			const res = checkPans(pan(l), pan(r), eq, false);
			expect(res.ok).toBe(false);
			expect(res.message).not.toMatch(/pan|balance/i);
			expect(res.message).toMatch(/side/);
		}
	});
	test('a swap that weighs the same still leaves no x tiles', () => {
		const r = check('1+1+1+1+1+1+1', '1+1+1+1+1+1+1');
		expect(r.ok).toBe(false);
		expect(r.message).toContain('no x tiles');
	});
	test('zero pairs left in a pan are marked', () => {
		const l = pan('x+x+1-1');
		const r = checkPans(l, pan('1+1+1+1'), p);
		expect(r.message).toContain('zero pairs');
		expect(r.wrong).toEqual(l.filter((t) => t.kind === 'unit').map((t) => t.id));
	});
	test('units left with the x tiles are marked', () => {
		const l = pan('x+x+1+1+1');
		const r = checkPans(l, pan('1+1+1+1+1+1+1'), p);
		expect(r.ok).toBe(false);
		expect(r.wrong.length).toBe(3);
	});
	test('x tiles in both pans: the pan with fewer is marked', () => {
		const q = solve('3x-4=x+6');
		const r = pan('x');
		const res = checkPans(pan('x+x+x-1-1-1-1'), r, q);
		expect(res.ok).toBe(false);
		expect(checkPans(pan('x+x+x'), [...r, ...pan('1+1+1+1+1+1+1+1+1+1')], q).wrong).toEqual([
			r[0].id
		]);
	});
	test('x² tiles left are marked', () => {
		const q = solve('x^2+3x=x^2+6');
		const r = check('x2+x+x+x', 'x2+1+1+1+1+1+1', q);
		expect(r.ok).toBe(false);
		expect(r.wrong.length).toBe(2);
		expect(check('x+x+x', '1+1+1+1+1+1', q).ok).toBe(true);
	});
	test('negative x tiles have to be flipped, with the rest of both pans', () => {
		const q = solve('-2x=6');
		const r = check('-x-x', '1+1+1+1+1+1', q);
		expect(r.ok).toBe(false);
		expect(r.message).toContain('flip');
		expect(check('x+x', '-1-1-1-1-1-1', q).ok).toBe(true);
	});
});

describe('checkBoxes', () => {
	// Boxes are read from where the tiles lie; here each tile says its box.
	const units = (boxes: (number | null)[]) =>
		boxes.map((box, i) => ({ ...pan('1')[0], id: 1000 + i, box }));
	const boxOf = (t: Tile) => (t as Tile & { box: number | null }).box;
	test('every unit in a box, the same number in each', () => {
		expect(checkBoxes(units([0, 0, 1, 1]), boxOf, 2, 4).ok).toBe(true);
		expect(checkBoxes([], boxOf, 2, 0).ok).toBe(true);
	});
	test('a unit not in a box is marked', () => {
		const r = checkBoxes(units([0, 0, 1, null]), boxOf, 2, 4);
		expect(r.ok).toBe(false);
		expect(r.wrong).toEqual([1003]);
	});
	test('only unit tiles, all one sign, all of them', () => {
		const x = pan('x')[0];
		expect(checkBoxes([...units([0, 1]), { ...x, box: 0 } as Tile], boxOf, 2, 2).wrong).toEqual([
			x.id
		]);
		const mixed = units([0, 1]).map((t, i) => ({ ...t, sign: (i ? -1 : 1) as Sign }));
		expect(checkBoxes(mixed, boxOf, 2, 2).message).toContain('zero pairs');
		expect(checkBoxes(units([0, 1]), boxOf, 2, 4).message).toContain('There were 4');
		expect(checkBoxes(units([0, 1]), boxOf, 2, 4).message).not.toMatch(/pan|balance/i);
	});
	test('uneven boxes are marked', () => {
		const r = checkBoxes(units([0, 0, 0, 1, 2, 2]), boxOf, 3, 6);
		expect(r.ok).toBe(false);
		expect(r.badBoxes).toEqual([0, 1]);
		expect(r.wrong).toEqual([1000, 1001, 1002, 1003]);
	});
});

describe('the balance on the board', () => {
	test('pans side by side, the pivot between them', () => {
		const b = balanceFor(solve('3x=12'));
		expect(b.rows).toBe(3);
		expect(b.right.x).toBeGreaterThan(b.left.x + b.left.w);
		expect(b.pivot.x).toBeGreaterThan(b.left.x + b.left.w);
		expect(b.pivot.x).toBeLessThan(b.right.x);
		expect(b.left.h).toBeGreaterThan(3 * XLEN);
	});
	test('pans grow together, the foot under them', () => {
		const b = balanceFor(solve('3x=12'));
		const g = withHeight(b, b.left.h + 100);
		expect(g.left.h).toBe(b.left.h + 100);
		expect(g.right.h).toBe(b.left.h + 100);
		expect(g.foot).toBeCloseTo(b.foot + 100);
	});
});

describe('the division step', () => {
	const d = divisionFor(400, 0, 3, 12, 'left', 0.6);
	test('a box for each x tile, stacked down, across the line', () => {
		expect(d.boxes.length).toBe(3);
		for (const [i, b] of d.boxes.entries()) {
			expect(b.x).toBeLessThan(400);
			expect(b.x + b.w).toBeGreaterThan(400);
			if (i) expect(b.y).toBeGreaterThan(d.boxes[i - 1].y + d.boxes[i - 1].h);
		}
		expect(d.line.top).toBeLessThan(d.heap.y);
		expect(d.line.bottom).toBeGreaterThan(d.boxes[2].y + d.boxes[2].h);
	});
	test('the boxes fill the view’s height, but never get too small', () => {
		const tall = divisionFor(400, 0, 3, 12, 'left', 2);
		expect(tall.boxes[0].h).toBeGreaterThan(d.boxes[0].h);
		const flat = divisionFor(400, 0, 3, 12, 'left', 0.05);
		expect(flat.boxes[0].h).toBeGreaterThanOrEqual(UNIT * 2);
	});
	test('the units wait above the boxes on their side of the line', () => {
		expect(d.heap.x).toBeGreaterThanOrEqual(400);
		expect(d.heap.y + d.heap.h).toBeLessThan(d.boxes[0].y);
		const r = divisionFor(400, 0, 2, 4, 'right', 0.6);
		expect(r.heap.x + r.heap.w).toBeLessThanOrEqual(400);
		for (let i = 0; i < 12; i++) {
			const at = heapSpot(d, i);
			expect(at.x + UNIT).toBeLessThanOrEqual(d.heap.x + d.heap.w + 0.01);
		}
	});
	test('a unit lying in a box’s units half is in that box', () => {
		const half = boxHalf(d, 1, true);
		expect(half.x).toBe(400);
		const t = { ...pan('1')[0], x: half.x + 10, y: half.y + 4 };
		expect(boxIn(d, t)).toBe(1);
		const xHalf = boxHalf(d, 1, false);
		expect(boxIn(d, { ...t, x: xHalf.x + 10 })).toBe(null);
		expect(boxIn(d, { ...t, y: d.heap.y })).toBe(null);
	});
});
