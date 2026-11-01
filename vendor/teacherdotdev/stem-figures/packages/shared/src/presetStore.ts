// Saved presets for one generator, kept in this browser's localStorage only.
// `tidy` turns any stored or live settings into the part a preset keeps.

export interface Preset<S> {
  name: string
  settings: S
}

export type PresetStore<S> = ReturnType<typeof createPresetStore<S>>

export function createPresetStore<S>(storageKey: string, tidy: (stored: unknown) => S) {
  function write(list: Preset<S>[]) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(list))
    } catch {
      /* storage blocked: the preset lasts until the page closes */
    }
  }

  return {
    /** Read the saved presets. Call in the browser only (e.g. from onMount). */
    load(): Preset<S>[] {
      try {
        const list = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
        if (!Array.isArray(list)) return []
        return list
          .filter((p) => p && typeof p.name === 'string' && p.settings && typeof p.settings === 'object')
          .map((p): Preset<S> => ({ name: p.name, settings: tidy(p.settings) }))
      } catch {
        return []
      }
    },
    /** Save (or replace, by name) a preset and return the new list. */
    save(list: Preset<S>[], name: string, settings: S) {
      const next = [...list.filter((p) => p.name !== name), { name, settings: tidy(settings) }]
      write(next)
      return next
    },
    remove(list: Preset<S>[], name: string) {
      const next = list.filter((p) => p.name !== name)
      write(next)
      return next
    },
  }
}
