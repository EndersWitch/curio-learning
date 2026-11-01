// Functions in an equation: sin x, ln(x + 1), log₂ x, |x|, e^x. Caret reads
// every letter as its own variable, so sin(x) would be s·i·n·(x); this adds,
// on top of Caret's grammar and without changing Caret:
//
// - a function name, read as one word ahead of single-letter variables;
// - applying it to what comes next, which binds like a product: sin 2x is
//   sin(2x), sin x + 1 is (sin x) + 1, and sin x cos x is (sin x)(cos x);
// - sin² x (the square of sin x), sin⁻¹ x (arcsin x) and log₂ x (base 2);
// - |x| as absolute value, and e as the number e.
//
// Only the coordinate grid reads equations, so the number line is unchanged.

import {
  CannotParseError, JuxtapositionParselet, LeafParselet, PrefixParselet, TokensTag, TreeNode, charTokenType, tokenIs, type DocToken,
  type LeafParseletMethods, type PrefixParseletMethods,
} from '@caret-js/core'

type Tok = DocToken<any, any>
import {
  AddParselet, AdjacentMultiplicationParselet, CommaListParselet, ComparisonParselet, ConstantParselet, DecimalNode, DecimalParselet, ExponentNode,
  FractionParselet, MathExpressionTag, MultiplicationStyleTag, MultiplyNode, MultiplyParselet, NegativeNode, ParenthesesParselet, RadicalParselet,
  SlashDivideParselet, SubSupParselet, SubscriptNode, SubtractParselet, UnaryMinusParselet, UnaryPlusParselet, VariableParselet,
} from '@caret-js/math'

/** Every function an equation can use, by the name it's typed with. */
export const FUNCTION_NAMES = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'arcsin', 'arccos', 'arctan', 'ln', 'log', 'abs'] as const
export type FunctionName = (typeof FUNCTION_NAMES)[number]


/** A function's name typed with nothing to work on yet, like "sin" alone. */
export class FunctionNameNode extends TreeNode {
  constructor(
    public name: FunctionName,
    public _tokens: Tok[],
  ) {
    super()
  }
  toDebugMathML() {
    return null as never
  }
}

/** A function applied to one value: sin(2x), log₂(x) (base 2), |x − 1| (abs). */
export class FunctionNode extends TreeNode {
  constructor(
    public name: FunctionName,
    public arg: TreeNode,
    public base: TreeNode | null = null,
    public _tokens: Tok[] = [],
  ) {
    super()
    this.addTag(new MathExpressionTag())
  }
  toDebugMathML() {
    return null as never
  }
}

const charOf = (t: Tok | null) => (t && tokenIs(t, charTokenType) ? (t.props as { char: string }).char : null)

/** A function's name, as the longest one the letters ahead spell. */
class FunctionNameParselet extends LeafParselet<any> {
  parse({ consume, peek }: LeafParseletMethods<any>) {
    let word = ''
    const tokens: Tok[] = []
    while (true) {
      const c = charOf(peek())
      if (c === null || !FUNCTION_NAMES.some((n) => n.startsWith(word + c))) break
      word += c
      tokens.push(consume(true)!)
    }
    const name = FUNCTION_NAMES.find((n) => n === word)
    if (!name) throw new CannotParseError(this, 'Not a function name')
    return new FunctionNameNode(name, tokens)
  }
}

/** The name inside sin, sin², log₂ or log₂², with its power and base. */
function nameOf(node: TreeNode): { name: FunctionNameNode; power: TreeNode | null; base: TreeNode | null } | null {
  let power: TreeNode | null = null
  let base: TreeNode | null = null
  if (node instanceof ExponentNode) {
    power = node.power
    node = node.base
  }
  if (node instanceof SubscriptNode) {
    base = node.subscript
    node = node.child
  }
  return node instanceof FunctionNameNode ? { name: node, power, base } : null
}

/** The power −1, as in sin⁻¹. */
const isMinusOne = (node: TreeNode | null) =>
  (node instanceof DecimalNode && node.toFloat() === -1) || (node instanceof NegativeNode && node.child instanceof DecimalNode && node.child.toFloat() === 1)

const INVERTIBLE = new Set<FunctionName>(['sin', 'cos', 'tan'])

/**
 * A function name before a value: sin x, sin(x), sin 2x, sin² x, log₂ x.
 * What follows is read the way a product is, so a second function starts a
 * new factor: sin x cos x is (sin x)(cos x).
 */
class FunctionApplyParselet extends JuxtapositionParselet {
  canParse(left: TreeNode, right: TreeNode) {
    return nameOf(left) !== null && right.hasTag(MathExpressionTag)
  }
  parse(left: TreeNode, right: TreeNode) {
    const { name, power, base } = nameOf(left)!
    let arg = right
    let rest: TreeNode[] = []
    if (right instanceof MultiplyNode && right.getTag(MultiplicationStyleTag)?.style === 'implicit') {
      const k = right.factors.findIndex((f, i) => i > 0 && startsWithFunction(f))
      if (k > 0) {
        arg = k === 1 ? right.factors[0] : MultiplyNode.from(right.factors.slice(0, k)).addTag(new MultiplicationStyleTag('implicit'))
        rest = right.factors.slice(k)
      }
    }
    // sin⁻¹ x is arcsin x; any other power is of the answer: sin² x = (sin x)².
    const inverse = isMinusOne(power) && INVERTIBLE.has(name.name)
    const fname = inverse ? (`arc${name.name}` as FunctionName) : name.name
    let applied: TreeNode = new FunctionNode(fname, arg, base, name._tokens)
    if (power !== null && !inverse) applied = ExponentNode.from(applied, power)
    if (!rest.length) return applied
    return MultiplyNode.from([applied, ...rest]).addTag(new MultiplicationStyleTag('implicit'))
  }
}

const startsWithFunction = (node: TreeNode): boolean =>
  node instanceof FunctionNode ||
  (node instanceof ExponentNode && startsWithFunction(node.base)) ||
  (node instanceof MultiplyNode && node.factors.length > 0 && startsWithFunction(node.factors[0]))

/** |x − 1|: what's between two bars, as abs. */
class AbsParselet extends PrefixParselet<any> {
  parse({ consume, parseRight }: PrefixParseletMethods<any>) {
    const open = consume('|')!
    const inside = parseRight()
    const close = consume('|')!
    return new FunctionNode('abs', inside, null, []).addTag(new TokensTag([open, close]))
  }
}

/**
 * The grammar for a coordinate grid's equations: Caret's, plus functions,
 * |x| and e. Any other single letter is a variable.
 */
export function functionParselets() {
  const isVariable = (c: string) => /^\p{L}$/u.test(c) && c !== 'π' && c !== 'e'
  return [
    new Set([
      new FunctionNameParselet(),
      new DecimalParselet(),
      new ConstantParselet('π', Math.PI),
      new ConstantParselet('e', Math.E),
      new ParenthesesParselet(),
      new FractionParselet(),
      new RadicalParselet(),
      new VariableParselet(isVariable),
    ]),
    new SubSupParselet(),
    // Applying a function comes first, so sin² x isn't read as sin² times x.
    new Set([new FunctionApplyParselet(), new MultiplyParselet(), new SlashDivideParselet(), new AdjacentMultiplicationParselet()]),
    new Set([new UnaryMinusParselet(), new UnaryPlusParselet()]),
    new Set([new SubtractParselet(), new AddParselet()]),
    new ComparisonParselet(['<', '>', '≤', '≥', '≠', '=']),
    new CommaListParselet(),
    // Lowest, so everything between the bars is read before the closing one.
    new AbsParselet(),
  ]
}
