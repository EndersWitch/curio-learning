// A generator's live settings, set up the same way on every generator page:
// Physics' settings (see ./settings) in the shared generator state, saved
// under the names teachers' undo history and presets already have.
// Call during component setup.

import { generatorState } from '$shared/generatorState.svelte'
import type { SettingsDef } from './settings'

export function createGenerator<T extends object>(def: SettingsDef<T>, id: string) {
  return generatorState({ tidy: def.clean, fromParams: def.fromParams, toQuery: def.toQuery, keyOf: def.toQuery }, id, {
    history: `physicsfigures.${id}.history`,
    presets: `physicsfigures.${id}.presets`,
  })
}
