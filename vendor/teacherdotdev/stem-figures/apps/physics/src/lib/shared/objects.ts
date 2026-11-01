// Objects: the blocks, balls and carts that sit on ramps and hang from
// strings. Each is drawn around its bottom middle, pointing up, at a size the
// teacher sets apart from its label; every object starts the same size.

export type ObjectKind = 'block' | 'ball' | 'cart'

/** How tall an object stands at size 1. */
const BASE = { block: 56, ball: 52, cart: 44 }

/** How tall an object stands, from its bottom to its top. */
export const objectHeight = (kind: ObjectKind, size: number) => BASE[kind] * size

/** How wide an object is. */
export const objectWidth = (kind: ObjectKind, size: number) => (kind === 'cart' ? 84 : BASE[kind]) * size

/** How high above its bottom an object's label goes: the middle of its body, above a cart's wheels. */
export const objectLabelHeight = (kind: ObjectKind, size: number) => {
  const h = objectHeight(kind, size)
  // A cart's body stops 1.4 wheel radii (0.19 of its height each) above its bottom; see ObjectShape.
  return kind === 'cart' ? (h + h * 0.19 * 1.4) / 2 : h / 2
}
