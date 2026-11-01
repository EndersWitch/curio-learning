// The value of a parsed equation's side at some x and y. Caret has an
// evaluate() of its own, but a graph needs real-number answers where a
// calculator gives up (the cube root of −8 is −2, and so is (−8)^(1/3)), and
// functions like sin x and log₂ x, which Caret doesn't read.

import type { TreeNode } from '@caret-js/core'
import {
  AddNode, ConstantNode, DecimalNode, DivideNode, ExponentNode, MultiplyNode, NegativeNode, PositiveNode, RadicalNode,
  SubtractNode, VariableNode,
} from '@caret-js/math'
import { FunctionNode, type FunctionName } from '$lib/shared/functions.js'

/** Whether trig functions read their input (and inverse trig gives its answer) in radians or degrees. */
export type AngleUnit = 'radians' | 'degrees'

const DEG = Math.PI / 180

/** A function's value, or null where it isn't defined (tan 90°, ln 0, arcsin 2). */
function apply(name: FunctionName, v: number, base: number | null, angle: AngleUnit): number | null {
  const a = angle === 'degrees' ? v * DEG : v
  const inverse = (r: number) => (angle === 'degrees' ? r / DEG : r)
  // Where a trig function's divisor is this close to 0, it's undefined (tan 90° isn't a huge number).
  const tiny = 1e-12
  switch (name) {
    case 'sin':
      return Math.sin(a)
    case 'cos':
      return Math.cos(a)
    case 'tan':
      return Math.abs(Math.cos(a)) < tiny ? null : Math.tan(a)
    case 'sec':
      return Math.abs(Math.cos(a)) < tiny ? null : 1 / Math.cos(a)
    case 'csc':
      return Math.abs(Math.sin(a)) < tiny ? null : 1 / Math.sin(a)
    case 'cot':
      return Math.abs(Math.sin(a)) < tiny ? null : Math.cos(a) / Math.sin(a)
    case 'arcsin':
      return v < -1 || v > 1 ? null : inverse(Math.asin(v))
    case 'arccos':
      return v < -1 || v > 1 ? null : inverse(Math.acos(v))
    case 'arctan':
      return inverse(Math.atan(v))
    case 'ln':
      return v > 0 ? Math.log(v) : null
    case 'log': {
      const b = base ?? 10
      return v > 0 && b > 0 && b !== 1 ? Math.log(v) / Math.log(b) : null
    }
    case 'abs':
      return Math.abs(v)
  }
}

/** An exponent as p/q with a small odd q, when it is one: 1/3, 2/5, −1/3. */
function oddRoot(power: number): { p: number; q: number } | null {
  for (let q = 3; q <= 15; q += 2) {
    const p = Math.round(power * q)
    if (Math.abs(p - power * q) < 1e-9) return { p, q }
  }
  return null
}

/** b^e, keeping the real answer for a negative b and an odd root, like (−8)^(1/3) = −2. */
export function realPower(b: number, e: number): number | null {
  if (b < 0 && !Number.isInteger(e)) {
    const r = oddRoot(e)
    if (!r) return null
    const v = Math.abs(b) ** e
    return r.p % 2 ? -v : v
  }
  if (b === 0 && e < 0) return null
  return b ** e
}

/** A side's value, or null where it isn't a real number (like 1/0, √−1 or ln 0). */
export function evaluate(node: TreeNode, vars: Record<string, number> = {}, angle: AngleUnit = 'radians'): number | null {
  const ev = (n: TreeNode) => evaluate(n, vars, angle)
  const all = (nodes: TreeNode[]) => {
    const out: number[] = []
    for (const n of nodes) {
      const v = ev(n)
      if (v === null) return null
      out.push(v)
    }
    return out
  }
  const real = (v: number | null) => (v === null || !Number.isFinite(v) ? null : v)
  if (node instanceof DecimalNode) return node.toFloat()
  if (node instanceof ConstantNode) return node.value
  if (node instanceof VariableNode) return Object.hasOwn(vars, node.name) ? vars[node.name] : null
  if (node instanceof NegativeNode) {
    const v = ev(node.child)
    return v === null ? null : -v
  }
  if (node instanceof PositiveNode) return ev(node.child)
  if (node instanceof AddNode) return real(all(node.addends)?.reduce((a, b) => a + b, 0) ?? null)
  if (node instanceof MultiplyNode) return real(all(node.factors)?.reduce((a, b) => a * b, 1) ?? null)
  if (node instanceof SubtractNode) {
    const v = all([node.minuend, node.subtrahend])
    return v && real(v[0] - v[1])
  }
  if (node instanceof DivideNode) {
    const v = all([node.dividend, node.divisor])
    return v && v[1] !== 0 ? real(v[0] / v[1]) : null
  }
  if (node instanceof ExponentNode) {
    const v = all([node.base, node.power])
    return v && real(realPower(v[0], v[1]))
  }
  if (node instanceof RadicalNode) {
    const v = all(node.index ? [node.radicand, node.index] : [node.radicand])
    if (!v) return null
    const n = v[1] ?? 2
    if (n === 0) return null
    // An odd root of a negative number is real: the cube root of −8 is −2.
    if (v[0] < 0 && Number.isInteger(n) && n % 2) return real(-((-v[0]) ** (1 / n)))
    return real(realPower(v[0], 1 / n))
  }
  if (node instanceof FunctionNode) {
    const v = ev(node.arg)
    if (v === null) return null
    const base = node.base ? ev(node.base) : null
    if (node.base && base === null) return null
    return real(apply(node.name, v, base, angle))
  }
  return null
}

const hasVar = (n: TreeNode, name: string) => [...n.traverse()].some((m) => m instanceof VariableNode && m.name === name)

/**
 * The parts of a side that divide by something with x in it, as functions of
 * x: where one is 0, a graph has a hole or an asymptote. That's what's under
 * a fraction or a negative power, the sin or cos inside tan, sec, csc and
 * cot, and what ln or log is taken of. Parts with y in them are left out.
 */
export function divisors(node: TreeNode, angle: AngleUnit = 'radians'): ((x: number) => number | null)[] {
  const out: ((x: number) => number | null)[] = []
  const at = (d: TreeNode) => (x: number) => evaluate(d, { x }, angle)
  for (const n of node.traverse()) {
    let d: ((x: number) => number | null) | null = null
    let from: TreeNode | null = null
    if (n instanceof DivideNode) from = n.divisor
    // A negative power divides: x^(−1) is 1/x.
    else if (n instanceof ExponentNode && !hasVar(n.power, 'x') && !hasVar(n.power, 'y')) {
      const p = evaluate(n.power, {}, angle)
      if (p !== null && p < 0) from = n.base
    } else if (n instanceof FunctionNode && (n.name === 'ln' || n.name === 'log')) {
      // Not a divisor, but ln x has an asymptote where x is 0 too.
      from = n.arg
    } else if (n instanceof FunctionNode && ['tan', 'sec', 'csc', 'cot'].includes(n.name)) {
      const arg = n.arg
      const trig = n.name === 'tan' || n.name === 'sec' ? Math.cos : Math.sin
      const scale = angle === 'degrees' ? DEG : 1
      from = arg
      d = (x) => {
        const v = evaluate(arg, { x }, angle)
        return v === null ? null : trig(v * scale)
      }
    }
    if (from && hasVar(from, 'x') && !hasVar(from, 'y')) out.push(d ?? at(from))
  }
  return out
}
