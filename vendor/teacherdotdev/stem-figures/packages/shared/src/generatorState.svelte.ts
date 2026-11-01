// Everything a generator page does with its settings, set up in one call
// during component setup: read them from the page address (on the server too,
// per ADR 0001), keep the address in step as they change, record undo steps
// and save presets.

import { replaceState } from '$app/navigation'
import { page } from '$app/state'
import { createHistory } from './history.svelte'
import { createPresetStore } from './presetStore'

interface SettingsDefinition<S> {
  tidy(stored: unknown): S
  fromParams(params: URLSearchParams): S
  toQuery(s: S): string
  keyOf(s: S): string
}

/** Where undo history and presets are saved in the browser, for a site whose
 *  teachers already have them saved under other names. */
interface StorageKeys {
  history: string
  presets: string
}

export function generatorState<S extends object>(
  definition: SettingsDefinition<S>,
  id: string,
  storageKeys: StorageKeys = { history: `${id}-history`, presets: `${id}-presets` },
) {
  const s = $state(definition.fromParams(page.url.searchParams)) as S
  const snapshot = () => definition.tidy($state.snapshot(s))
  const apply = (next: S) => Object.assign(s, definition.tidy(next))

  // The address already shows the first settings; only changes are written,
  // which also keeps this from running before SvelteKit's router is ready.
  let written = definition.toQuery(snapshot())
  $effect(() => {
    const query = definition.toQuery(snapshot())
    if (query === written) return
    written = query
    replaceState(query ? `?${query}` : page.url.pathname, {})
  })

  const history = createHistory({
    read: snapshot,
    write: apply,
    keyOf: definition.keyOf,
    tidy: definition.tidy,
    storageKey: storageKeys.history,
  })
  const presets = createPresetStore(storageKeys.presets, definition.tidy)
  const same = (a: S, b: S) => definition.keyOf(a) === definition.keyOf(b)

  return { s, snapshot, apply, history, presets, same }
}
