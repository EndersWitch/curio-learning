// Where the parts of the drawn micropipette sit, in drawing units, and where
// their labels go. It stands upright: the plunger button on top of its neck,
// the handle with its finger rest and volume display, then the shaft with the tip ejector around it and the tip
// on its end. It's modeled on the common single-channel kind (Eppendorf's
// Research plus): the finger rest a hook swept back from the handle's top,
// and the tip ejector a cone around the shaft's top, just below the handle.
// The display is drawn large for the handle, so its digits stay easy to read
// in a printed figure.

import type { Pipette } from './pipette'

/** The parts that can be labeled, top to bottom. */
export const PARTS = ['plunger', 'display', 'handle', 'ejector', 'shaft', 'tip'] as const
export type Part = (typeof PARTS)[number]

export const PART_NAMES: Record<Part, string> = {
  plunger: 'Plunger button',
  display: 'Volume display',
  handle: 'Handle',
  ejector: 'Tip ejector',
  shaft: 'Shaft',
  tip: 'Tip',
}

/** Width and length of the shaft's top and bottom, and the tip it takes. */
const SHAFTS = {
  slim: { top: 14, bottom: 6, tipLength: 74 },
  medium: { top: 18, bottom: 8, tipLength: 92 },
  wide: { top: 24, bottom: 12, tipLength: 124 },
}

/** One digit wheel's height in the window, and its digits' size. */
export const WHEEL_H = 24
export const DIGIT_SIZE = 20

export function pipetteLayout(p: Pipette, withTip: boolean) {
  const cx = 40
  const shaft = SHAFTS[p.shaft]
  const handle = { top: 46, bottom: 318, half: 30, bottomHalf: 22 }
  const window = { top: 94, half: 17 }
  const wheelsTop = window.top + 5
  const wheelsBottom = wheelsTop + p.places.length * WHEEL_H
  const windowBottom = wheelsBottom + 5
  const nut = { top: handle.bottom, bottom: handle.bottom + 16, half: Math.max(19, shaft.top / 2 + 12) }
  const shaftTop = nut.bottom
  const shaftBottom = shaftTop + 170
  const halfAt = (y: number) => shaft.top / 2 + ((shaft.bottom - shaft.top) / 2) * ((y - shaftTop) / (shaftBottom - shaftTop))
  const sleeve = { top: shaftTop - 2, bottom: shaftTop + 50 }
  // The tip covers the shaft's last stretch.
  const tip = { top: shaftBottom - 22, bottom: shaftBottom - 22 + shaft.tipLength, topHalf: shaft.bottom / 2 + 4, bottomHalf: 1.5 }
  const bottom = withTip ? tip.bottom : shaftBottom
  return {
    cx,
    width: cx + 66,
    height: bottom + 2,
    /** the plunger's colored cap, on a wide neck down into the handle */
    button: { top: 0, bottom: 12, half: 13 },
    rod: { top: 12, bottom: handle.top, half: 11 },
    handle,
    /** the finger rest: a hook swept back from the handle's top, its end this low and far out */
    hook: { bottom: handle.top + 74, out: cx + 64 },
    modelY: window.top - 14,
    window: { top: window.top, bottom: windowBottom, left: cx - window.half, right: cx + window.half },
    wheels: { top: wheelsTop, bottom: wheelsBottom, left: cx - window.half + 4, right: cx + window.half - 4 },
    /** the middle of wheel `i` from the top */
    wheelY: (i: number) => wheelsTop + (i + 0.5) * WHEEL_H,
    nut,
    shaft: { top: shaftTop, bottom: shaftBottom, halfAt },
    /** the tip ejector: a sleeve around the shaft's top, narrowing from the nut */
    ejector: { sleeve, topHalf: nut.half - 3, sleeveHalf: halfAt(sleeve.bottom) + 3 },
    tip,
    withTip,
  }
}

export type PipetteLayout = ReturnType<typeof pipetteLayout>

/** The point on a part its label's line points to: a spot on its left edge. */
export function anchorOf(at: PipetteLayout, part: Part) {
  switch (part) {
    case 'plunger':
      return { x: at.cx - at.button.half, y: (at.button.top + at.button.bottom) / 2 }
    case 'display':
      return { x: at.window.left, y: (at.window.top + at.window.bottom) / 2 }
    case 'handle':
      return { x: at.cx - at.handle.half, y: (at.window.bottom + at.handle.bottom) / 2 + 10 }
    case 'ejector': {
      const y = (at.ejector.sleeve.top + at.ejector.sleeve.bottom) / 2
      return { x: at.cx - (at.ejector.topHalf + at.ejector.sleeveHalf) / 2, y }
    }
    case 'shaft': {
      const y = (at.ejector.sleeve.bottom + (at.withTip ? at.tip.top : at.shaft.bottom)) / 2
      return { x: at.cx - at.shaft.halfAt(y), y }
    }
    case 'tip': {
      const y = at.tip.top + (at.tip.bottom - at.tip.top) * 0.4
      const t = (y - at.tip.top) / (at.tip.bottom - at.tip.top)
      return { x: at.cx - (at.tip.topHalf + (at.tip.bottomHalf - at.tip.topHalf) * t), y }
    }
  }
}

/** The parts drawn: all of them, less the tip when there's none. */
export const partsShown = (at: PipetteLayout) => PARTS.filter((p) => p !== 'tip' || at.withTip)

/**
 * Heights for labels wanting to sit level with `ys` (top to bottom), each at
 * least `gap` below the one above, kept between `top` and `bottom` where they
 * fit. Each is moved as little as it can be.
 */
export function spreadLabels(ys: number[], gap: number, top: number, bottom: number) {
  const out = ys.map((y) => Math.max(top, y))
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap)
  // Pushed past the bottom: slide the stack back up, keeping its gaps.
  const over = out.length ? out[out.length - 1] - bottom : 0
  if (over > 0) {
    out[out.length - 1] -= over
    for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - gap)
  }
  return out
}

/** Room left of the pipette for its labels, the least room between them, and their size. */
export const LABELS = { width: 168, gap: 22, font: 14 }
