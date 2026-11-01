// A gas syringe's scale, and where things sit on the drawing: a glass barrel
// lying on its side, its nozzle on the left, with a plunger pushed out to the
// right by the gas collected. Readings grow from 0 at the nozzle end.

import type { Scale } from '../volume-reading/scale'

export const SYRINGE_SIZES = ['50', '100'] as const
export type SyringeSize = (typeof SYRINGE_SIZES)[number]

/** What the scale is printed in. They're the same size (1 cm³ = 1 mL), so
 *  changing it never changes the reading. */
export const VOLUME_UNITS = ['cm3', 'mL'] as const
export type VolumeUnit = (typeof VOLUME_UNITS)[number]

export const UNIT_SYMBOLS: Record<VolumeUnit, string> = { cm3: 'cm³', mL: 'mL' }

/** The syringe alone, or set up to collect gas: joined by a delivery tube to
 *  a conical flask, and clamped on a stand. */
export const SETUPS = ['syringe', 'setup'] as const
export type Setup = (typeof SETUPS)[number]

/** Marks every 1, numbered every 10 with a medium mark at 5, like the
 *  100 mL graduated cylinder; read to 0.1. */
export function syringeScale(size: SyringeSize): Scale {
  return { capacity: Number(size), lowest: 0, labelEvery: 10, minorEvery: 1, decimals: 1, readsDown: false }
}

/** What a figure's syringe is called, e.g. "100 cm³ gas syringe". */
export const syringeName = (size: SyringeSize, unit: VolumeUnit) => `${size} ${UNIT_SYMBOLS[unit]} gas syringe`

// Every size has the same scale length, and only the barrel's thickness
// changes (like the graduated cylinders).
const SCALE_L = 360
const BARREL_H: Record<SyringeSize, number> = { '50': 46, '100': 56 }

/**
 * The syringe in its own units: the nozzle's open end at x = 0 and the
 * barrel's axis at y = 0. The plunger's glass piston is as long as the
 * barrel, so it sticks out past the barrel's open end by as much gas as the
 * syringe holds; the drawing is always wide enough for a full syringe, so
 * every reading on one size gives a figure the same size.
 */
export function syringeGeometry(scale: Scale, size: SyringeSize) {
  const barrelH = BARREL_H[size]
  const half = barrelH / 2
  const nozzleEnd = 24
  /** where the cone from the nozzle opens into the barrel, and 0 is marked */
  const xZero = nozzleEnd + 14
  const perUnit = SCALE_L / scale.capacity
  const xOf = (v: number) => xZero + v * perUnit
  /** the barrel's open end, past an unmarked stretch beyond the last mark */
  const barrelEnd = xOf(scale.capacity) + 40
  const lip = 6
  // The piston reaches 10 past the lip when the syringe is empty, then a
  // narrow stem joins it to the knob the plunger is pulled by.
  const piston = barrelEnd + lip + 10 - xZero
  const stem = 14
  const knob = 8
  return {
    barrelH,
    half,
    nozzleEnd,
    nozzleHalf: 5,
    xZero,
    xOf,
    perUnit,
    barrelEnd,
    lip,
    piston,
    stem,
    knob,
    /** room above the barrel for the unit */
    top: -half - 22,
    bottom: half + lip,
    width: xOf(scale.capacity) + piston + stem + knob + 1,
  }
}

export type SyringeGeometry = ReturnType<typeof syringeGeometry>

/**
 * Where the flask, delivery tube and stand sit around the syringe, in the
 * syringe's units (its nozzle's end at x = 0, its axis at y = 0): the flask
 * down on the bench to the left, its tube rising through the bung and across
 * to the nozzle, and the stand's clamp on the unmarked end of the barrel.
 */
export function setupGeometry(g: SyringeGeometry) {
  const bench = 200
  const flask = { cx: -104, bottomHalf: 64, shoulder: bench - 120, neckHalf: 17, neckTop: bench - 146 }
  const clampX = g.barrelEnd - 20
  return {
    bench,
    flask,
    bung: { top: flask.neckTop - 9, bottom: flask.neckTop + 16, half: flask.neckHalf + 6 },
    /** the tube's lower end, inside the flask */
    tubeBottom: flask.neckTop + 44,
    tubeHalf: 3,
    /** the rubber sleeve joining the tube to the nozzle */
    sleeve: { left: -14, right: 12, half: 8 },
    clamp: { x: clampX, half: 7, reach: 7 },
    base: { x: clampX, half: 80, h: 12 },
    left: flask.cx - flask.bottomHalf - 2,
  }
}

/** Where the syringe sits in a figure with or without its setup, and how big
 *  that drawing is. */
export function syringeLayout(scale: Scale, size: SyringeSize, setup: Setup) {
  const g = syringeGeometry(scale, size)
  const around = setup === 'setup' ? setupGeometry(g) : null
  const offset = { x: around ? -around.left : 0, y: -g.top }
  const bottom = around ? around.bench + 1 : g.bottom + 1
  return { g, around, offset, width: offset.x + g.width, height: offset.y + bottom }
}
