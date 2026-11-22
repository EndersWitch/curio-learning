import { createHash, timingSafeEqual } from 'node:crypto'

/** Compares a supplied secret with the expected one without leaking where they differ. */
export function sameSecret(given: string | null | undefined, expected: string | null | undefined): boolean {
  if (!given || !expected) return false
  const h = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(h(given), h(expected))
}
