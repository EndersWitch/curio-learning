// Everything a Bohr model figure draws, worked out from its settings: the
// model in its square, an ion's brackets around it, and the optional key to
// its right, like a particle diagram's (CONTEXT.md "Key").

import { chargeText } from '../orbital-diagram/configuration'
import {
  BALL_R,
  brackets as bracketsAround,
  electronRadius,
  modelSide,
  rings,
  textWidth,
  type Brackets,
  type Component,
  type ComponentLook,
  type Dot,
  type ElectronChange,
  type Ring,
} from './model'
import { ballsFor, chargeOf, drawnNucleus, neutralShells, type BohrSettings, type NucleusStyle } from './settings'

export const KEY_PAD = 12
const KEY_GAP = 24
const NAME_GAP = 12
export const KEY_FONT = 16
export const KEY_HEADING = 17
const TEXT_H = 20
const LINE_GAP = 10

export const COMPONENT_NAMES: Record<Component, string> = { proton: 'Proton', neutron: 'Neutron', electron: 'Electron' }
export const CHANGE_NAMES: Record<ElectronChange, string> = { gained: 'Gained electron', lost: 'Lost electron' }

export interface KeyLayout {
  width: number
  height: number
  headingY: number
  lines: { dot: Dot; name: string; nameX: number }[]
}

/** The key from (0, 0): one line for each component drawn as a ball or dot,
 *  and for gained and lost electrons. */
export function keyLayout(components: { component: Component; r: number; change?: ElectronChange }[]): KeyLayout | undefined {
  if (!components.length) return undefined
  const drawW = 2 * Math.max(...components.map((c) => c.r))
  const nameX = KEY_PAD + drawW + NAME_GAP
  const headingY = KEY_PAD + TEXT_H / 2
  let y = KEY_PAD + TEXT_H + LINE_GAP
  const lines = components.map(({ component, r, change }) => {
    const lineH = Math.max(2 * r, TEXT_H)
    const dot: Dot = { x: KEY_PAD + drawW / 2, y: y + lineH / 2, r, component, ...(change ? { change } : {}) }
    y += lineH + LINE_GAP
    return { dot, name: change ? CHANGE_NAMES[change] : COMPONENT_NAMES[component], nameX }
  })
  const names = Math.max(...lines.map((l) => textWidth(l.name, KEY_FONT)))
  return {
    width: Math.ceil(2 * KEY_PAD + Math.max(textWidth('Key', KEY_HEADING), drawW + NAME_GAP + names)),
    height: y - LINE_GAP + KEY_PAD,
    headingY,
    lines,
  }
}

export interface BohrFigure {
  width: number
  height: number
  /** the model's middle */
  cx: number
  cy: number
  nucleus: NucleusStyle
  balls: Dot[]
  rings: Ring[]
  /** an ion's brackets and charge, around the model's middle */
  brackets?: Brackets
  key?: KeyLayout & { x: number; y: number }
}

/** The whole figure for these settings. The model's square depends only on
 *  how many rings are drawn, brackets add the same room around every ion,
 *  and the key sits to the right, centered on the model. */
export function bohrFigure(s: BohrSettings): BohrFigure {
  const nucleus = drawnNucleus(s)
  const withSymbol = !!s.electronSymbol
  const drawnRings = rings(s.emptyRings ? s.electrons.map(() => 0) : s.electrons, s.placement, withSymbol, neutralShells(s))
  const side = modelSide(drawnRings.length)
  const charge = chargeOf(s)
  const brackets = s.brackets && charge ? bracketsAround(drawnRings.length, chargeText(charge)) : undefined
  const pad = brackets?.pad ?? { left: 0, right: 0, top: 0, bottom: 0 }
  const modelW = pad.left + side + pad.right
  const modelH = pad.top + side + pad.bottom

  const components: { component: Component; r: number; change?: ElectronChange }[] = []
  if (s.key) {
    if (nucleus === 'balls') components.push({ component: 'proton', r: BALL_R }, { component: 'neutron', r: BALL_R })
    if (!s.emptyRings) components.push({ component: 'electron', r: electronRadius(0, 1, withSymbol) })
    for (const change of ['gained', 'lost'] as const)
      if (drawnRings.some((ring) => ring.electrons.some((e) => e.change === change)))
        components.push({ component: 'electron', r: electronRadius(0, 1, withSymbol), change })
  }
  const key = keyLayout(components)
  const height = Math.max(modelH, key?.height ?? 0)
  return {
    width: modelW + (key ? KEY_GAP + key.width : 0),
    height,
    cx: pad.left + side / 2,
    cy: (height - modelH) / 2 + pad.top + side / 2,
    nucleus,
    balls: ballsFor(s),
    rings: drawnRings,
    brackets,
    key: key && { ...key, x: modelW + KEY_GAP, y: (height - key.height) / 2 },
  }
}

/** Each component's look in these settings. */
export const looks = (s: BohrSettings): Record<Component, ComponentLook> => ({
  proton: { color: s.protonColor, symbol: s.protonSymbol },
  neutron: { color: s.neutronColor, symbol: s.neutronSymbol },
  electron: { color: s.electronColor, symbol: s.electronSymbol },
})
