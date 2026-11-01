import { describe, expect, test } from 'bun:test';
import {
	checkEquation,
	checkSolution,
	factorizations,
	formatPoly,
	mul,
	prettyText,
	readProblem,
	type Problem
} from './algebra';
import { panPiles, readStart, startingPiles } from './settings';

const ok = (p: Problem) => {
	if (!p.ok) throw new Error(p.reason);
	if (p.type === 'solve') throw new Error('Not a Multiply or Factor problem');
	return p;
};
const solve = (text: string) => {
	const p = readProblem('solve', text);
	if (!p.ok) throw new Error(p.reason);
	if (p.type !== 'solve') throw new Error('Not a Solve problem');
	return p;
};
const refusal = (text: string) => {
	const p = readProblem('solve', text);
	return p.ok ? '' : p.reason;
};

describe('readProblem: multiply', () => {
	test('two binomials', () => {
		const p = ok(readProblem('multiply', '(x+2)(x-3)'));
		expect(p.type === 'multiply' && p.factors).toEqual([
			{ x: 1, unit: 2 },
			{ x: 1, unit: -3 }
		]);
		expect(p.poly).toEqual([-6, -1, 1]);
		expect(p.given).toBe('(x+2)(x-3)');
	});
	test('a monomial times a binomial joins its single terms into one side', () => {
		const p = ok(readProblem('multiply', '2x(x+3)'));
		expect(p.type === 'multiply' && p.factors).toEqual([
			{ x: 2, unit: 0 },
			{ x: 1, unit: 3 }
		]);
	});
	test('leading coefficients, negatives and a square', () => {
		expect(ok(readProblem('multiply', '(-x+2)(3x-1)')).ok).toBe(true);
		const sq = ok(readProblem('multiply', '(x+3)^2'));
		expect(sq.type === 'multiply' && sq.factors).toEqual([
			{ x: 1, unit: 3 },
			{ x: 1, unit: 3 }
		]);
		expect(ok(readProblem('multiply', 'x*x')).ok).toBe(true);
		expect(ok(readProblem('multiply', '3(x-1)')).ok).toBe(true);
	});
	test('things tiles cannot show', () => {
		expect(readProblem('multiply', 'x+2').ok).toBe(false);
		expect(readProblem('multiply', '(x+1)(x+2)(x+3)').ok).toBe(false);
		expect(readProblem('multiply', '(x+y)(x-1)').ok).toBe(false);
		expect(readProblem('multiply', '(x+2)(x-3)=1').ok).toBe(false);
		expect(readProblem('multiply', '(x+0.5)(x-1)').ok).toBe(false);
		expect(readProblem('multiply', '(x+2)(x').ok).toBe(false);
		expect(readProblem('multiply', '').ok).toBe(false);
	});
});

describe('readProblem: either form', () => {
	test('Multiply from a polynomial starts from its factors', () => {
		const p = ok(readProblem('multiply', 'x^2-x-6'));
		expect(p.given).toBe('(x+2)(x-3)');
		expect(ok(readProblem('multiply', '2x^2+6x')).given).toBe('2x(x+3)');
	});
	test('Factor from factors starts from the polynomial', () => {
		const p = ok(readProblem('factor', '(x+2)(x-3)'));
		expect(p.given).toBe('x^2-x-6');
		expect(p.poly).toEqual([-6, -1, 1]);
	});
	test('a factored-out number comes out whole', () => {
		expect(ok(readProblem('factor', '4x+6')).factors).toEqual([
			{ x: 0, unit: 2 },
			{ x: 2, unit: 3 }
		]);
	});
});

describe('readProblem: factor', () => {
	test('trinomials that factor', () => {
		expect(readProblem('factor', 'x^2-x-6').ok).toBe(true);
		expect(readProblem('factor', '6x^2+x-2').ok).toBe(true);
		expect(readProblem('factor', 'x^2-9').ok).toBe(true);
		expect(readProblem('factor', '2x^2+4x').ok).toBe(true);
		expect(readProblem('factor', '-x^2+5x-6').ok).toBe(true);
		expect(readProblem('factor', '4x+6').ok).toBe(true);
	});
	test('says why when it does not factor', () => {
		const p = readProblem('factor', 'x^2+x+1');
		expect(p.ok).toBe(false);
		expect(!p.ok && p.reason).toContain('doesn’t factor');
		expect(readProblem('factor', 'x^3+1').ok).toBe(false);
		expect(readProblem('factor', '0').ok).toBe(false);
	});
});

describe('readProblem: solve', () => {
	test('x on one side, the other or both', () => {
		const p = solve('2x+3=7');
		expect([p.left, p.right, p.solution]).toEqual([[3, 2], [7], 2]);
		expect(p.given).toBe('2x+3=7');
		expect(solve('7=2x+3').solution).toBe(2);
		expect(solve('3x-4=x+6').solution).toBe(5);
		expect(solve('-2x=6').solution).toBe(-3);
		expect(solve('2x=-6').solution).toBe(-3);
		expect(solve('2x=0').solution).toBe(0);
		expect(solve('x+5=2').solution).toBe(-3);
	});
	test('x² only when it cancels', () => {
		expect(solve('x^2+3x=x^2+6').solution).toBe(2);
		expect(refusal('x^2+3x=6')).toContain('same on both sides');
		expect(refusal('2x^2+x=x^2+1')).toContain('same on both sides');
		expect(refusal('x^3=x^3+x')).toContain('highest power');
	});
	test('says why when tiles can’t solve it', () => {
		expect(refusal('2(x+1)=6')).toContain('brackets');
		expect(refusal('x+1=x+2')).toContain('no solution');
		expect(refusal('2x+2=2+2x')).toContain('Every number');
		expect(refusal('2x=3')).toContain('whole number');
		expect(refusal('2x+3')).toContain('= sign');
		expect(refusal('x=1=1')).toContain('one = sign');
		expect(refusal('y+1=3')).toContain('Use x');
		expect(refusal('x=4')).toContain('already solved');
		expect(refusal('0.5x=2')).toContain('whole numbers');
		expect(refusal('2x+=7')).toContain('finished');
		expect(refusal('')).toContain('Type an equation');
	});
	test('Multiply and Factor still refuse an = sign', () => {
		expect(readProblem('factor', '2x+3=7').ok).toBe(false);
		expect(readProblem('multiply', '(x+1)(x+2)=0').ok).toBe(false);
	});
});

describe('checkSolution', () => {
	const p = solve('2x+3=7');
	test('the number x stands for', () => {
		expect(checkSolution(p, '2').ok).toBe(true);
		expect(checkSolution(p, ' 2 ').ok).toBe(true);
		expect(checkSolution(solve('-2x=6'), '-3').ok).toBe(true);
	});
	test('wrong and malformed answers', () => {
		const message = (text: string) => {
			const v = checkSolution(p, text);
			return v.ok ? '' : v.message;
		};
		expect(message('3')).toContain('isn’t what x is');
		expect(message('')).toContain('Type the number');
		expect(message('x=2')).toContain('already there');
		expect(message('2x')).toContain('without x');
		expect(message('2+')).toContain('finished');
	});
});

describe('factorizations', () => {
	test('every one multiplies back', () => {
		for (const poly of [[-6, -1, 1], [-2, 1, 6], [0, 4, 2], [-9, 0, 1], [6, 4], [6], [0, 0, 3]]) {
			const ways = factorizations(poly);
			expect(ways.length).toBeGreaterThan(0);
			for (const [f, g] of ways) expect(mul([f.unit, f.x], [g.unit, g.x]).join()).toBe(poly.join());
		}
	});
});

describe('checkEquation', () => {
	const multiply = ok(readProblem('multiply', '(x+2)(x-3)'));
	const factor = ok(readProblem('factor', 'x^2-x-6'));
	test('right either way round, in any term order', () => {
		expect(checkEquation(multiply, '(x+2)(x-3)=x^2-x-6').ok).toBe(true);
		expect(checkEquation(multiply, 'x^2-x-6=(x+2)(x-3)').ok).toBe(true);
		expect(checkEquation(multiply, '(x-3)(x+2)=-6-x+x^2').ok).toBe(true);
		expect(checkEquation(factor, 'x^2-x-6=(2+x)(x-3)').ok).toBe(true);
	});
	test('flipped signs count, with a note', () => {
		const v = checkEquation(factor, 'x^2-x-6=(-x-2)(-x+3)');
		expect(v.ok && v.note).toBeTruthy();
	});
	test('equal but not simplified gets a nudge', () => {
		const v = checkEquation(multiply, '(x+2)(x-3)=x^2+2x-3x-6');
		expect(!v.ok && v.message).toContain('combine the like terms');
	});
	test('wrong answers and malformed ones', () => {
		expect(checkEquation(multiply, '(x+2)(x-3)=x^2+x-6').ok).toBe(false);
		expect(checkEquation(multiply, 'x^2-x-6').ok).toBe(false);
		expect(checkEquation(multiply, 'x^2-x-6=x^2-x-6').ok).toBe(false);
		expect(checkEquation(multiply, '(x+2)(x-3)=').ok).toBe(false);
	});
});

describe('formatting', () => {
	test('formatPoly', () => {
		expect(formatPoly([-6, -1, 1])).toBe('x² − x − 6');
		expect(formatPoly([0, 2, -3])).toBe('−3x² + 2x');
		expect(formatPoly([0])).toBe('0');
	});
	test('prettyText', () => {
		expect(prettyText('(x+2)(x-3)')).toBe('(x + 2)(x − 3)');
		expect(prettyText('-x^2+3x')).toBe('−x² + 3x');
	});
});

describe('starting tiles', () => {
	const count = (piles: { n: number }[]) => piles.reduce((a, p) => a + p.n, 0);

	test('Multiply starts with the sides’ tiles and the rectangle’s, or none', () => {
		const p = ok(readProblem('multiply', '(x+2)(x-3)'));
		// Sides: x, 1, 1 and x, −1, −1, −1. Rectangle: x², 2x, −3x, −6.
		expect(startingPiles(p, 'all')).toEqual([
			{ kind: 'x2', sign: 1, n: 1 },
			{ kind: 'x', sign: 1, n: 4 },
			{ kind: 'x', sign: -1, n: 3 },
			{ kind: 'unit', sign: 1, n: 2 },
			{ kind: 'unit', sign: -1, n: 9 }
		]);
		expect(startingPiles(p, 'none')).toEqual([]);
	});

	test('Factor starts with the rectangle’s tiles, zero pairs included', () => {
		const p = ok(readProblem('factor', 'x^2-x-6'));
		expect(count(startingPiles(p, 'all'))).toBe(12);
	});

	test('Solve starts with each side’s tiles in its pan', () => {
		const p = solve('2x-3=x+4');
		expect(panPiles(p, 'all')).toEqual([
			[
				{ kind: 'x', sign: 1, n: 2 },
				{ kind: 'unit', sign: -1, n: 3 }
			],
			[
				{ kind: 'x', sign: 1, n: 1 },
				{ kind: 'unit', sign: 1, n: 4 }
			]
		]);
		expect(panPiles(p, 'none')).toEqual([[], []]);
		expect(count(panPiles(solve('x^2+3x=x^2+6'), 'all')[1])).toBe(7);
	});

	test('an unknown start, or an old link’s positive, falls back to all the tiles', () => {
		expect(readStart('none')).toBe('none');
		expect(readStart('positive')).toBe('all');
		expect(readStart('lots')).toBe('all');
	});
});
